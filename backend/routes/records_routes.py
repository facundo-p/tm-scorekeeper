from fastapi import APIRouter, Depends, HTTPException

from mappers.records_mapper import record_history_to_dto, record_to_dto
from models.game_subset import GameSubset
from repositories.container import games_repository, players_repository
from routes.dependencies import game_subset
from schemas.records import GlobalRecordDTO, RecordHistoryDTO
from services.player_service import PlayerService
from services.records.service import RecordsService, UnknownRecord

router = APIRouter(prefix="/records", tags=["Records"])


def _player_names() -> dict:
    return {p.player_id: p.name for p in PlayerService(players_repository).get_players()}


@router.get("/", response_model=list[GlobalRecordDTO])
def get_global_records(subset: GameSubset = Depends(game_subset)):
    names = _player_names()
    return [record_to_dto(v, names) for v in RecordsService(games_repository).records(subset)]


@router.get("/{code}/history", response_model=RecordHistoryDTO)
def get_record_history(code: str, subset: GameSubset = Depends(game_subset)):
    try:
        view = RecordsService(games_repository).history(code, subset)
    except UnknownRecord:
        raise HTTPException(status_code=404, detail="Récord inexistente")
    return record_history_to_dto(view, _player_names())
