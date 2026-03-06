from schemas.records import RecordDTO


from services.record_calculators.highest_single_game_score import (
    HighestSingleGameScoreCalculator,
)
from services.record_calculators.most_games_played import (
    MostGamesPlayedCalculator,
)
from services.record_calculators.most_games_won import (
    MostGamesWonCalculator,
)
from schemas.records import RecordDTO


class RecordsService:

    def __init__(self, games_repository):
        self.games_repository = games_repository

        # Lista de calculators (escalable a futuro)
        self._calculators = [
            HighestSingleGameScoreCalculator(),
            MostGamesPlayedCalculator(),
            MostGamesWonCalculator(),
        ]

    def get_global_records(self) -> dict[str, RecordDTO]:

        games = self.games_repository.list_games()

        records = {}

        for calculator in self._calculators:
            entry = calculator.calculate(games)

            if entry is None:
                continue

            # Mapear dominio → DTO existente
            record_dto = RecordDTO(
                type=calculator.code,
                value=entry.value,
                player_id=entry.player_id,
                game_id=entry.game_id,
            )

            records[calculator.code] = record_dto

        return records