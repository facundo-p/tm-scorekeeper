from datetime import date

from pydantic import BaseModel


class EloChangeDTO(BaseModel):
    player_id: str
    player_name: str
    elo_before: int
    elo_after: int
    delta: int


class EloHistoryPointDTO(BaseModel):
    recorded_at: date
    game_id: str
    elo_after: int
    delta: int


class PlayerEloHistoryDTO(BaseModel):
    player_id: str
    player_name: str
    points: list[EloHistoryPointDTO]
