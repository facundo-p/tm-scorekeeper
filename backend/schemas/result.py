from pydantic import BaseModel
from datetime import date


class PlayerResultDTO(BaseModel):
    player_id: str
    total_points: int
    mc_total: int
    position: int
    tied: bool
    # tied = True indica que el jugador comparte la posición con el jugador anterior (no abre una nueva posición).
    # El primer jugador de un grupo empatado tiene tied = False.

class GameResultDTO(BaseModel):
    game_id: str
    date: date
    results: list[PlayerResultDTO]

