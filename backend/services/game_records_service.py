from models.record_comparison import RecordComparison
from services.record_calculators.registry import get_record_calculators


class GameRecordsService:

    def __init__(self, games_repository):
        self.games_repository = games_repository
        self._calculators = get_record_calculators()

    def get_records_for_game(self, game_id: str):

        current_game = self.games_repository.get(game_id)

        all_games = sorted(
            self.games_repository.list_games(),
            key=lambda g: (g.date, g.id)
        )

        previous_games = []

        for g in all_games:
            if g.id == current_game.id:
                break
            previous_games.append(g)

        comparisons = []

        for calculator in self._calculators:

            previous_record = calculator.calculate(previous_games)

            new_record = calculator.calculate([current_game])

            if new_record is None:
                continue

            achieved = (
                previous_record is None
                or new_record.value > previous_record.value
            )

            comparison = RecordComparison(
                code=calculator.code,
                description=calculator.description,
                achieved=achieved,
                previous=previous_record,
                current=new_record,
            )

            comparisons.append(comparison)

        return comparisons