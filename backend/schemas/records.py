from pydantic import BaseModel
from schemas.game_records import RecordResultDTO


class GlobalRecordDTO(BaseModel):
    code: str
    description: str
    title: str | None = None
    emoji: str | None = None
    record: RecordResultDTO | None
