from fastapi import APIRouter
from services.achievements_service import AchievementsService
from schemas.achievement import AchievementCatalogResponseDTO, ReconcileResponseDTO, PlayerReconcileChangeDTO
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
