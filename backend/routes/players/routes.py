from fastapi import APIRouter, HTTPException
from schemas.player_profile import PlayerProfileDTO
from services.player_profile.service import PlayerProfileService
from repositories.players.repository import PlayersRepository
from repositories.games.repository import GamesRepository
from repositories.container import games_repository, players_repository

router = APIRouter(
    prefix="/players",
    tags=["Players"],
)


# Service
player_profile_service = PlayerProfileService(
    players_repository=players_repository,
    games_repository=games_repository,
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
