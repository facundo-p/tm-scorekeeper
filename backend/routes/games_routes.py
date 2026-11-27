from fastapi import APIRouter, Depends, HTTPException, Query
from db.uow import unit_of_work
from typing import Optional
from services.game_service import GameConflict, GameNotFound, GamesService
from schemas.game import GameDTO
from repositories.container import (
    games_repository,
    players_repository,
)
from services.container import derived_service, report_service
from repositories.game_filters import GameFilter
from mappers.report_mapper import report_to_dto, summary_to_dto
from models.game_subset import GameSubset
from routes.dependencies import game_subset
from schemas.report import GameReportDTO, GameSummaryDTO, GameWriteResponseDTO


router = APIRouter(
    prefix="/games",
    tags=["Games"]
)

games_service = GamesService(
    games_repository=games_repository,
    players_repository=players_repository,
    derived_service=derived_service,
)


def _require_game(game_id: str) -> None:
    if games_repository.get(game_id) is None:
        raise HTTPException(status_code=404, detail="Game not found")


def _player_names_map() -> dict[str, str]:
    return {p.player_id: p.name for p in players_repository.get_all()}


def _report(game_id: str) -> GameReportDTO:
    return report_to_dto(report_service.report(game_id), _player_names_map())


@router.post("/", response_model=GameWriteResponseDTO)
def create_game(game: GameDTO):
    try:
        # El informe se arma en la misma transacción: si falla, la partida no queda a medias (D-66).
        with unit_of_work(lock=True):
            game_id = games_service.create_game(game)
            report = _report(game_id)
        return GameWriteResponseDTO(id=game_id, game=game, report=report)
    except GameConflict as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=list[GameDTO])
def list_games(game_ids: Optional[list[str]] = Query(default=None)):
    filters = GameFilter(game_ids=set(game_ids)) if game_ids else None
    return games_service.list_games(filters)


@router.get("/summaries", response_model=list[GameSummaryDTO])
def list_game_summaries(subset: GameSubset = Depends(game_subset)):
    """Filas del archivo, de la más nueva a la más vieja (STAT-09)."""
    return [summary_to_dto(s) for s in report_service.summaries(subset)]


@router.get("/{game_id}/report", response_model=GameReportDTO)
def get_game_report(game_id: str):
    """Informe de la partida, siempre sobre todas las partidas (STAT-10)."""
    try:
        return _report(game_id)
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found")


@router.put("/{game_id}", response_model=GameWriteResponseDTO)
def update_game(game_id: str, game: GameDTO):
    try:
        with unit_of_work(lock=True):
            games_service.update_game(game_id, game)
            report = _report(game_id)
    except GameNotFound:
        raise HTTPException(status_code=404, detail="Game not found")
    except GameConflict as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return GameWriteResponseDTO(id=game_id, game=game, report=report, message="Game updated successfully")


@router.delete("/{game_id}")
def delete_game(game_id: str):
    try:
        games_service.delete_game(game_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Game not found")

    return {"message": "Game deleted successfully"}
