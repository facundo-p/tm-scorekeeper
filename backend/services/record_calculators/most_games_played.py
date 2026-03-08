from typing import List
from collections import Counter
from models.game import Game
from models.record_entry import RecordEntry, RecordAttribute, LABEL_PLAYER
from services.record_calculators.base import RecordCalculator


class MostGamesPlayedCalculator(RecordCalculator):

    code = "most_games_played"
    description = "Most games played"

    def calculate(self, games: List[Game]) -> RecordEntry | None:

        if not games:
            return None

        counter = Counter()

        for game in games:
            for pr in game.player_results:
                counter[pr.player_id] += 1

        player_id, value = counter.most_common(1)[0]

        return RecordEntry(
            value=value,
            attributes=[
                RecordAttribute(label=LABEL_PLAYER, value=player_id),
            ],
        )
