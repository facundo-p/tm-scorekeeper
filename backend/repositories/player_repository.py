from datetime import date
from uuid import uuid4

from sqlalchemy import func

from db.models import Game as GameORM
from db.models import Player as PlayerORM
from db.models import PlayerResult as PlayerResultORM
from db.session import get_session
from db.uow import session_scope
from models.player import Player
from models.player_colors import first_free


def _to_model(o: PlayerORM) -> Player:
    return Player(player_id=o.id, name=o.name, is_active=o.is_active, elo=o.elo, color=o.color, seq=o.seq, joined_on=o.joined_on)


class PlayersRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def create(self, player: Player) -> Player:
        """Insert a new player. A new id (and the first free color, if active) are assigned if missing."""
        player.player_id = player.player_id or str(uuid4())
        with session_scope(self._session_factory) as session:
            if session.get(PlayerORM, player.player_id):
                raise ValueError(f"Player '{player.player_id}' already exists")
            player.color = player.color or first_free(self._active_colors(session))
            # Sin fecha de alta, la base pone la del día (D-78).
            joined = {"joined_on": player.joined_on} if player.joined_on else {}
            session.add(PlayerORM(id=player.player_id, name=player.name, is_active=player.is_active,
                                  elo=player.elo, color=player.color, **joined))
        return player

    def get(self, player_id: str) -> Player:
        with session_scope(self._session_factory) as session:
            orm = session.get(PlayerORM, player_id)
            if not orm:
                raise KeyError(f"Player '{player_id}' not found")
            return _to_model(orm)

    def update(self, player: Player) -> None:
        with session_scope(self._session_factory) as session:
            orm = session.get(PlayerORM, player.player_id)
            if not orm:
                raise KeyError(f"Player '{player.player_id}' not found")
            orm.name = player.name
            orm.is_active = player.is_active
            orm.elo = player.elo
            orm.color = player.color or orm.color
            session.add(orm)

    def get_all(self) -> list[Player]:
        """Todos los jugadores, en orden de alta (D-74)."""
        with session_scope(self._session_factory) as session:
            return [_to_model(o) for o in session.query(PlayerORM).order_by(PlayerORM.seq).all()]

    @staticmethod
    def _active_colors(session) -> list[str]:
        return [c for (c,) in session.query(PlayerORM.color).filter(PlayerORM.is_active.is_(True))]

    def first_game_dates(self) -> dict[str, date]:
        """Fecha de la primera partida de cada jugador que jugó alguna (`since`, STAT-08)."""
        with session_scope(self._session_factory) as session:
            rows = (session.query(PlayerResultORM.player_id, func.min(GameORM.date))
                    .join(GameORM, GameORM.id == PlayerResultORM.game_id)
                    .group_by(PlayerResultORM.player_id))
            return dict(rows.all())

    def get_active_players_ranked(self) -> list[Player]:
        """Return active players ordered by elo DESC, tie-break by player_id ASC.

        Position = index+1 in this list. Total = len(this list). Order is
        deterministic (CONTEXT D-06: stable order by player_id, NOT dense rank).
        """
        with session_scope(self._session_factory) as session:
            orms = (
                session.query(PlayerORM)
                .filter(PlayerORM.is_active.is_(True))
                .order_by(PlayerORM.elo.desc(), PlayerORM.id.asc())
                .all()
            )
            return [_to_model(o) for o in orms]

    def bulk_update_elo(self, elo_by_player: dict[str, int]) -> None:
        """Persist new ELO values for several players in a single transaction."""
        if not elo_by_player:
            return
        with session_scope(self._session_factory) as session:
            for player_id, new_elo in elo_by_player.items():
                orm = session.get(PlayerORM, player_id)
                if orm is None:
                    raise KeyError(f"Player '{player_id}' not found")
                orm.elo = new_elo
