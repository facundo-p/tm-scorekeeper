"""Temporadas: cierre, carrera y campeón (F25, SEAS-01, SEMANTICS §10, D-15)."""
from datetime import date, timedelta

from models.enums import Corporation, Expansion, MapName
from models.game import Game
from models.player_result import PlayerEndStats, PlayerResult
from models.player_score import PlayerScore
from services.stats.context import StatsContext, game_stats
from services.stats.feed import _game_item
from services.stats.seasons import games_left, seasons, season_race, season_spans


def result(pid, tr, greenery=16, mc=0, turmoil=None, corp=Corporation.CREDICOR):
    scores = PlayerScore(terraform_rating=tr, milestone_points=0, milestones=[], award_points=0, card_points=0,
                         card_resource_points=0, greenery_points=greenery, city_points=0, turmoil_points=turmoil)
    return PlayerResult(player_id=pid, corporation=corp, scores=scores, end_stats=PlayerEndStats(mc_total=mc))


def game(i, winner="a", loser="b", expansions=(), greenery=(16, 15)):
    rows = [result(winner, 50, greenery=greenery[0]), result(loser, 30, greenery=greenery[1], corp=Corporation.ECOLINE)]
    return Game(game_id=f"g{i:02d}", date=date(2026, 1, 1) + timedelta(days=i), map_name=MapName.HELLAS,
                expansions=list(expansions), draft=False, generations=10, player_results=rows, awards=[])


def test_a_season_closes_when_the_three_parameters_reach_the_top():
    ctx = StatsContext([game(i) for i in range(25)])  # 31 de vegetación por partida
    spans = season_spans(ctx)
    assert [len(s.games) for s in spans] == [24, 1] and spans[0].end == date(2026, 1, 24)
    first, second = seasons(ctx)
    assert first["champion"] == "a" and first["pct"] == 1 and first["temperature"] == 8
    assert second["end"] is None and second["champion"] is None


def test_race_order_and_turmoil_only_counts_turmoil_games():
    games = [game(0), game(1, "b", "a"), game(2), game(3, "b", "a"), game(4), game(5, "b", "a", (Expansion.TURMOIL,))]
    ctx = StatsContext(games)
    span, by_id = season_spans(ctx)[0], {gs.id: gs for gs in ctx.games}
    race = season_race(span, by_id)
    assert [r["player_id"] for r in race["qualified"]] == ["a", "b"]  # mismo promedio: más partidas, mejor, id
    turmoil = season_race(span, by_id, "turmoil_points")
    assert turmoil["games"] == 6 and turmoil["qualified"] == [] and len(turmoil["pending"]) == 2


def test_a_tie_on_points_is_told_as_decided_by_mc():
    g = Game(game_id="g1", date=date(2026, 1, 1), map_name=MapName.HELLAS, expansions=[], draft=False, generations=10,
             player_results=[result("a", 40, mc=1), result("b", 40, mc=5)], awards=[])
    assert _game_item(game_stats(g), {"b": "Beto"})["text"] == "Beto ganó en Hellas por desempate de M€"


def test_oxygen_holds_the_season_open_and_games_left_counts_it():
    ctx = StatsContext([game(i, greenery=(7, 7)) for i in range(30)])  # 14 de vegetación: 0,4 % por partida
    (span,) = season_spans(ctx)
    assert span.end is None and span.temp == 19 and span.oceans == 9 and round(span.oxygen, 6) == 12
    (view,) = seasons(ctx)
    assert view["games_left"] == 5  # faltan 2 % a 0,4 por partida
    assert round(view["pct"], 6) == round((1 + 12 / 14 + 1) / 3, 6)  # sin redondear el oxígeno a 12 → 85,7 %


def test_games_left_early_in_a_season_follows_the_slowest_parameter():
    ctx = StatsContext([game(i) for i in range(4)])  # 31 de vegetación: oxígeno rápido, la temperatura manda
    (view,) = seasons(ctx)
    assert view["games_left"] == 20  # 24 partidas de temperatura, 4 jugadas
    assert 0 < view["pct"] < 1


def test_games_left_is_unknown_without_greenery_and_none_once_closed():
    (span,) = season_spans(StatsContext([game(0, greenery=(0, 0))]))
    assert games_left(span) is None
    closed = season_spans(StatsContext([game(i) for i in range(24)]))[0]
    assert closed.end and games_left(closed) is None
