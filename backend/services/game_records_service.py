from services.record_calculators.highest_single_game_score import HighestSingleGameScoreCalculator
from services.record_calculators.most_games_played import MostGamesPlayedCalculator
from services.record_calculators.most_games_won import MostGamesWonCalculator


class GameRecordsService:

    def __init__(self, games_repository):
        self.games_repository = games_repository

        # Se inicializan los calculadores de records que se van a usar para evaluar los records de los juegos.
        self._calculators = [
        HighestSingleGameScoreCalculator(),
        MostGamesPlayedCalculator(),
        MostGamesWonCalculator(),
    ]

    def get_records_for_game(self, game_id: str):
        # Se obtienen todas las partidas ordenadas por fecha e ID para evaluar los records hasta la partida dada.
        all_games = sorted(
            self.games_repository.list_games(),
            key=lambda g: (g.date, g.id)
        )

        games_until_current = []
        # Creamos una lista de partidas hasta la partida dada para evaluar los records solo con esas partidas.
        for g in all_games:
            games_until_current.append(g)

            if g.id == game_id:
                break

        comparisons = []

        for calculator in self._calculators:

            """
            Se evalúa el record usando el método evaluate,
            que recibe la lista de partidas hasta la actual y devuelve una comparación.
            """
            comparison = calculator.evaluate(games_until_current)

            """ 
            Si se obtiene una comparación válida
            (devuelve None si no se puede evaluar el record por no haber partidas),
            se agrega a la lista de comparaciones que se va a devolver.
            """
            if comparison:
                comparisons.append(comparison)

        return comparisons