from datetime import date

from db.session import get_session
from db.models import PlayerEloHistory as PlayerEloHistoryORM
from models.elo_change import EloChange


class EloRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def save_elo_changes(
        self,
        game_id: str,
        recorded_at: date,
        changes: list[EloChange],
    ) -> None:
        with self._session_factory() as session:
            for change in changes:
                session.add(
                    PlayerEloHistoryORM(
                        player_id=change.player_id,
                        game_id=game_id,
                        elo_before=change.elo_before,
                        elo_after=change.elo_after,
                        delta=change.delta,
                        recorded_at=recorded_at,
                    )
                )
            session.commit()

    def get_changes_for_game(self, game_id: str) -> list[EloChange]:
        with self._session_factory() as session:
            orms = (
                session.query(PlayerEloHistoryORM)
                .filter(PlayerEloHistoryORM.game_id == game_id)
                .all()
            )
            return [
                EloChange(
                    player_id=o.player_id,
                    elo_before=o.elo_before,
                    elo_after=o.elo_after,
                    delta=o.delta,
                )
                for o in orms
            ]

    def delete_changes_for_game(self, game_id: str) -> None:
        with self._session_factory() as session:
            session.query(PlayerEloHistoryORM).filter(
                PlayerEloHistoryORM.game_id == game_id
            ).delete(synchronize_session=False)
            session.commit()

    def has_any_history(self) -> bool:
        with self._session_factory() as session:
            return session.query(PlayerEloHistoryORM.id).first() is not None
