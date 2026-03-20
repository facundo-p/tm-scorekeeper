from fastapi import APIRouter
from services.game_records_service import GameRecordsService
from services.player_service import PlayerService
from mappers.record_comparison_mapper import entry_to_result
from schemas.records import GlobalRecordDTO
from repositories.container import games_repository, players_repository

router = APIRouter(prefix="/records", tags=["Records"])


@router.get("/", response_model=list[GlobalRecordDTO])
def get_global_records():
    service = GameRecordsService(games_repository)
    raw = service.get_global_records()
    players_by_id = {p.player_id: p for p in PlayerService(players_repository).get_players()}
    return [
        GlobalRecordDTO(
            code=r["code"],
            title=r["title"],
            description=r["description"],
            record=entry_to_result(r["entry"], players_by_id) if r["entry"] else None,
        )
        for r in raw
    ]
