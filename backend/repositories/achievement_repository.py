from datetime import date
from db.models import PlayerAchievement
from db.session import get_session
from sqlalchemy.dialects.postgresql import insert as pg_insert


class AchievementRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def upsert(self, player_id: str, code: str, tier: int) -> None:
        """
        Insert or update a player achievement.
        Invariant: tier NEVER goes down. If existing tier >= new tier, this is a no-op.
        Uses ON CONFLICT DO UPDATE with WHERE clause for atomicity.
        """
        stmt = pg_insert(PlayerAchievement).values(
            player_id=player_id,
            code=code,
            tier=tier,
            unlocked_at=date.today(),
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["player_id", "code"],
            set_={
                "tier": stmt.excluded.tier,
                "unlocked_at": stmt.excluded.unlocked_at,
            },
            where=PlayerAchievement.tier < stmt.excluded.tier,
        )
        with self._session_factory() as session:
            session.execute(stmt)
            session.commit()

    def get_for_player(self, player_id: str) -> list[PlayerAchievement]:
        """Return all achievement rows for a player."""
        with self._session_factory() as session:
            return (
                session.query(PlayerAchievement)
                .filter(PlayerAchievement.player_id == player_id)
                .all()
            )

    def get_all(self) -> list[PlayerAchievement]:
        """Return all achievement rows across all players."""
        with self._session_factory() as session:
            return session.query(PlayerAchievement).all()
