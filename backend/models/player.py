from typing import Optional

class Player:
    def __init__(
        self,
        player_id: Optional[str],
        name: str,
        is_active: bool = True,
        elo: int = 1000,
    ):
        self.player_id = player_id
        self.name = name
        self.is_active = is_active
        self.elo = elo
