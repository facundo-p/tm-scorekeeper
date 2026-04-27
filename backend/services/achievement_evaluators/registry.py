from services.achievement_evaluators.single_game_threshold import SingleGameThresholdEvaluator
from services.achievement_evaluators.accumulated import AccumulatedEvaluator
from services.achievement_evaluators.win_streak import WinStreakEvaluator
from services.achievement_evaluators.all_maps import AllMapsEvaluator
from services.achievement_evaluators.definitions import (
    HIGH_SCORE, GAMES_PLAYED, GAMES_WON, WIN_STREAK, GREENERY_TILES, ALL_MAPS,
    MILESTONE_MASTER, NO_MILESTONE_WIN, AWARD_MASTER, NO_AWARD_WIN, STOLEN_AWARDS,
    CARD_POINTS,
)
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


def _milestone_master_extractor(player_id, game, game_result):
    """Return 1 if player won the game AND claimed all 3 milestones."""
    for pr in game.player_results:
        if pr.player_id == player_id and len(pr.scores.milestones) == 3:
            if game_result.results and game_result.results[0].player_id == player_id and not game_result.results[0].tied:
                return 1
    return 0


def _no_milestone_win_extractor(player_id, game, game_result):
    """Return 1 if player finished 1st (including ties) with 0 milestones claimed."""
    for pr in game.player_results:
        if pr.player_id == player_id and len(pr.scores.milestones) == 0:
            for r in game_result.results:
                if r.player_id == player_id and r.position == 1:
                    return 1
    return 0


def _award_master_extractor(player_id, game, game_result):
    """Return 1 if player finished 1st (including ties) and is in first_place of all 3 awards."""
    if len(game.awards) != 3:
        return 0
    for r in game_result.results:
        if r.player_id == player_id and r.position == 1:
            if all(player_id in a.first_place for a in game.awards):
                return 1
    return 0


def _no_award_win_extractor(player_id, game, game_result):
    """Return 1 if player finished 1st (including ties) and is not in first_place of any award."""
    for r in game_result.results:
        if r.player_id == player_id and r.position == 1:
            if not any(player_id in a.first_place for a in game.awards):
                return 1
    return 0


def _stolen_awards_extractor(player_id, game, game_result):
    """Count awards where player is the sole first place AND didn't open the award."""
    stolen = 0
    for a in game.awards:
        if a.first_place == [player_id] and a.opened_by != player_id:
            stolen += 1
    return stolen


def _card_points_extractor(player_id, game, game_result):
    """Extract card_points for player from game."""
    for pr in game.player_results:
        if pr.player_id == player_id:
            return pr.scores.card_points
    return 0


def _count_greenery_tiles(player_id, games):
    """Sum greenery_points across all games for player."""
    total = 0
    for g in games:
        for pr in g.player_results:
            if pr.player_id == player_id:
                total += pr.scores.greenery_points
    return total


ALL_EVALUATORS = [
    SingleGameThresholdEvaluator(HIGH_SCORE, extractor=_high_score_extractor),
    AccumulatedEvaluator(GAMES_PLAYED, counter=_count_games),
    AccumulatedEvaluator(GAMES_WON, counter=_count_wins),
    WinStreakEvaluator(WIN_STREAK),
    AccumulatedEvaluator(GREENERY_TILES, counter=_count_greenery_tiles),
    AllMapsEvaluator(ALL_MAPS),
    SingleGameThresholdEvaluator(MILESTONE_MASTER, extractor=_milestone_master_extractor),
    SingleGameThresholdEvaluator(NO_MILESTONE_WIN, extractor=_no_milestone_win_extractor),
    SingleGameThresholdEvaluator(AWARD_MASTER, extractor=_award_master_extractor),
    SingleGameThresholdEvaluator(NO_AWARD_WIN, extractor=_no_award_win_extractor),
    SingleGameThresholdEvaluator(STOLEN_AWARDS, extractor=_stolen_awards_extractor),
    SingleGameThresholdEvaluator(CARD_POINTS, extractor=_card_points_extractor),
]
