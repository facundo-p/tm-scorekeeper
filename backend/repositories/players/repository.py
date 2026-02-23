import uuid
from models.player import Player

class PlayersRepository:
    def __init__(self):
        self._players: dict[str, Player] = {}

    def create(self, player: Player) -> Player:
        player_id = str(uuid.uuid4())
        player.player_id = player_id
        self._players[player_id] = player
        return player

    def get(self, player_id: str) -> Player:
        if player_id not in self._players:
            raise KeyError(f"Player '{player_id}' not found")

        return self._players[player_id]
    
    def update(self, player: Player) -> Player:
        if player.player_id not in self._players:
            raise KeyError(f"Player '{player.player_id}' not found")

        self._players[player.player_id] = player
        return player
