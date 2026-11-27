"""
Integration tests for GET /elo/history.

Covers the four ROADMAP success criteria for ELO-API-01:
1. No filters → one entry per active player with non-empty points
2. ?from=YYYY-MM-DD → recorded_at >= from, no off-by-one drift in non-UTC TZ
3. ?player_ids=valid,unknown → only valid is returned (200, not 400)
4. Invalid ?from value → 422

All tests run inside docker-compose.test.yml via `make test-backend`
(NEVER pytest on host — wipes dev DB). The Makefile recipe runs the FULL
suite; there is no per-file selection from the host.

Helpers are imported from _elo_helpers.py (CLAUDE.md §3 — no duplication
of code introduced by Phase 8). The integration directory has no
__init__.py, so the import is absolute (pytest's rootdir-based collection
adds the test file's directory to sys.path).
"""
import time

import pytest
from fastapi.testclient import TestClient

from main import app
from models.player import Player
from repositories.player_repository import PlayersRepository

from _elo_helpers import (
    _CORP_BY_PLAYER,  # noqa: F401  (re-exported for completeness; safe to drop if unused)
    _game_payload,
    _player_result,  # noqa: F401  (re-exported for completeness; safe to drop if unused)
    _post_game,
    _pr,
)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def players_repo():
    return PlayersRepository()


# ---------- Test-local helpers (specific to this file's fixtures) ----------

def _seed_three_active_players(players_repo) -> list[str]:
    players_repo.create(Player(player_id="p1", name="Alice"))
    players_repo.create(Player(player_id="p2", name="Bob"))
    players_repo.create(Player(player_id="p3", name="Cara"))
    return ["p1", "p2", "p3"]


def _seed_two_games(client) -> tuple[str, str]:
    g1 = _post_game(client, _game_payload(
        "g-jan", "2026-01-15",
        [_pr("p1", 50), _pr("p2", 30), _pr("p3", 20)],
    ))
    g2 = _post_game(client, _game_payload(
        "g-feb", "2026-02-15",
        [_pr("p2", 50), _pr("p3", 30), _pr("p1", 20)],
    ))
    return g1, g2


# ---------- Success Criterion 1 ----------

def test_history_no_filters_returns_active_players_with_points(client, players_repo):
    _seed_three_active_players(players_repo)
    _seed_two_games(client)

    res = client.get("/elo/history")
    assert res.status_code == 200, res.json()
    data = res.json()

    # All three active players appear (each played both games)
    ids = {entry["player_id"] for entry in data}
    assert ids == {"p1", "p2", "p3"}, f"unexpected ids: {ids}"

    # Each player has 2 points covering both games
    for entry in data:
        assert len(entry["points"]) == 2, entry
        game_ids = {p["game_id"] for p in entry["points"]}
        assert game_ids == {"g-jan", "g-feb"}, entry

    # Names are resolved (not just ids)
    names = {entry["player_id"]: entry["player_name"] for entry in data}
    assert names == {"p1": "Alice", "p2": "Bob", "p3": "Cara"}


# ---------- Success Criterion 2 ----------

def test_history_from_filter_drops_earlier_points_in_non_utc_tz(monkeypatch, client, players_repo):
    """
    Defensive regression test for the ?from filter under a non-UTC runtime TZ.

    Important context: PITFALLS.md §4 (timezone shift) actually applies to the
    FRONTEND `new Date("YYYY-MM-DD").toISOString()` chain that Phase 11 will
    introduce — NOT to this backend. The backend stores `recorded_at` as a
    Postgres `Date` column (TZ-naive) and serializes it via Pydantic's default
    `date` serializer (TZ-naive YYYY-MM-DD). The runtime TZ env var has no
    path to influence either, so this test cannot reproduce the actual
    pitfall against the current codebase.

    Why keep the test then?
    - It is a CHEAP regression guard: if a future change introduces a
      `datetime` (TZ-aware) anywhere in the read chain — for example, by
      coercing `recorded_at` into a `datetime` in the DTO or by deriving it
      from `created_at: TIMESTAMPTZ` — this test would fail when the runtime
      TZ shifts the day boundary.
    - CONTEXT 08 explicitly requires "one test runs in
      America/Argentina/Buenos_Aires TZ" to satisfy ROADMAP success
      criterion 2. We satisfy that requirement with a defensive, not a
      reproductive, test.
    - The test still exercises the inclusive lower bound (`from=2026-02-15`
      keeps the Feb game, drops the Jan game) — which is the OTHER half of
      success criterion 2 and IS reproducible against the current backend.

    If the test ever starts failing after a future change, do NOT silence it:
    the failure mode is exactly what it exists to catch.
    """
    # monkeypatch.setenv runs after top-level imports, so this only affects
    # processes spawned (or libraries that re-read TZ) AFTER this point.
    monkeypatch.setenv("TZ", "America/Argentina/Buenos_Aires")
    if hasattr(time, "tzset"):
        time.tzset()

    _seed_three_active_players(players_repo)
    _seed_two_games(client)  # games on 2026-01-15 and 2026-02-15

    # Inclusive lower bound: from=2026-02-15 keeps the Feb game, drops the Jan game.
    res = client.get("/elo/history?from=2026-02-15")
    assert res.status_code == 200, res.json()
    data = res.json()
    assert data, "expected non-empty response under from=2026-02-15"

    for entry in data:
        for point in entry["points"]:
            # Compare YYYY-MM-DD as opaque strings (no parsing). If a future
            # change reformats `recorded_at` into a TZ-aware ISO datetime,
            # this string compare will catch the drift.
            assert point["recorded_at"] >= "2026-02-15", point
            assert point["game_id"] == "g-feb", point


# ---------- Success Criterion 3 ----------

def test_history_player_ids_filter_drops_unknown_ids_silently(client, players_repo):
    _seed_three_active_players(players_repo)
    _seed_two_games(client)

    res = client.get("/elo/history?player_ids=p1,does-not-exist")
    # Unknown ids must NOT trigger 400/422 — they are silently dropped (CONTEXT D-03).
    assert res.status_code == 200, res.json()
    data = res.json()

    ids = {entry["player_id"] for entry in data}
    assert ids == {"p1"}, f"expected only p1, got {ids}"


# ---------- Success Criterion 4 ----------

def test_history_invalid_from_returns_422(client, players_repo):
    _seed_three_active_players(players_repo)
    # No games needed — invalid query param is rejected before any service work.

    res = client.get("/elo/history?from=not-a-date")
    assert res.status_code == 422, res.json()


def test_history_response_shape_matches_player_elo_history_dto(client, players_repo):
    _seed_three_active_players(players_repo)
    _seed_two_games(client)

    res = client.get("/elo/history?player_ids=p1")
    assert res.status_code == 200, res.json()
    data = res.json()

    assert len(data) == 1
    entry = data[0]

    # Top-level fields locked by PlayerEloHistoryDTO
    assert set(entry.keys()) == {"player_id", "player_name", "points"}, entry.keys()

    # Each point matches EloHistoryPointDTO field-for-field
    assert entry["points"], "expected non-empty points"
    for point in entry["points"]:
        assert set(point.keys()) == {"recorded_at", "game_id", "elo_after", "delta"}, point.keys()
        # recorded_at serialized as YYYY-MM-DD string (Pydantic default for date)
        assert isinstance(point["recorded_at"], str)
        assert len(point["recorded_at"]) == 10 and point["recorded_at"][4] == "-" and point["recorded_at"][7] == "-", point["recorded_at"]
        assert isinstance(point["game_id"], str)
        assert isinstance(point["elo_after"], int)
        assert isinstance(point["delta"], int)
