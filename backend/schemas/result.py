from pydantic import BaseModel
from datetime import date


class PlayerResultDTO(BaseModel):
    player_id: str
    total_points: int
    mc_total: int
    position: int
    tied: bool
    # tied = True para todos los miembros de un grupo empatado (mismo total y mismos M€),
    # incluido el primero (D-17, v2.0).

class GameResultDTO(BaseModel):
    game_id: str
    date: date
    results: list[PlayerResultDTO]

