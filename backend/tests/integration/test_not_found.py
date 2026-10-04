"""404 en partidas y jugadores inexistentes (F21, TXN-04)."""
import pytest
from fastapi.testclient import TestClient

from main import app
from models.player import Player
from repositories.player_repository import PlayersRepository

from _elo_helpers import _game_payload, _post_game, _pr


@pytest.fixture
def client():
    return TestClient(app)


@pytest.mark.parametrize("method, path", [
    ("get", "/games/no-existe/report"),
    ("delete", "/games/no-existe"),
    ("get", "/players/no-existe/insights"),
    ("get", "/players/no-existe/achievements"),
])
def test_missing_resources_are_404(client, method, path):
    assert getattr(client, method)(path).status_code == 404


@pytest.fixture
def seeded_game(client):
    for pid, name in (("p1", "Alice"), ("p2", "Bob")):
        PlayersRepository().create(Player(player_id=pid, name=name))
    _post_game(client, _game_payload("g1", "2026-01-01", [_pr("p1", 50), _pr("p2", 30)]))
    return "g1", "p1"


@pytest.mark.parametrize("method, path", [
    ("get", "/games/{id}/results"),
    ("get", "/games/{id}/records"),
    ("get", "/games/{id}/elo"),
    ("post", "/games/{id}/achievements"),
    ("get", "/players/{pid}/profile"),
    ("get", "/players/{pid}/elo-summary"),
    ("post", "/achievements/reconcile"),
])
def test_retired_endpoints_are_gone(client, seeded_game, method, path):
    """API retirada en 35.2 (D-82): el informe y la ficha la reemplazan."""
    game_id, player_id = seeded_game
    url = path.format(id=game_id, pid=player_id)
    assert getattr(client, method)(url).status_code in (404, 405)
    openapi = app.openapi()["paths"]
    assert method not in openapi.get(path.replace("{id}", "{game_id}").replace("{pid}", "{player_id}"), {})
