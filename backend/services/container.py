"""Dependency container for service-layer instances.

Services compose repositories from `repositories.container`. Routes import
service singletons from this module. Repositories never live here.
"""

from repositories.container import (
    achievement_repository,
    app_meta_repository,
    elo_repository,
    games_repository,
    players_repository,
)
from services.achievements_service import AchievementsService
from services.auth_service import AuthService
from services.derived_service import DerivedService
from services.report_service import GameReportService
from services.insights_service import InsightsService
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

derived_service = DerivedService(
    elo_service=elo_service,
    achievements_service=achievements_service,
    app_meta_repository=app_meta_repository,
)

report_service = GameReportService(
    games_repository=games_repository,
    elo_repository=elo_repository,
    achievements_service=achievements_service,
)

insights_service = InsightsService(
    games_repository=games_repository,
    players_repository=players_repository,
)

auth_service = AuthService()
