from services.record_calculators.registry import ALL_CALCULATORS


class GameRecordsService:

    def __init__(self, games_repository):
        self.games_repository = games_repository
        self._calculators = ALL_CALCULATORS

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

    def get_global_records(self):
        games = self.games_repository.list_games()
        return [
            {"code": c.code, "title": c.title, "emoji": c.emoji, "description": c.description, "entry": c.calculate(games)}
            for c in self._calculators
        ]
