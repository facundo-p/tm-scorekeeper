class FakePlayersRepository:
    def __init__(self, players):
        self.players = players

    def get(self, player_id):
        return self.players[player_id]


class FakeGamesRepository:
    def __init__(self, games_by_player):
        self.games_by_player = games_by_player

    def get_games_by_player(self, player_id):
        return self.games_by_player.get(player_id, [])
