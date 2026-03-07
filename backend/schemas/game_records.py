from pydantic import BaseModel


class RecordResultDTO(BaseModel):
    game_id: str | None
    value: int
    player_name: str


class RecordComparisonDTO(BaseModel):
    description: str
    achieved: bool
    compared: RecordResultDTO | None
    current: RecordResultDTO