import datetime as dt
from typing import Literal, Optional

from pydantic import BaseModel

from schemas.game_records import RecordResultDTO

RecordValue = int | float


class RecordHolderDTO(BaseModel):
    player_id: str
    player_name: str
    game_id: Optional[str] = None  # solo en récords de partida
    date: Optional[dt.date] = None
    map: Optional[str] = None


class RecordHistoryEntryDTO(BaseModel):
    value: RecordValue
    player_id: str  # quien lo estableció, rompió o se sumó al empate
    player_name: str
    holders: list[str]
    game_id: str
    date: dt.date
    kind: Literal["set", "broken", "tied"]


class GlobalRecordDTO(BaseModel):
    code: str
    description: str
    title: str | None = None
    emoji: str | None = None  # contrato viejo (frontend previo a F28)
    record: RecordResultDTO | None  # contrato viejo: primer poseedor y fecha
    scope: Literal["game", "career"]
    unit: str
    lower_is_better: bool
    value: RecordValue | None
    holders: list[RecordHolderDTO]
    history: list[RecordHistoryEntryDTO]


class RecordHistoryDTO(BaseModel):
    code: str
    value: RecordValue | None
    holders: list[RecordHolderDTO]
    history: list[RecordHistoryEntryDTO]
