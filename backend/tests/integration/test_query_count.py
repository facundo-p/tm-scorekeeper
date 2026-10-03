"""GET /games/ sin N+1: como mucho 3 consultas sin importar cuántas partidas haya (TXN-03)."""
from contextlib import contextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event

from db.session import engine
from main import app
from models.player import Player
from repositories.container import players_repository

from _elo_helpers import _game_payload, _post_game, _pr


@contextmanager
def count_queries():
    statements = []

    def record(conn, cursor, statement, *args):
        statements.append(statement)

    event.listen(engine, "before_cursor_execute", record)
    try:
        yield statements
    finally:
        event.remove(engine, "before_cursor_execute", record)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.mark.parametrize("games", [1, 8])
def test_list_games_uses_at_most_three_queries(client, games):
    for pid in ("p1", "p2", "p3"):
        players_repository.create(Player(player_id=pid, name=pid, is_active=True))
    for i in range(games):
        _post_game(client, _game_payload(f"g-{i}", f"2026-03-{i + 1:02d}", [_pr("p1", 20 + i), _pr("p2", 25), _pr("p3", 22)]))
    with count_queries() as statements:
        res = client.get("/games/")
    assert res.status_code == 200 and len(res.json()) == games
    selects = [s for s in statements if s.lstrip().upper().startswith("SELECT")]
    assert len(selects) <= 3, selects
