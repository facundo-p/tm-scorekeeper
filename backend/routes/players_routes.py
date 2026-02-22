from fastapi import APIRouter, HTTPException
from schemas.player_profile import PlayerProfileDTO
from services.player_profile_service import PlayerProfileService
from repositories.container import games_repository, players_repository
from services.records_service import RecordsService
from services.player_records_service import PlayerRecordsService
from schemas.player import PlayerCreateDTO, PlayerCreatedResponseDTO
from services.player_service import PlayerService


router = APIRouter(
    prefix="/players",
    tags=["Players"],
)

player_service = PlayerService(
    player_repository=players_repository
)

# Global records service
records_service = RecordsService(
    games_repository=games_repository
)

player_records_service = PlayerRecordsService(
    records_service=records_service
)

player_profile_service = PlayerProfileService(
    players_repository=players_repository,
    games_repository=games_repository,
    player_records_service=player_records_service,
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
    player_id = player_service.create_player(dto)
    return PlayerCreatedResponseDTO(player_id=player_id)
