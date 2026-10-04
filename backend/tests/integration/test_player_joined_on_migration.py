"""Backfill de la fecha de alta de la migración b4c5d6e7f8a9 (F32, D-78)."""
import importlib.util
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import text

from db.session import engine
from main import app
from models.player import Player
from repositories.player_repository import PlayersRepository

from _elo_helpers import _game_payload, _post_game, _pr

_PATH = Path(__file__).resolve().parents[2] / "db/migrations/versions/b4c5d6e7f8a9_player_joined_on.py"
_spec = importlib.util.spec_from_file_location("player_joined_on_migration", _PATH)
migration = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(migration)


def test_the_backfill_takes_the_first_game_and_leaves_null_who_never_played():
    client = TestClient(app)
    for pid, name in (("p1", "Alice"), ("p2", "Bob"), ("p3", "Cara")):
        PlayersRepository().create(Player(player_id=pid, name=name))
    _post_game(client, _game_payload("g2", "2026-02-01", [_pr("p1", 50), _pr("p2", 30)]))
    _post_game(client, _game_payload("g1", "2026-01-10", [_pr("p1", 50), _pr("p2", 30)]))
    with engine.begin() as conn:
        conn.execute(text("UPDATE players SET joined_on = NULL"))
        conn.execute(migration._BACKFILL)
        rows = dict(conn.execute(text("SELECT id, joined_on FROM players")).all())
    assert {k: v and v.isoformat() for k, v in rows.items()} == {"p1": "2026-01-10", "p2": "2026-01-10", "p3": None}
