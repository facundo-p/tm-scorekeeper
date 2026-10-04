from fastapi import APIRouter, Depends

from mappers.achievement_mapper import catalog_item_to_dto
from models.game_subset import GameSubset
from routes.dependencies import table_subset, view_of
from schemas.achievement import AchievementCatalogResponseDTO
from services.container import achievements_service

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("/catalog", response_model=AchievementCatalogResponseDTO)
def get_catalog(subset: GameSubset = Depends(table_subset)):
    items = [catalog_item_to_dto(d, holders) for d, holders in achievements_service.get_catalog(subset)]
    return AchievementCatalogResponseDTO(achievements=items, view=view_of(subset))
