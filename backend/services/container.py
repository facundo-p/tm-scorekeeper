"""Dependency container for service-layer instances.

Services compose repositories from `repositories.container`. Routes import
service singletons from this module. Repositories never live here.
"""

from repositories.container import (
    achievement_repository,
    elo_repository,
    games_repository,
    players_repository,
)
from services.achievements_service import AchievementsService
from services.elo_service import EloService


elo_service = EloService(
    elo_repository=elo_repository,
    players_repository=players_repository,
    games_repository=games_repository,
)

achievements_service = AchievementsService(
    games_repository=games_repository,
    achievement_repository=achievement_repository,
    players_repository=players_repository,
)
