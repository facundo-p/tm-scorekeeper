"""Logros derivados (F23, STAT-04, STAT-06, SEMANTICS §5, D-04, D-08)."""
from datetime import date

from models.award_result import AwardResult
from models.enums import Award, Corporation, MapName, Milestone
from models.game import Game
from models.game_subset import GameSubset
from models.player_result import PlayerEndStats, PlayerResult
from models.player_score import PlayerScore
from services.achievement_evaluators.catalog import ACHIEVEMENTS, ACHIEVEMENT_BY_CODE
from services.achievement_evaluators.derive import derive_achievements
from services.stats.context import StatsContext


def result(pid, tr, mc=0, corp=Corporation.CREDICOR, milestones=(), cards=0, cities=0, greenery=0):
    scores = PlayerScore(terraform_rating=tr, milestone_points=5 * len(milestones), milestones=list(milestones),
                         award_points=0, card_points=cards, card_resource_points=0, greenery_points=greenery,
                         city_points=cities, turmoil_points=None)
    return PlayerResult(player_id=pid, corporation=corp, scores=scores, end_stats=PlayerEndStats(mc_total=mc))


def game(gid, day, *rows, generations=10, map_name=MapName.HELLAS, awards=()):
    return Game(game_id=gid, date=date(2026, 1, day), map_name=map_name, expansions=[], draft=False,
                generations=generations, player_results=list(rows), awards=list(awards))


def award(opened_by, first, second=()):
    return AwardResult(award=Award.LANDLORD, opened_by=opened_by, first_place=list(first), second_place=list(second))


def state(games, pid, code, subset=GameSubset()):
    states = derive_achievements(StatsContext(games, subset), [pid])[pid]
    return next(s for s in states if s.definition.code == code)


def levels(s):
    return [(u.level, u.game_id) for u in s.unlocks]


def test_catalog_has_eighteen_achievements_with_unique_codes():
    assert len(ACHIEVEMENTS) == 18 and len(ACHIEVEMENT_BY_CODE) == 18
    assert all(len(d.tiers) == 1 for d in ACHIEVEMENTS if d.kind == "flag")


def test_each_level_is_dated_with_the_first_game_that_reached_it():
    games = [game("g1", 1, result("a", 80), result("b", 30)), game("g2", 2, result("a", 101), result("b", 30))]
    s = state(games, "a", "high_score")
    assert s.tier == 3 and s.value == 101 and levels(s) == [(1, "g1"), (2, "g1"), (3, "g2")]
    assert s.unlocked_on == date(2026, 1, 2)
    assert (s.progress.current, s.progress.target) == (101, 125)


def test_without_games_everything_is_locked_and_flags_have_no_progress():
    assert state([], "a", "games_played").progress.target == 5
    s = state([], "a", "blitz")
    assert s.tier == 0 and s.unlocks == () and s.progress is None


def test_shared_wins_count_and_win_streak_progress_uses_the_current_streak():
    games = [game("g1", 1, result("a", 40, mc=3), result("b", 40, mc=3)),
             game("g2", 2, result("a", 40), result("b", 30)),
             game("g3", 3, result("b", 40), result("a", 30))]
    s = state(games, "a", "win_streak")
    assert s.tier == 1 and s.value == 2 and (s.progress.current, s.progress.target) == (0, 3)
    assert state(games, "a", "games_won").value == 2


def test_win_flags_need_a_win():
    games = [game("g1", 1, result("a", 30, milestones=[Milestone.MAYOR, Milestone.GARDENER, Milestone.BUILDER]),
                  result("b", 50))]  # a: 30 + 15 de hitos = 45
    assert state(games, "a", "milestone_master").tier == 0
    assert state(games, "b", "no_milestone_win").tier == 1
    assert state(games, "b", "no_award_win").tier == 1


def test_award_master_and_stolen_awards():
    awards = [award("b", ["a"]), award("a", ["a"]), award("b", ["a", "b"])]
    games = [game("g1", 1, result("a", 50), result("b", 40), awards=awards)]
    assert state(games, "a", "award_master").tier == 1
    assert state(games, "a", "stolen_awards").value == 1  # solo la que financió otro y ganó solo


def test_photo_finish_blitz_and_full_table():
    five = [result(p, 40 - i, corp=c) for i, (p, c) in enumerate(
        [("a", Corporation.CREDICOR), ("b", Corporation.ECOLINE), ("c", Corporation.HELION),
         ("d", Corporation.MINING_GUILD), ("e", Corporation.THARSIS_REPUBLIC)])]
    games = [game("g1", 1, *five, generations=9)]
    assert state(games, "a", "photo_finish").tier == 1  # margen 1, único ganador
    assert state(games, "a", "blitz").tier == 1
    assert state(games, "a", "full_table").tier == 1
    tie = [game("g2", 2, result("a", 40, mc=2), result("b", 40, mc=1))]
    assert state(tie, "a", "photo_finish").tier == 1  # margen 0 por desempate de M€


def test_giant_killer_needs_a_strictly_lower_elo_before_the_game():
    games = [game("g1", 1, result("a", 50), result("b", 40)),
             game("g2", 2, result("b", 50), result("a", 40)),
             game("g3", 3, result("a", 50), result("c", 40))]
    assert state(games, "b", "giant_killer").value == 1   # g2: b (984) < a (1016)
    assert state(games[:1], "a", "giant_killer").value == 0   # g1: todos en 1000, nadie es menor
    assert state(games, "a", "giant_killer").value == 1   # g3: a quedó por debajo de 1000 y c entra con 1000


def test_corp_collector_all_maps_city_planner_and_greenery():
    games = [game("g1", 1, result("a", 50, corp=Corporation.ECOLINE, cities=12, greenery=20), result("b", 40)),
             game("g2", 2, result("a", 50, cities=9, greenery=10), result("b", 40), map_name=MapName.THARSIS)]
    assert state(games, "a", "corp_collector").value == 2
    assert state(games, "a", "all_maps").tier == 1
    assert state(games, "a", "city_planner").value == 12
    assert state(games, "a", "greenery_tiles").tier == 1


def test_removing_a_game_can_take_a_level_away():
    g1, g2 = game("g1", 1, result("a", 50), result("b", 40)), game("g2", 2, result("a", 50), result("b", 40))
    assert state([g1, g2], "a", "win_streak").tier == 1
    assert state([g1], "a", "win_streak").tier == 0


def test_table_view_only_counts_games_of_that_size():
    games = [game("g1", 1, result("a", 50), result("b", 40)),
             game("g2", 2, result("a", 50), result("b", 40), result("c", 30))]
    assert state(games, "a", "games_played", GameSubset(player_count=3)).value == 1
