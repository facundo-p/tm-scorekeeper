from typing import Optional

class Player:
    def __init__(self, player_id: Optional[str], name: str):
        self.player_id = player_id
        self.name = name