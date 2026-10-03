from datetime import date

from sqlalchemy import func

from db.session import get_session
from db.uow import session_scope
from db.models import Game as GameORM, PlayerEloHistory as PlayerEloHistoryORM
from repositories.elo_filters import EloHistoryFilter
from models.elo_change import EloChange


# Orden canónico de las filas (D-56): fecha, created_at de la partida e id de la partida.
_CHRONOLOGICAL = (PlayerEloHistoryORM.recorded_at, GameORM.created_at, PlayerEloHistoryORM.game_id)
_REVERSE_CHRONOLOGICAL = tuple(col.desc() for col in _CHRONOLOGICAL)


def _with_game(query):
    return query.join(GameORM, GameORM.id == PlayerEloHistoryORM.game_id)


class EloRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def save_elo_changes(
        self,
        game_id: str,
        recorded_at: date,
        changes: list[EloChange],
    ) -> None:
        with session_scope(self._session_factory) as session:
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

    def get_changes_for_game(self, game_id: str) -> list[EloChange]:
        with session_scope(self._session_factory) as session:
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
        with session_scope(self._session_factory) as session:
            session.query(PlayerEloHistoryORM).filter(
                PlayerEloHistoryORM.game_id == game_id
            ).delete(synchronize_session=False)

    def has_any_history(self) -> bool:
        with session_scope(self._session_factory) as session:
            return session.query(PlayerEloHistoryORM.id).first() is not None

    def delete_changes_from_date(self, start_date: date) -> None:
        with session_scope(self._session_factory) as session:
            session.query(PlayerEloHistoryORM).filter(
                PlayerEloHistoryORM.recorded_at >= start_date
            ).delete(synchronize_session=False)

    def get_baseline_elo_before(self, start_date: date) -> dict[str, int]:
        """
        Devuelve el último elo_after por jugador considerando solo registros con
        recorded_at < start_date. Jugadores sin historial previo quedan ausentes
        (el caller asigna DEFAULT_ELO).
        """
        with session_scope(self._session_factory) as session:
            rows = (
                _with_game(session.query(PlayerEloHistoryORM))
                .filter(PlayerEloHistoryORM.recorded_at < start_date)
                .order_by(PlayerEloHistoryORM.player_id, *_CHRONOLOGICAL)
                .all()
            )
            baseline: dict[str, int] = {}
            for r in rows:
                baseline[r.player_id] = r.elo_after
            return baseline

    def get_peak_for_player(self, player_id: str) -> int | None:
        """Return MAX(elo_after) for the player, or None if no history exists.

        Per CONTEXT D-03: peak is computed on-the-fly from PlayerEloHistory.elo_after.
        No new column. Recalculates automatically after `recompute_from_date`.
        """
        with session_scope(self._session_factory) as session:
            return (
                session.query(func.max(PlayerEloHistoryORM.elo_after))
                .filter(PlayerEloHistoryORM.player_id == player_id)
                .scalar()
            )

    def get_last_change_for_player(self, player_id: str) -> EloChange | None:
        """Return the most recent EloChange for the player.

        Order: canonical order reversed (recorded_at, game created_at, game_id; D-56). Used to derive `last_delta` for the elo-summary endpoint.
        """
        with session_scope(self._session_factory) as session:
            orm = (
                _with_game(session.query(PlayerEloHistoryORM))
                .filter(PlayerEloHistoryORM.player_id == player_id)
                .order_by(*_REVERSE_CHRONOLOGICAL)
                .first()
            )
            if orm is None:
                return None
            return EloChange(
                player_id=orm.player_id,
                elo_before=orm.elo_before,
                elo_after=orm.elo_after,
                delta=orm.delta,
            )

    def get_history(self, filter: EloHistoryFilter) -> list[PlayerEloHistoryORM]:
        """
        Devuelve filas de PlayerEloHistory ordenadas por jugador y en orden canónico (D-56),
        opcionalmente filtradas por fecha desde y/o conjunto de player_ids.
        UNA sola query indexada (recorded_at y player_id son index=True).
        """
        with session_scope(self._session_factory) as session:
            query = _with_game(session.query(PlayerEloHistoryORM))
            if filter.date_from is not None:
                query = query.filter(PlayerEloHistoryORM.recorded_at >= filter.date_from)
            if filter.player_ids is not None:
                query = query.filter(PlayerEloHistoryORM.player_id.in_(filter.player_ids))
            rows = query.order_by(PlayerEloHistoryORM.player_id, *_CHRONOLOGICAL).all()
            return list(rows)
