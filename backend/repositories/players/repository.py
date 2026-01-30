class PlayersRepository:
    def __init__(self):
        # Mock simple: conjunto de player_ids conocidos
        self._players: set[str] = set()

    def register_player(self, player_id: str):
        """
        Registra un jugador en el repositorio mock.
        """
        self._players.add(player_id)

    def get(self, player_id: str):
        """
        Devuelve el player_id si existe.
        Lanza KeyError si no existe.
        """
        if player_id not in self._players:
            raise KeyError(f"Player '{player_id}' not found")

        return player_id
