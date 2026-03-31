from fastapi import APIRouter
from services.achievements_service import AchievementsService
from schemas.achievement import AchievementCatalogResponseDTO
from repositories.container import games_repository, achievement_repository, players_repository

router = APIRouter(prefix="/achievements", tags=["Achievements"])

achievements_service = AchievementsService(
    games_repository=games_repository,
    achievement_repository=achievement_repository,
    players_repository=players_repository,
)


@router.get("/catalog", response_model=AchievementCatalogResponseDTO)
def get_catalog():
    items = achievements_service.get_catalog()
    return AchievementCatalogResponseDTO(achievements=items)
