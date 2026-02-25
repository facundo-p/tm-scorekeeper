from uuid import uuid4
from models.game import Game


class GamesRepository:
    def __init__(self):
        # Mock de persistencia en memoria
        self._games: dict[str, Game] = {}

    def create(self, game: Game) -> str:
        game_id = str(uuid4())
        game.id = game_id
        self._games[game_id] = game
        return game_id

    def list(self) -> dict[str, Game]:
        return self._games

    def update(self, game_id: str, game: Game) -> bool:
        if game_id not in self._games:
            return False

        game.id = game_id
        self._games[game_id] = game
        return True

    def delete(self, game_id: str) -> bool:
        if game_id not in self._games:
            return False

        del self._games[game_id]
        return True

    def get(self, game_id: str) -> Game | None:
        return self._games.get(game_id)

    def get_games_by_player(self, player_id: str):
        result = []

        for game in self._games.values():
            for player in game.player_results:
                if player.player_id == player_id:
                    result.append(game)
                    break

        return result

    def list_games(self):
        return list(self._games.values())
