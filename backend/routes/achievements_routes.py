from fastapi import APIRouter, Depends

from mappers.achievement_mapper import catalog_item_to_dto
from models.game_subset import GameSubset
from routes.dependencies import table_subset, view_of
from schemas.achievement import AchievementCatalogResponseDTO, PlayerReconcileChangeDTO, ReconcileResponseDTO
from services.container import achievements_service

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("/catalog", response_model=AchievementCatalogResponseDTO)
def get_catalog(subset: GameSubset = Depends(table_subset)):
    items = [catalog_item_to_dto(d, holders) for d, holders in achievements_service.get_catalog(subset)]
    return AchievementCatalogResponseDTO(achievements=items, view=view_of(subset))


@router.post("/reconcile", response_model=ReconcileResponseDTO)
def reconcile_achievements():
    """Regenera los logros desde el historial (lo mismo que hace cada escritura de partidas)."""
    summary = achievements_service.reconcile_all()
    return ReconcileResponseDTO(
        total_players=summary.total_players,
        players_updated=summary.players_updated,
        achievements_applied=[
            PlayerReconcileChangeDTO(code=c.code, old_tier=c.old_tier, new_tier=c.new_tier)
            for c in summary.achievements_applied
        ],
        errors=summary.errors,
    )
