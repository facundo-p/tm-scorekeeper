"""Unidad de trabajo, advisory lock y orden canónico (F21, TXN-01/02, D-55, D-56)."""
import threading

import pytest
from fastapi.testclient import TestClient

from db.uow import active_session, unit_of_work
from main import app
from models.player import Player
from repositories.container import elo_repository, players_repository
from repositories.elo_filters import EloHistoryFilter
from services.container import elo_service

from _elo_helpers import _game_payload, _post_game, _pr


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def players():
    for pid in ("p1", "p2", "p3"):
        players_repository.create(Player(player_id=pid, name=pid.upper(), is_active=True))


def _ids():
    return {p.player_id for p in players_repository.get_all()}


def test_unit_of_work_rolls_back_everything_on_error(players):
    with pytest.raises(RuntimeError):
        with unit_of_work():
            players_repository.create(Player(player_id="p9", name="Nueve", is_active=True))
            assert "p9" in _ids()  # visible dentro de la transacción
            raise RuntimeError("falla a mitad de camino")
    assert "p9" not in _ids()


def test_nested_units_share_one_session(players):
    with unit_of_work() as outer:
        with unit_of_work(lock=True) as inner:
            assert inner is outer is active_session()
    assert active_session() is None


def test_repositories_commit_on_their_own_outside_a_unit(players):
    players_repository.create(Player(player_id="p8", name="Ocho", is_active=True))
    assert "p8" in _ids()


def _history_snapshot():
    rows = elo_repository.get_history(EloHistoryFilter())
    return sorted((r.player_id, r.game_id, r.elo_before, r.elo_after) for r in rows)


def test_concurrent_game_creation_keeps_elo_consistent(client, players):
    errors = []

    def create(i):
        try:
            day = f"2026-01-{10 + i % 3:02d}"
            _post_game(client, _game_payload(f"g-{i}", day, [_pr("p1", 20 + i), _pr("p2", 30 - i), _pr("p3", 25)]))
        except Exception as e:  # pragma: no cover - se informa abajo
            errors.append(e)

    threads = [threading.Thread(target=create, args=(i,)) for i in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert errors == []
    before = _history_snapshot()
    assert len(before) == 6 * 3
    elo_service.recompute_all()
    assert _history_snapshot() == before


def test_same_day_games_follow_load_order_not_id(client, players):
    """Dos partidas del mismo día: manda la que se cargó primero aunque su id sea mayor."""
    _post_game(client, _game_payload("z-first", "2026-02-01", [_pr("p1", 40), _pr("p2", 20)]))
    _post_game(client, _game_payload("a-second", "2026-02-01", [_pr("p1", 20), _pr("p2", 40)]))
    first = {c.player_id: c for c in elo_repository.get_changes_for_game("z-first")}
    second = {c.player_id: c for c in elo_repository.get_changes_for_game("a-second")}
    assert first["p1"].elo_before == 1000
    assert second["p1"].elo_before == first["p1"].elo_after
    listed = [g["id"] for g in client.get("/games/").json()]
    assert listed.index("z-first") < listed.index("a-second")
