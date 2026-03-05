from services.record_calculators.highest_single_game_score import HighestSingleGameScoreCalculator
from services.record_calculators.most_games_played import MostGamesPlayedCalculator
from services.record_calculators.most_games_won import MostGamesWonCalculator


class GameRecordsService:

    def __init__(self, games_repository):
        self.games_repository = games_repository
        self._calculators = [
        HighestSingleGameScoreCalculator(),
        MostGamesPlayedCalculator(),
        MostGamesWonCalculator(),
    ]

    def get_records_for_game(self, game_id: str):

        all_games = sorted(
            self.games_repository.list_games(),
            key=lambda g: (g.date, g.id)
        )

        games_until_current = []

        for g in all_games:
            games_until_current.append(g)

            if g.id == game_id:
                break

        comparisons = []

        for calculator in self._calculators:

            comparison = calculator.evaluate(games_until_current)

            if comparison:
                comparisons.append(comparison)

        return comparisons