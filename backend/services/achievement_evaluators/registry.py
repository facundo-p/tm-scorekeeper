from services.achievement_evaluators.single_game_threshold import SingleGameThresholdEvaluator
from services.achievement_evaluators.accumulated import AccumulatedEvaluator
from services.achievement_evaluators.win_streak import WinStreakEvaluator
from services.achievement_evaluators.all_maps import AllMapsEvaluator
from services.achievement_evaluators.definitions import HIGH_SCORE, GAMES_PLAYED, GAMES_WON, WIN_STREAK, ALL_MAPS
from services.helpers.results import calculate_results


def _count_games(player_id, games):
    """Count games where player participated."""
    return sum(
        1 for g in games
        if any(pr.player_id == player_id for pr in g.player_results)
    )


def _count_wins(player_id, games):
    """Count games where player won outright (not tied)."""
    wins = 0
    for g in games:
        if not any(pr.player_id == player_id for pr in g.player_results):
            continue
        results = calculate_results(g)
        if results.results and results.results[0].player_id == player_id and not results.results[0].tied:
            wins += 1
    return wins


def _high_score_extractor(player_id, game, game_result):
    """Extract total_points for player from GameResultDTO."""
    for r in game_result.results:
        if r.player_id == player_id:
            return r.total_points
    return 0


ALL_EVALUATORS = [
    SingleGameThresholdEvaluator(HIGH_SCORE, extractor=_high_score_extractor),
    AccumulatedEvaluator(GAMES_PLAYED, counter=_count_games),
    AccumulatedEvaluator(GAMES_WON, counter=_count_wins),
    WinStreakEvaluator(WIN_STREAK),
    AllMapsEvaluator(ALL_MAPS),
]
