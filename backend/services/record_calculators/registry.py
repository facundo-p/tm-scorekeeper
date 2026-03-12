from .highest_city_points import HighestCityPointsCalculator
from .highest_greenery_points import HighestGreeneryPointsCalculator
from .highest_turmoil_point import HighestTurmoilPointsCalculator
from .highest_card_points import HighestCardPointsCalculator
from .highest_card_resource_points import HighestCardResourcePointsCalculator
from .highest_terraform_rating import HighestTerraformRatingCalculator
from .highest_single_game_score import HighestSingleGameScoreCalculator
from .most_games_played import MostGamesPlayedCalculator
from .most_games_won import MostGamesWonCalculator

ALL_CALCULATORS = [
    HighestSingleGameScoreCalculator(),
    MostGamesPlayedCalculator(),
    MostGamesWonCalculator(),
    HighestTerraformRatingCalculator,
    HighestCardPointsCalculator,
    HighestCardResourcePointsCalculator,
    HighestGreeneryPointsCalculator,
    HighestCityPointsCalculator,
    HighestTurmoilPointsCalculator
]
