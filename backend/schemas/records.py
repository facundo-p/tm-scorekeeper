from pydantic import BaseModel
from schemas.game_records import RecordResultDTO


class GlobalRecordDTO(BaseModel):
    code: str
    description: str
    record: RecordResultDTO | None
