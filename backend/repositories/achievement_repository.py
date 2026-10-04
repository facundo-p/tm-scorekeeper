"""Niveles de logro derivados (`achievement_unlocks`, F23) y metadatos (`app_meta`, D-13)."""
from dataclasses import dataclass
from datetime import date
from typing import Optional

from sqlalchemy import delete

from db.models import AchievementUnlock, AppMeta
from db.session import get_session
from db.uow import session_scope


@dataclass(frozen=True)
class UnlockRow:
    player_id: str
    code: str
    tier: int
    game_id: str
    unlocked_on: date


def _row(u: AchievementUnlock) -> UnlockRow:
    return UnlockRow(u.player_id, u.code, u.tier, u.game_id, u.unlocked_on)


class AchievementRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def replace_all(self, rows: list[UnlockRow]) -> None:
        """Reemplaza todos los niveles por los recién derivados (en la unidad de trabajo activa)."""
        with session_scope(self._session_factory) as session:
            session.execute(delete(AchievementUnlock))
            session.add_all(AchievementUnlock(**vars(r)) for r in rows)

    def get_all(self) -> list[UnlockRow]:
        with session_scope(self._session_factory) as session:
            return [_row(u) for u in session.query(AchievementUnlock).order_by(AchievementUnlock.id)]

    def get_for_game(self, game_id: str) -> list[UnlockRow]:
        """Niveles alcanzados en una partida."""
        with session_scope(self._session_factory) as session:
            query = session.query(AchievementUnlock).filter(AchievementUnlock.game_id == game_id)
            return [_row(u) for u in query.order_by(AchievementUnlock.id)]


class AppMetaRepository:
    def __init__(self, session_factory=get_session):
        self._session_factory = session_factory

    def get(self, key: str) -> Optional[str]:
        with session_scope(self._session_factory) as session:
            row = session.get(AppMeta, key)
            return row.value if row else None

    def set(self, key: str, value: str) -> None:
        with session_scope(self._session_factory) as session:
            session.merge(AppMeta(key=key, value=value))
