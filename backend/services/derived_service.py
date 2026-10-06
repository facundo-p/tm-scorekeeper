"""Datos derivados del historial: ELO guardado y logros (F23, STAT-05, D-13).

Toda escritura de partidas recalcula, dentro de su misma transacción y con el lock de
partidas, primero el ELO y después los logros (#44). `derived_version` permite recalcular
todo al arrancar cuando cambian las reglas de derivación.
"""
import logging
from datetime import date

from db.uow import unit_of_work

logger = logging.getLogger(__name__)

# Subir cuando cambie cómo se derivan el ELO o los logros: el próximo arranque recalcula.
DERIVED_VERSION = 1
VERSION_KEY = "derived_version"


class DerivedService:
    """Cada método público abre su unidad de trabajo con el lock; anidarlas es intencional (D-55):
    la interna se suma a la externa y el lock es reentrante dentro de la transacción."""

    def __init__(self, elo_service, achievements_service, app_meta_repository):
        self.elo_service = elo_service
        self.achievements_service = achievements_service
        self.app_meta_repository = app_meta_repository

    def recompute_from(self, start_date: date) -> None:
        with unit_of_work(lock=True):
            self.elo_service.recompute_from_date(start_date)
            self.achievements_service.recompute_all()

    def recompute_all(self) -> None:
        with unit_of_work(lock=True):
            self.recompute_from(date.min)
            self.app_meta_repository.set(VERSION_KEY, str(DERIVED_VERSION))

    def stored_version(self) -> int:
        stored = self.app_meta_repository.get(VERSION_KEY)
        return int(stored) if stored and stored.isdigit() else 0

    def ensure_current(self) -> bool:
        """Al arrancar: recalcula todo si la versión guardada quedó atrás. True si recalculó."""
        with unit_of_work(lock=True):
            if self.stored_version() >= DERIVED_VERSION:
                return False
            logger.info("derived_version %s < %s: recalculando ELO y logros", self.stored_version(), DERIVED_VERSION)
            self.recompute_all()
            return True
