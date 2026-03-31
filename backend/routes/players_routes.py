from fastapi import APIRouter, HTTPException, Query
from schemas.player_profile import PlayerProfileDTO
from services.player_profile_service import PlayerProfileService
from repositories.container import games_repository, players_repository, achievement_repository
from services.player_records_service import PlayerRecordsService
from schemas.player import PlayerCreateDTO, PlayerCreatedResponseDTO, PlayerResponseDTO, PlayerUpdateDTO
from services.player_service import PlayerService
from typing import Optional
from services.achievements_service import AchievementsService
from schemas.achievement import PlayerAchievementsResponseDTO

router = APIRouter(
    prefix="/players",
    tags=["Players"],
)

player_service = PlayerService(
    player_repository=players_repository
)

# The records computations are handled by PlayerRecordsService directly.
player_records_service = PlayerRecordsService(games_repository=games_repository)

player_profile_service = PlayerProfileService(
    players_repository=players_repository,
    games_repository=games_repository,
    player_records_service=player_records_service,
)

achievements_service = AchievementsService(
    games_repository=games_repository,
    achievement_repository=achievement_repository,
    players_repository=players_repository,
)


@router.get("/{player_id}/profile", response_model=PlayerProfileDTO)
def get_player_profile(player_id: str):
    """
    Devuelve el perfil agregado de un jugador:
    - estadísticas
    - historial de partidas
    """
    try:
        return player_profile_service.get_profile(player_id)
    except KeyError:
        # El repo no encontró el jugador
        raise HTTPException(
            status_code=404,
            detail=f"Player '{player_id}' not found",
        )
    

@router.post("/", response_model=PlayerCreatedResponseDTO)
def create_player(dto: PlayerCreateDTO):
    try:
        player_id = player_service.create_player(dto)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return PlayerCreatedResponseDTO(player_id=player_id)


@router.patch("/{player_id}")
def update_player(player_id: str, dto: PlayerUpdateDTO):
    try:
        player_service.update_player(player_id, dto)
        return {"message": "Player updated successfully"}
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"Player '{player_id}' not found",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# Devuelve la lista de jugadores con query opcional para filtrar activos y no activos.
@router.get("/", response_model=list[PlayerResponseDTO])
def list_players(active: Optional[bool] = Query(default=None)):
    players = player_service.get_players(active=active)
    return [
        PlayerResponseDTO(
            player_id=p.player_id,
            name=p.name,
            is_active=p.is_active,
        )
        for p in players
    ]


@router.get("/{player_id}/achievements", response_model=PlayerAchievementsResponseDTO)
def get_player_achievements(player_id: str):
    items = achievements_service.get_player_achievements(player_id)
    return PlayerAchievementsResponseDTO(achievements=items)
