# The old RecordsService has been removed – we compute global records
# directly using the available record calculators. This keeps the
# dependency surface small and avoids resurrecting a service that we no
# longer intend to use.

from models.record_entry import get_player_id
from services.record_calculators.highest_single_game_score import HighestSingleGameScoreCalculator
from services.record_calculators.most_games_played import MostGamesPlayedCalculator
from services.record_calculators.most_games_won import MostGamesWonCalculator


class PlayerRecordsService:
    def __init__(self, games_repository):
        # reuse the calculators already exercised in GameRecordsService
        self.games_repository = games_repository
        # we can either use GameRecordsService or calculate directly; using
        # the calculators keeps behaviour consistent with the rest of the
        # codebase.
        self._calculators = [
            HighestSingleGameScoreCalculator(),
            MostGamesPlayedCalculator(),
            MostGamesWonCalculator(),
        ]

    def get_player_records(self, player_id: str) -> dict[str, bool]:
        """Return a mapping record_code -> bool indicating if *player_id* is
        the current holder of that global record.

        The implementation mirrors the original behaviour of
        RecordsService.get_global_records by running each calculator over all
        games and comparing the winner to the requested player.
        """
        games = self.games_repository.list_games()
        if not games:
            return {}

        records: dict[str, bool] = {}
        for calc in self._calculators:
            entry = calc.calculate(games)
            if entry:
                pid = get_player_id(entry)
                if pid is not None:
                    records[calc.code] = pid == player_id
        return records