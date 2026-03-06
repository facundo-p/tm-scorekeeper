from fastapi import APIRouter, HTTPException
from services.player_service import PlayerService
from mappers.record_comparison_mapper import record_comparison_to_dto
from schemas.game_records import RecordComparisonDTO
from services.game_records_service import GameRecordsService
from services.game_service import GamesService
from schemas.game import GameDTO, GameCreatedResponseDTO
from schemas.result import GameResultDTO
from repositories.container import games_repository, players_repository



router = APIRouter(
    prefix="/games",
    tags=["Games"]
)

games_service = GamesService(
    games_repository=games_repository,
    players_repository=players_repository,
)

@router.post("/", response_model=GameCreatedResponseDTO)
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

@router.get("/{game_id}/records", response_model=list[RecordComparisonDTO])
def get_game_records(game_id: str):

    #Le asignamos al service el repositorio completo de partidas.
    service = GameRecordsService(games_repository)

    """
    Creamos una lista de comparaciones de records para la partida dada,
    usando el método get_records_for_game del service.
    Este método se encarga de evaluar cada uno de los record calculators
    con las partidas hasta la actual, y devuelve una lista de comparaciones
    """
    comparisons = service.get_records_for_game(game_id)


    players_service = PlayerService(players_repository)

    # Cargamos todos los jugadores una sola vez.
    # Esto evita que el mapper tenga que consultar la base de datos en cada conversión de record a DTO.
    players = players_service.get_players()

    """#Devolvemos una lista de RecordComparisonDTOs,
    mapeando cada comparación obtenida a un DTO usando la función record_comparison_to_dto,
    y pasando el repositorio de jugadores para luego obtener
    el nombre de cada jugador usando su id."""
    return [
        record_comparison_to_dto(c, players)
        for c in comparisons
    ]