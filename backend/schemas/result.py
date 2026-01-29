from pydantic import BaseModel
from datetime import date


class PlayerResultDTO(BaseModel):
    player_id: str
    total_points: int
    mc_total: int
    position: int
    tied: bool

class GameResultDTO(BaseModel):
    game_id: str
    date: date
    results: list[PlayerResultDTO]

