from typing import List
from collections import Counter
from services.helpers.records import max_counter_entries
from models.game import Game
from models.record_entry import RecordEntry, RecordAttribute, LABEL_PLAYER
from services.record_calculators.base import RecordCalculator
from services.helpers.results import calculate_results


class MostGamesWonCalculator(RecordCalculator):

    code = "most_games_won"
    description = "Más PARTIDAS GANADAS"
    title = "Estratega extraordinario"

    def games_for_current(self, games_until_current):
        return games_until_current

    def calculate(self, games: List[Game]) -> RecordEntry | None:

        if not games:
            return None

        wins = Counter()

        for game in games:
            results = calculate_results(game)

            winner = results.results[0]
            wins[winner.player_id] += 1

        max_wins, players_with_record = max_counter_entries(wins)

        if max_wins is None:
            return None

        return RecordEntry(
            value=max_wins,
            title=self.title,
            attributes=[
                RecordAttribute(label=LABEL_PLAYER, value=p)
                for p in players_with_record
            ],
        )
