from sqlalchemy.orm import Session

from db.session import get_session
from db.models import Player as PlayerORM
from models.player import Player


class PlayersRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def create(self, player: Player) -> Player:
        """Insert a new player. A new id will be assigned if missing."""
        if not player.player_id:
            from uuid import uuid4

            player.player_id = str(uuid4())

        with self._session_factory() as session:
            existing = session.get(PlayerORM, player.player_id)
            if existing:
                # conflict; could raise or update
                raise ValueError(f"Player '{player.player_id}' already exists")
            orm = PlayerORM(
                id=player.player_id,
                name=player.name,
                is_active=player.is_active,
            )
            session.add(orm)
            session.commit()
        return player

    def get(self, player_id: str) -> Player:
        with self._session_factory() as session:
            orm = session.get(PlayerORM, player_id)
            if not orm:
                raise KeyError(f"Player '{player_id}' not found")
            return Player(
                player_id=orm.id,
                name=orm.name,
                is_active=orm.is_active,
            )

    def update(self, player: Player) -> None:
        with self._session_factory() as session:
            orm = session.get(PlayerORM, player.player_id)
            if not orm:
                raise KeyError(f"Player '{player.player_id}' not found")
            orm.name = player.name
            orm.is_active = player.is_active
            session.add(orm)
            session.commit()

    def get_all(self) -> list[Player]:
        with self._session_factory() as session:
            orms = session.query(PlayerORM).all()
            return [
                Player(player_id=o.id, name=o.name, is_active=o.is_active)
                for o in orms
            ]

    def get(self, player_id: str) -> Player:
        with self._session_factory() as session:
            orm = session.get(PlayerORM, player_id)
            if not orm:
                raise KeyError(f"Player '{player_id}' not found")
            return Player(
                player_id=orm.id,
                name=orm.name,
                is_active=orm.is_active,
            )
