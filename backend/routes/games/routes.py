from fastapi import APIRouter, HTTPException
from services.games.service import GamesService
from models import GameDTO, GameCreatedResponse, GameListItemDTO
from schemas.result import GameResultDTO
from repositories.games.repository import GamesRepository



router = APIRouter(
    prefix="/games",
    tags=["Games"]
)

games_repository = GamesRepository()
games_service = GamesService(games_repository)

@router.post("/", response_model=GameCreatedResponse)
def create_game(game: GameDTO):
    try:
        game_id = games_service.create_game(game)
        return {"id": game_id, "game": game}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/", response_model=list[GameDTO])
def list_games():
    return games_service.list_games()



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
