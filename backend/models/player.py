from datetime import date
from typing import Optional

class Player:
    def __init__(
        self,
        player_id: Optional[str],
        name: str,
        is_active: bool = True,
        elo: int = 1000,
        color: Optional[str] = None,  # sin color, el repositorio asigna el primero libre
        seq: Optional[int] = None,  # orden de alta (D-74); lo asigna la base
        joined_on: Optional[date] = None,  # fecha de alta (D-78); la asigna la base
    ):
        self.player_id = player_id
        self.name = name
        self.is_active = is_active
        self.elo = elo
        self.color = color
        self.seq = seq
        self.joined_on = joined_on
