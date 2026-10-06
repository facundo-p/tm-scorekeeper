"""Cambios de líder y resumen del grupo (F25, STAT-12)."""
from datetime import date

from models.enums import Corporation, MapName
from models.game import Game
from models.player_result import PlayerEndStats, PlayerResult
from models.player_score import PlayerScore
from services.stats.context import StatsContext
from services.stats.elo_replay import replay_elo
from services.stats.group import lead_changes, summary


def result(pid, tr, corp):
    scores = PlayerScore(terraform_rating=tr, milestone_points=0, milestones=[], award_points=0, card_points=0,
                         card_resource_points=0, greenery_points=0, city_points=0, turmoil_points=None)
    return PlayerResult(player_id=pid, corporation=corp, scores=scores, end_stats=PlayerEndStats(mc_total=0))


def game(gid, day, a, b, tie=False):
    rows = [result(a, 50, Corporation.CREDICOR), result(b, 50 if tie else 30, Corporation.ECOLINE)]
    return Game(game_id=gid, date=date(2026, 1, day), map_name=MapName.HELLAS, expansions=[], draft=False,
                generations=10, player_results=rows, awards=[])


def leaders(games, active):
    ctx = StatsContext(games)
    return [(c["game_id"], c["player_id"]) for c in lead_changes(ctx, replay_elo(ctx), active)]


def test_a_tie_on_elo_keeps_whoever_appeared_first():
    # Empate total: los dos siguen en 1000 y lidera el primero que apareció (como el mockup).
    assert leaders([game("g1", 1, "b", "a", tie=True)], {"a", "b"}) == [("g1", "b")]


def test_an_inactive_player_never_leads():
    games = [game("g1", 1, "a", "b"), game("g2", 2, "a", "b")]
    assert leaders(games, {"b"}) == [("g1", "b")]
    assert leaders(games, {"a", "b"}) == [("g1", "a")]


def test_the_lead_changes_hands_when_someone_overtakes():
    games = [game("g1", 1, "a", "b"), game("g2", 2, "b", "a")]
    assert leaders(games, {"a", "b"}) == [("g1", "a"), ("g2", "b")]  # b: 984 → 1001, a: 1016 → 999


def test_summary_of_an_empty_subset():
    s = summary(StatsContext([]))
    assert s["games"] == 0 and s["top_corp"] is None and s["top_map"] is None and s["maps"] == []
