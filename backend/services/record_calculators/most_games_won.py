from typing import List
from collections import Counter
from models.game import Game
from models.record_entry import RecordEntry
from services.record_calculators.base import RecordCalculator
from services.helpers.results import calculate_results


class MostGamesWonCalculator(RecordCalculator):

    code = "most_games_won"
    description = "Most games won"

    def calculate(self, games: List[Game]) -> RecordEntry | None:

        if not games:
            return None

        wins = Counter()

        for game in games:
            results = calculate_results(game)

            winner = results.results[0]
            wins[winner.player_id] += 1

        player_id, value = wins.most_common(1)[0]

        return RecordEntry(
            code=self.code,
            description=self.description,
            value=value,
            player_id=player_id,
            game_id=None,
        )