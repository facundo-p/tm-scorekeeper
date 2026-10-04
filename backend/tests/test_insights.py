"""Funciones de la ficha del jugador (F25, STAT-11, SEMANTICS §6 y §8)."""
from datetime import date
from types import SimpleNamespace

from models.enums import Corporation, MapName, Milestone
from models.game import Game
from models.player_result import PlayerEndStats, PlayerResult
from models.player_score import PlayerScore
from services.insights_service import player_insights
from services.stats.context import StatsContext
from services.stats.elo_replay import replay_elo
from services.stats.insights import equity, most_common, rivals, streaks
from services.stats.player_rows import player_rows

CORPS = [Corporation.CREDICOR, Corporation.ECOLINE, Corporation.HELION]


def result(pid, tr, corp=Corporation.CREDICOR):
    scores = PlayerScore(terraform_rating=tr, milestone_points=0, milestones=[], award_points=0, card_points=0,
                         card_resource_points=0, greenery_points=0, city_points=0, turmoil_points=None)
    return PlayerResult(player_id=pid, corporation=corp, scores=scores, end_stats=PlayerEndStats(mc_total=0))


def game(gid, day, *order):
    rows = [result(pid, 50 - 10 * i, CORPS[i]) for i, pid in enumerate(order)]
    return Game(game_id=gid, date=date(2026, 1, day), map_name=MapName.HELLAS, expansions=[], draft=False,
                generations=10, player_results=rows, awards=[])


def test_most_common_keeps_every_name_tied_at_the_top():
    assert most_common(["b", "a", "a", "b", "c"]) == {"names": ["a", "b"], "count": 2}
    assert most_common([]) is None


def test_streak_keeps_the_best_and_the_current_one():
    ctx = StatsContext([game("g1", 1, "a", "b"), game("g2", 2, "a", "b"), game("g3", 3, "b", "a"),
                        game("g4", 4, "a", "b")])
    assert streaks(player_rows(ctx, "a")) == {"best": 2, "current": 1}


def test_equity_with_two_players_goes_from_zero_to_one():
    ctx = StatsContext([game("g1", 1, "a", "b"), game("g2", 2, "b", "a")])
    eq = equity(player_rows(ctx, "a"))
    assert eq["expected"] == 1 and eq["wins_vs_expected"] == 0 and eq["wins_ratio"] == 1 and eq["rel_pos"] == 0.5


def _cell(games, ahead):
    return {"games": games, "ahead": ahead, "behind": games - ahead, "even": 0}


def test_rivals_need_four_games_and_break_ties_by_more_games():
    h2h = {"a": {"b": _cell(3, 0), "c": _cell(4, 1), "d": _cell(8, 2), "e": _cell(5, 5)}}
    found = rivals("a", h2h)
    assert found["nemesis"]["player_id"] == "d"  # 25 % como c, pero con más partidas
    assert found["victim"]["player_id"] == "e"
    assert rivals("z", h2h) == {"nemesis": None, "victim": None}


def test_rank_ties_are_broken_by_player_id():
    ctx = StatsContext([game("g1", 1, "c", "d"), game("g2", 2, "b", "a")])
    players = [SimpleNamespace(player_id=p, is_active=True) for p in "dcba"]
    ranks = {p: player_insights(ctx, replay_elo(ctx), players, p)["rank"] for p in "abcd"}
    assert ranks == {"b": 1, "c": 2, "a": 3, "d": 4}
