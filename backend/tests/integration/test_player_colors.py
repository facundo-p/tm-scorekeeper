"""Color de cubo y `since` de los jugadores (F24, STAT-08; fecha de alta, D-78)."""
from datetime import date
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from db.session import engine
from main import app
from models.player import Player
from models.player_colors import PLAYER_COLORS
from repositories.player_repository import PlayersRepository

from _elo_helpers import _game_payload, _post_game, _pr


@pytest.fixture
def client():
    return TestClient(app)


def _players(client):
    return {p["player_id"]: p for p in client.get("/players/").json()}


def _create(client, name, **extra):
    return client.post("/players/", json={"name": name, **extra})


def test_new_players_get_the_first_free_color(client):
    ids = [_create(client, n).json()["player_id"] for n in ("Ana", "Beto")]
    players = _players(client)
    assert [players[i]["color"] for i in ids] == ["rojo", "verde"]


def test_a_chosen_color_is_kept_and_a_taken_one_is_409(client):
    _create(client, "Ana", color="azul")
    assert _create(client, "Beto", color="azul").status_code == 409
    assert _create(client, "Caro", color="fucsia").status_code == 422


def test_patch_color_is_409_when_another_active_player_has_it(client):
    a = _create(client, "Ana").json()["player_id"]
    b = _create(client, "Beto").json()["player_id"]
    assert client.patch(f"/players/{b}", json={"color": "rojo"}).status_code == 409
    assert client.patch(f"/players/{b}", json={"color": "gris"}).status_code == 200
    assert _players(client)[b]["color"] == "gris" and _players(client)[a]["color"] == "rojo"


def test_inactive_players_free_their_color_and_get_a_free_one_back(client):
    a = _create(client, "Ana").json()["player_id"]
    client.patch(f"/players/{a}", json={"is_active": False})
    b = _create(client, "Beto", color="rojo").json()["player_id"]
    assert client.patch(f"/players/{a}", json={"is_active": True}).status_code == 200
    players = _players(client)
    assert players[b]["color"] == "rojo" and players[a]["color"] == "verde"


def test_eleven_active_players_do_not_fit(client):
    for i, color in enumerate(PLAYER_COLORS):
        PlayersRepository().create(Player(player_id=f"p{i}", name=f"P{i}", color=color))
    assert _create(client, "Once").status_code == 409


def test_since_is_the_signup_date(client):
    PlayersRepository().create(Player(player_id="p1", name="Alice", joined_on=date(2025, 3, 15)))
    PlayersRepository().create(Player(player_id="p2", name="Bob"))  # sin fecha: la del día
    _post_game(client, _game_payload("g1", "2026-01-10", [_pr("p1", 50), _pr("p2", 30)]))
    players = _players(client)
    with engine.connect() as conn:
        today = conn.execute(text("SELECT CURRENT_DATE")).scalar()
    assert players["p1"]["since"] == "2025-03-15" and players["p2"]["since"] == today.isoformat()


def test_without_a_signup_date_since_falls_back_to_the_first_game(client):
    for pid, name in (("p1", "Alice"), ("p2", "Bob"), ("p3", "Cara")):
        PlayersRepository().create(Player(player_id=pid, name=name))
    with engine.begin() as conn:  # como las altas anteriores a D-78 que nunca jugaron
        conn.execute(text("UPDATE players SET joined_on = NULL"))
    _post_game(client, _game_payload("g2", "2026-02-01", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g1", "2026-01-10", [_pr("p1", 50), _pr("p3", 30)]))
    players = _players(client)
    assert players["p1"]["since"] == "2026-01-10" and players["p2"]["since"] == "2026-02-01"


def test_a_concurrent_color_collision_is_409_not_500(client):
    _create(client, "Ana")
    # Simula la carrera: la lectura de colores no ve al otro jugador, el índice único sí.
    with patch("services.player_service.PlayerService._active_colors", return_value=[]), \
         patch("repositories.player_repository.PlayersRepository._active_colors", return_value=[]):
        assert _create(client, "Beto").status_code == 409
    assert len(_players(client)) == 1
