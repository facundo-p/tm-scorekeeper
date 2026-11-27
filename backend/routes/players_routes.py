from fastapi import APIRouter, Depends, HTTPException, Query
from repositories.container import players_repository
from schemas.player import PlayerCreateDTO, PlayerCreatedResponseDTO, PlayerResponseDTO, PlayerUpdateDTO
from services.player_service import PlayerService
from services.container import achievements_service, insights_service
from typing import Optional
from schemas.achievement import PlayerAchievementsResponseDTO
from schemas.insights import PlayerInsightsDTO
from models.player_colors import ColorTaken
from mappers.achievement_mapper import player_achievement_to_dto
from models.game_subset import GameSubset
from routes.dependencies import table_subset, view_of

router = APIRouter(
    prefix="/players",
    tags=["Players"],
)

player_service = PlayerService(
    player_repository=players_repository
)

@router.post("/", response_model=PlayerCreatedResponseDTO)
def create_player(dto: PlayerCreateDTO):
    try:
        player_id = player_service.create_player(dto)
    except ColorTaken as e:
        raise HTTPException(status_code=409, detail=str(e))
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
    except ColorTaken as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Devuelve la lista de jugadores con query opcional para filtrar activos y no activos.
@router.get("/", response_model=list[PlayerResponseDTO])
def list_players(active: Optional[bool] = Query(default=None)):
    players = player_service.get_players(active=active)
    since = player_service.first_game_dates()
    return [
        PlayerResponseDTO(
            player_id=p.player_id,
            name=p.name,
            is_active=p.is_active,
            elo=p.elo,
            color=p.color,
            since=p.joined_on or since.get(p.player_id),
            seq=p.seq,
        )
        for p in players
    ]


@router.get("/{player_id}/insights", response_model=PlayerInsightsDTO)
def get_player_insights(player_id: str, subset: GameSubset = Depends(table_subset)):
    """Ficha del jugador frente al grupo (STAT-11); con mesa, todo sale de ese tamaño de mesa."""
    try:
        players_repository.get(player_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Player not found")
    return PlayerInsightsDTO(view=view_of(subset), **insights_service.insights(player_id, subset))


@router.get("/{player_id}/achievements", response_model=PlayerAchievementsResponseDTO)
def get_player_achievements(player_id: str, subset: GameSubset = Depends(table_subset)):
    try:
        players_repository.get(player_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Player not found")
    states = achievements_service.get_player_achievements(player_id, subset)
    return PlayerAchievementsResponseDTO(achievements=[player_achievement_to_dto(s) for s in states],
                                         view=view_of(subset))
