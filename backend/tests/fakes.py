from models.game import GameDTO
from models.player import EndStatsDTO, PlayerDTO, ScoresDTO


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

class FakeGamesRepositoryForRecords:
    def __init__(self, games):
        self._games = games

    def list_games(self):
        return self._games
    

def make_player(player_id: str) -> PlayerDTO:
    return PlayerDTO(
        player_id=player_id,
        corporation="TestCorp",
        scores=ScoresDTO(
            terraform_rating=0,
            milestone_points=0,
            milestones=[],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=0,
        ),
        end_stats=EndStatsDTO(mc_total=0),
    )


def make_game(game_id: str, players: list[PlayerDTO]) -> GameDTO:
    return GameDTO(
        id=game_id,
        date="2026-01-01",
        map="Hellas",
        expansions=[],
        draft=False,
        generations=10,
        players=players,
        awards=[],
    )