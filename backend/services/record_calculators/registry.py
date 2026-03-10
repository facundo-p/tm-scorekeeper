from .highest_terraform_rating import HighestTerraformRatingCalculator
from .highest_single_game_score import HighestSingleGameScoreCalculator
from .most_games_played import MostGamesPlayedCalculator
from .most_games_won import MostGamesWonCalculator

ALL_CALCULATORS = [
    HighestSingleGameScoreCalculator(),
    MostGamesPlayedCalculator(),
    MostGamesWonCalculator(),
    HighestTerraformRatingCalculator()
]
