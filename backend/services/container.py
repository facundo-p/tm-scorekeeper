"""Dependency container for service-layer instances.

Services compose repositories from `repositories.container`. Routes import
service singletons from this module. Repositories never live here.
"""

from repositories.container import (
    elo_repository,
    games_repository,
    players_repository,
)
from services.elo_service import EloService


elo_service = EloService(
    elo_repository=elo_repository,
    players_repository=players_repository,
    games_repository=games_repository,
)
