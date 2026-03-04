from .highest_single_game_score import HighestSingleGameScoreCalculator


def get_record_calculators():
    return [
        HighestSingleGameScoreCalculator(),
    ]