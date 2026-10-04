"""Co-ganadores y co-poseedores (F21, TXN-04, D-05, D-07, D-17)."""
from datetime import date

from models.enums import Corporation, MapName
from models.game import Game
from models.player_result import PlayerEndStats, PlayerResult
from models.player_score import PlayerScore
from models.record_entry import LABEL_PLAYER
from services.helpers.records import best_with_holders
from services.record_calculators.highest_single_game_score import HighestSingleGameScoreCalculator
from services.record_calculators.most_games_won import MostGamesWonCalculator
from services.achievement_evaluators.metrics import timelines
from services.stats.context import StatsContext
from services.stats.elo_replay import replay_elo


def result(pid, tr, mc=0, corp=Corporation.CREDICOR):
    scores = PlayerScore(terraform_rating=tr, milestone_points=0, milestones=[], award_points=0, card_points=0,
                         card_resource_points=0, greenery_points=0, city_points=0, turmoil_points=0)
    return PlayerResult(player_id=pid, corporation=corp, scores=scores, end_stats=PlayerEndStats(mc_total=mc))


def game(gid, day, *rows):
    return Game(game_id=gid, date=date(2026, 1, day), map_name=MapName.HELLAS, expansions=[], draft=False,
                generations=10, player_results=list(rows), awards=[])


def holders(entry):
    return [a.value for a in entry.attributes if a.label == LABEL_PLAYER]


def test_best_with_holders_keeps_every_holder_once_with_first_date():
    best, found = best_with_holders([(5, "a", 1), (7, "b", 2), (7, "a", 3), (7, "b", 4), (6, "c", 5)])
    assert best == 7 and found == [("b", 2), ("a", 3)]


def test_highest_score_lists_all_holders():
    games = [game("g1", 1, result("a", 40), result("b", 30)), game("g2", 2, result("c", 40), result("b", 10))]
    entry = HighestSingleGameScoreCalculator().calculate(games)
    assert entry.value == 40 and holders(entry) == ["a", "c"]


def test_co_winners_both_count_as_wins():
    games = [game("g1", 1, result("a", 40, 3), result("b", 40, 3), result("c", 10))]
    entry = MostGamesWonCalculator().calculate(games)
    assert entry.value == 1 and sorted(holders(entry)) == ["a", "b"]


def test_a_shared_win_keeps_the_streak_alive():
    games = [game("g1", 1, result("a", 40), result("b", 10)),
             game("g2", 2, result("a", 30, 5), result("b", 30, 5))]
    ctx = StatsContext(games)
    assert timelines(ctx, replay_elo(ctx))["a"][-1].metrics.streak == 2
