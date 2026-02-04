from uuid import uuid4
from models import GameDTO

class GamesRepository:
    def __init__(self):
        # Mock de persistencia en memoria
        self._games: dict[str, GameDTO] = {}
        #Es un diccionario cuya clave es el id del juego y cuyo valor es el juego (GameDTO)

    def create(self, game: GameDTO) -> str:
        game_id = str(uuid4())
        game.id = game_id
        self._games[game_id] = game
        return game_id
    #Recibe un GameDTO, le asigna un id, lo guarda en el repo y devuelve el id

    def list(self) -> dict[str, GameDTO]:
        return self._games
    #Lista todas las partidas devolviendo el repositorio
    
    def update(self, game_id: str, game: GameDTO) -> bool:
        """
        Reemplaza una partida existente.
        Devuelve True si se actualizó, False si no existe.
        """
        if game_id not in self._games:
            return False

        self._games[game_id] = game
        return True

    def delete(self, game_id: str) -> bool:
        """
        Elimina una partida.
        Devuelve True si se eliminó, False si no existe.
        """
        if game_id not in self._games:
            return False

        del self._games[game_id]
        return True
    
    def get(self, game_id: str) -> GameDTO | None:
        """
        Devuelve una partida por ID o None si no existe.
        """
        return self._games.get(game_id)
    
    def get_games_by_player(self, player_id: str):
        """
        Devuelve todas las partidas en las que participó el jugador.
        """
        result = []

        for game in self._games.values():
            for player in game.players:
                if player.player_id == player_id:
                    result.append(game)
                    break  # ya sabemos que participa en esta partida

        return result

