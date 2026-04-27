from pydantic import BaseModel


class EloChangeDTO(BaseModel):
    player_id: str
    player_name: str
    elo_before: int
    elo_after: int
    delta: int
