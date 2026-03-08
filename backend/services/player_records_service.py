from models.record_entry import get_player_id
from services.record_calculators.registry import ALL_CALCULATORS


class PlayerRecordsService:
    def __init__(self, games_repository):
        self.games_repository = games_repository
        self._calculators = ALL_CALCULATORS

    def get_player_records(self, player_id: str) -> dict[str, bool]:
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
