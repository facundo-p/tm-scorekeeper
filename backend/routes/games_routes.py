from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.player_service import PlayerService
from mappers.record_comparison_mapper import record_comparison_to_dto
from mappers.elo_mapper import elo_changes_to_dtos
from schemas.game_records import RecordComparisonDTO
from schemas.elo import EloChangeDTO
from services.game_records_service import GameRecordsService
from services.game_service import GamesService
from schemas.game import GameDTO, GameCreatedResponseDTO
from schemas.result import GameResultDTO
from repositories.container import (
    games_repository,
    players_repository,
    elo_repository,
)
from services.container import achievements_service, elo_service
from repositories.game_filters import GameFilter
from schemas.achievement import AchievementsByPlayerResponseDTO



router = APIRouter(
    prefix="/games",
    tags=["Games"]
)

games_service = GamesService(
    games_repository=games_repository,
    players_repository=players_repository,
    elo_service=elo_service,
)


def _player_names_map() -> dict[str, str]:
    return {p.player_id: p.name for p in players_repository.get_all()}


@router.post("/", response_model=GameCreatedResponseDTO)
def create_game(game: GameDTO):
    try:
        game_id = games_service.create_game(game)
        return {"id": game_id, "game": game}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/", response_model=list[GameDTO])
def list_games(game_ids: Optional[list[str]] = Query(default=None)):
    filters = GameFilter(game_ids=set(game_ids)) if game_ids else None
    return games_service.list_games(filters)



@router.get("/{game_id}/results", response_model=GameResultDTO)
def get_game_results(game_id: str):
    try:
        return games_service.get_game_results(game_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Game not found")



@router.put("/{game_id}")
def update_game(game_id: str, game: GameDTO):
    try:
        games_service.update_game(game_id, game)
    except ValueError:
        raise HTTPException(status_code=404, detail="Game not found")

    return {"message": "Game updated successfully"}



@router.delete("/{game_id}")
def delete_game(game_id: str):
    try:
        games_service.delete_game(game_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Game not found")

    return {"message": "Game deleted successfully"}

@router.get("/{game_id}/records", response_model=list[RecordComparisonDTO])
def get_game_records(game_id: str):
    service = GameRecordsService(games_repository)
    comparisons = service.get_records_for_game(game_id)

    players_service = PlayerService(players_repository)
    players = players_service.get_players()

    return [
        record_comparison_to_dto(c, players)
        for c in comparisons
    ]


@router.get("/{game_id}/elo", response_model=list[EloChangeDTO])
def get_game_elo_changes(game_id: str):
    if games_repository.get(game_id) is None:
        raise HTTPException(status_code=404, detail="Game not found")

    changes = elo_repository.get_changes_for_game(game_id)
    return elo_changes_to_dtos(changes, _player_names_map())


@router.post("/{game_id}/achievements", response_model=AchievementsByPlayerResponseDTO)
def trigger_achievements(game_id: str):
    result = achievements_service.evaluate_for_game(game_id)
    return AchievementsByPlayerResponseDTO(achievements_by_player=result)
