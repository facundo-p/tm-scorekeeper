from typing import List
from collections import Counter
from services.helpers.records import max_counter_entries
from models.game import Game
from models.record_entry import RecordEntry, RecordAttribute, LABEL_PLAYER
from services.record_calculators.base import RecordCalculator


class MostGamesPlayedCalculator(RecordCalculator):

    code = "most_games_played"
    description = "Más PARTIDAS JUGADAS"
    title = "Colono persistente"
    emoji = "🎮"

    def games_for_current(self, games_until_current):
        return games_until_current

    def calculate(self, games: List[Game]) -> RecordEntry | None:

        if not games:
            return None

        counter = Counter()

        for game in games:
            for pr in game.player_results:
                counter[pr.player_id] += 1

        max_games, players_with_record = max_counter_entries(counter)

        return RecordEntry(
            value=max_games,
            title=self.title,
            attributes=[
                RecordAttribute(label=LABEL_PLAYER, value=p)
                for p in players_with_record
            ],
        )