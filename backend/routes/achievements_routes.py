from fastapi import APIRouter
from services.container import achievements_service
from schemas.achievement import AchievementCatalogResponseDTO, ReconcileResponseDTO, PlayerReconcileChangeDTO

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("/catalog", response_model=AchievementCatalogResponseDTO)
def get_catalog():
    items = achievements_service.get_catalog()
    return AchievementCatalogResponseDTO(achievements=items)


@router.post("/reconcile", response_model=ReconcileResponseDTO)
def reconcile_achievements():
    summary = achievements_service.reconcile_all()
    return ReconcileResponseDTO(
        total_players=summary.total_players,
        players_updated=summary.players_updated,
        achievements_applied=[
            PlayerReconcileChangeDTO(
                code=c.code,
                old_tier=c.old_tier,
                new_tier=c.new_tier,
            )
            for c in summary.achievements_applied
        ],
        errors=summary.errors,
    )
