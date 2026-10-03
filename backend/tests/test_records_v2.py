"""Motor de récords v2 (F22, STAT-01..03, D-05, D-18, SEMANTICS §4 y §9)."""
from datetime import date

from models.enums import Corporation, Expansion, MapName
from models.game import Game
from models.game_subset import GameSubset
from models.player_result import PlayerEndStats, PlayerResult
from models.player_score import PlayerScore
from services.records.definitions import RECORD_BY_CODE, RECORD_DEFS
from services.records.metrics import GAME_METRICS
from services.records.service import build_records, game_record_context, near_records
from services.records.tracker import track_game_records
from services.stats.context import StatsContext, game_stats


def result(pid, tr, mc=0, turmoil=0):
    scores = PlayerScore(terraform_rating=tr, milestone_points=0, milestones=[], award_points=0, card_points=0,
                         card_resource_points=0, greenery_points=0, city_points=0, turmoil_points=turmoil)
    return PlayerResult(player_id=pid, corporation=Corporation.CREDICOR, scores=scores,
                        end_stats=PlayerEndStats(mc_total=mc))


def game(gid, day, *rows, generations=10, map_name=MapName.HELLAS, expansions=()):
    return Game(game_id=gid, date=date(2026, 1, day), map_name=map_name, expansions=list(expansions), draft=False,
                generations=generations, player_results=list(rows), awards=[])


def record(games, code):
    return next(v.state for v in build_records(StatsContext(games)) if v.definition.code == code)


def kinds(state):
    return [(h.kind, h.value, h.player_id, h.holders) for h in state.history]


SCORE = "highest_single_game_score"


def test_catalog_has_sixteen_records_and_every_game_record_has_a_metric():
    assert len(RECORD_DEFS) == 16
    assert {d.code for d in RECORD_DEFS if d.scope == "game"} == set(GAME_METRICS)
    assert {d.code for d in RECORD_DEFS if d.lower_is_better} == {"closest_win", "fastest_win"}


def test_first_game_sets_the_record_without_breaking_it():
    ctx = StatsContext([game("g1", 1, result("a", 40), result("b", 30))])
    track = track_game_records(ctx)
    assert track.broken == {}
    assert kinds(track.states[SCORE]) == [("set", 40, "a", ("a",))]


def test_matching_the_record_adds_a_co_holder_and_beating_it_replaces_them():
    games = [game("g1", 1, result("a", 40), result("b", 30)),
             game("g2", 2, result("c", 40), result("b", 10)),
             game("g3", 3, result("b", 45), result("d", 45))]
    state = record(games, SCORE)
    assert kinds(state) == [("set", 40, "a", ("a",)), ("tied", 40, "c", ("c",)), ("broken", 45, "b", ("b", "d"))]
    assert [(h.player_id, h.game_id) for h in state.holders] == [("b", "g3"), ("d", "g3")]


def test_a_record_breaks_at_most_once_per_game():
    games = [game("g1", 1, result("a", 40), result("b", 30)), game("g2", 2, result("a", 50), result("b", 45))]
    track = track_game_records(StatsContext(games))
    assert [h.kind for h in track.states[SCORE].history] == ["set", "broken"]
    assert SCORE in track.broken["g2"]


def test_zero_does_not_set_a_higher_is_better_record():
    games = [game("g1", 1, result("a", 40), result("b", 30))]
    assert record(games, "highest_turmoil_points").value is None
    assert record(games, "highest_card_points").value is None


def test_closest_win_is_lower_is_better_and_skips_shared_wins():
    games = [game("g1", 1, result("a", 40), result("b", 30)),
             game("g2", 2, result("a", 30, mc=1), result("b", 30, mc=1)),
             game("g3", 3, result("b", 41), result("a", 38))]
    state = record(games, "closest_win")
    assert kinds(state) == [("set", 10, "a", ("a",)), ("broken", 3, "b", ("b",))]
    assert record(games, "biggest_margin").value == 10


def test_points_per_generation_rounds_half_even():
    gs = game_stats(game("g1", 1, result("a", 41), result("b", 30), generations=4))
    assert dict(GAME_METRICS["points_per_generation"](gs))["a"] == 10.2


def test_career_history_only_logs_changes_of_the_holder_set():
    games = [game("g1", 1, result("a", 40), result("b", 30)),
             game("g2", 2, result("b", 40), result("a", 30)),
             game("g3", 3, result("b", 40), result("a", 30))]
    state = record(games, "most_games_won")
    assert kinds(state) == [("set", 1, "a", ("a",)), ("tied", 1, "b", ("a", "b")), ("broken", 2, "b", ("b",))]
    assert state.value == 2 and [h.player_id for h in state.holders] == ["b"]


def test_career_records_without_games_are_zero_with_no_holders():
    state = record([], "most_games_played")
    assert state.value == 0 and state.holders == () and state.history == ()


def test_longest_streak_counts_shared_wins():
    games = [game("g1", 1, result("a", 40), result("b", 30)),
             game("g2", 2, result("a", 30, mc=1), result("b", 30, mc=1))]
    assert record(games, "longest_streak").value == 2


def test_game_context_marks_broken_tied_and_the_record_before():
    games = [game("g1", 1, result("a", 40), result("b", 30)),
             game("g2", 2, result("a", 50), result("b", 38)),
             game("g3", 3, result("c", 50), result("b", 20))]
    ctx = StatsContext(games)
    g2 = {c.definition.code: c for c in game_record_context(ctx, "g2")}[SCORE]
    assert g2.broken and g2.before.value == 40 and g2.gap == 10
    g3 = {c.definition.code: c for c in game_record_context(ctx, "g3")}[SCORE]
    assert not g3.broken and g3.tied.player_id == "c" and g3.gap == 0
    assert game_record_context(ctx, "no-existe") == []


def test_near_records_are_unbroken_within_three_closest_first_and_at_most_three():
    games = [game("g1", 1, result("a", 40, mc=20), result("b", 30)),
             game("g2", 2, result("a", 38, mc=19), result("b", 37))]
    context = game_record_context(StatsContext(games), "g2")
    assert {c.definition.code for c in context if c.broken} == {"closest_win"}
    # candidatos: fastest_win 0, points_per_generation 0,2, richest_finish 1, puntaje y TR 2
    near = near_records(context)
    assert [c.definition.code for c in near] == ["fastest_win", "points_per_generation", "richest_finish"]


def test_subset_filters_by_table_size_map_and_expansion():
    g2 = game("g1", 1, result("a", 40), result("b", 30), map_name=MapName.THARSIS)
    g3 = game("g2", 2, result("a", 40), result("b", 30), result("c", 20), expansions=[Expansion.TURMOIL])
    assert [gs.id for gs in StatsContext([g2, g3], GameSubset(player_count=3)).games] == ["g2"]
    assert [gs.id for gs in StatsContext([g2, g3], GameSubset(map=MapName.THARSIS)).games] == ["g1"]
    assert [gs.id for gs in StatsContext([g2, g3], GameSubset(expansion=Expansion.TURMOIL)).games] == ["g2"]
    assert GameSubset().is_all and not GameSubset(player_count=2).is_all


def test_definitions_are_indexed_by_code():
    assert RECORD_BY_CODE["fastest_win"].unit == "gen"


def test_a_single_winner_by_tiebreak_sets_closest_win_at_zero_but_not_biggest_margin():
    games = [game("g1", 1, result("a", 40, mc=5), result("b", 40, mc=1))]
    assert record(games, "closest_win").value == 0
    assert record(games, "biggest_margin").value is None


def test_game_context_skips_records_the_game_cannot_set():
    ctx = StatsContext([game("g1", 1, result("a", 40), result("b", 30))])
    codes = {c.definition.code for c in game_record_context(ctx, "g1")}
    assert "highest_turmoil_points" not in codes and SCORE in codes


def test_highest_elo_on_a_subset_replays_from_1000():
    games = [game("g1", 1, result("a", 40), result("b", 30)),
             game("g2", 2, result("a", 40), result("b", 30), result("c", 20))]
    two = next(v.state for v in build_records(StatsContext(games, GameSubset(player_count=2)))
               if v.definition.code == "highest_elo")
    three = next(v.state for v in build_records(StatsContext(games, GameSubset(player_count=3)))
                 if v.definition.code == "highest_elo")
    assert [h.player_id for h in two.holders] == ["a"] and two.value > 1000
    assert [h.game_id for h in three.history] == ["g2"] and three.value > 1000
