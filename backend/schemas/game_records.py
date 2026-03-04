from pydantic import BaseModel


class RecordResultDTO(BaseModel):
    game_id: str
    value: int
    player_name: str


class RecordComparisonDTO(BaseModel):
    description: str
    achieved: bool
    previous: RecordResultDTO | None
    current: RecordResultDTO