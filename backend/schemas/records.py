from pydantic import BaseModel


class RecordDTO(BaseModel):
    type: str
    value: int
    player_id: str
    game_id: str | None = None