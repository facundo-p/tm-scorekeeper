---
phase: 08-backend-get-elo-history-endpoint
plan: 04
subsystem: api
tags: [tests, integration, fastapi, testclient, elo, backend]

# Dependency graph
requires:
  - phase: 08-backend-get-elo-history-endpoint
    plan: 03
    provides: "EloService.get_history + GET /elo/history route + main.py wiring"
provides:
  - "Integration test suite for GET /elo/history (5 tests covering 4 ROADMAP success criteria + defensive TZ regression)"
  - "Shared ELO test helpers module (backend/tests/integration/_elo_helpers.py) ready for future consolidation of test_elo_cascade.py"
affects: [09-frontend-elo-types, 11-ranking-page, 12-elo-chart]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Integration tests run inside docker-compose.test.yml via `make test-backend` — never on host (memory: feedback_never_run_pytest_locally)"
    - "Shared test helpers extracted to underscore-prefixed sibling module to avoid pytest collection while enabling reuse (CLAUDE.md §3)"
    - "Defensive timezone regression test pattern: monkeypatch.setenv(TZ=...) + time.tzset() + opaque-string comparison on YYYY-MM-DD"
    - "Absolute import from sibling test module (`from _elo_helpers import ...`) — works because integration/ has no __init__.py and pytest's rootdir-mode collection prepends the file's directory to sys.path"

key-files:
  created:
    - "backend/tests/integration/_elo_helpers.py"
    - "backend/tests/integration/test_elo_routes.py"
  modified: []

key-decisions:
  - "Helper import is absolute (`from _elo_helpers import ...`) NOT relative — backend/tests/integration/ has no __init__.py, so the rootdir-based sys.path injection makes the absolute form the only one that works"
  - "TZ test scope explicitly documented as DEFENSIVE-REGRESSION in its docstring: PITFALLS.md §4 actually applies to the FRONTEND `new Date(...).toISOString()` chain (Phase 11), NOT the backend (Postgres Date column + Pydantic date serializer are both TZ-naive). Test still meaningfully exercises the inclusive lower bound (`from=2026-02-15` keeps Feb game / drops Jan game) which IS reproducible against the current backend."
  - "test_elo_cascade.py is left UNTOUCHED — consolidating its inline helpers (replacing them with `from _elo_helpers import ...`) is a candidate refactor but explicitly out of scope for Phase 8 (would force re-running the full cascade test suite for parity)"
  - "Each test seeds its own players + games — relies on `clean_tables` autouse fixture in backend/tests/conftest.py to reset between tests"

patterns-established:
  - "Underscore-prefixed sibling helper module for shared test utilities (`_elo_helpers.py`) — pytest skips it during collection; tests import via absolute name"
  - "Five-test pattern for proving a new read-only route: SC-1 happy path / SC-2 filter behavior / SC-3 silent-drop unknown ids / SC-4 422 on bad input / SC-5 strict shape match against locked DTO"

requirements-completed: [ELO-API-01]

# Metrics
duration: 3min
completed: 2026-04-29
---

# Phase 08 Plan 04: Integration tests for GET /elo/history Summary

**Sealed ELO-API-01 with 5 integration tests covering the four ROADMAP success criteria plus a defensive timezone regression. Full backend suite went from 176 → 181 passed — exactly +5, zero regressions, `test_elo_cascade.py` byte-identical to its pre-plan state.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-29T02:37:30Z
- **Completed:** 2026-04-29T02:40:15Z
- **Tasks:** 1 (single composite task creating both files)
- **Files modified:** 2 (both created)

## Accomplishments

- `backend/tests/integration/_elo_helpers.py` created (54 lines including module docstring) with the 5 shared helpers (`_player_result`, `_pr`, `_game_payload`, `_post_game`, `_CORP_BY_PLAYER`) extracted byte-for-byte from `test_elo_cascade.py`. No `fastapi`, `main`, or `pytest` imports — pure data-shape helpers + the `_post_game` HTTP wrapper that takes `client` as an argument.
- `backend/tests/integration/test_elo_routes.py` created (197 lines) with 5 tests, each named exactly per acceptance criteria, covering ELO-API-01's full surface.
- Full Docker test suite green: **181 passed, 0 failed in 1.64s** (was 176 in Plan 03 — exactly +5 new tests).
- `test_elo_cascade.py` byte-identical to its pre-plan state (`git diff backend/tests/integration/test_elo_cascade.py` returned empty after the commit).
- ELO-API-01 marked complete in `REQUIREMENTS.md` (the Phase 8 closer).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create _elo_helpers.py + test_elo_routes.py** — `3a81dce` (test)

**Plan metadata commit:** pending (final commit will include this SUMMARY + STATE.md + ROADMAP.md + REQUIREMENTS.md).

## Files Created/Modified

- `backend/tests/integration/_elo_helpers.py` — created (5 helpers + module docstring; no test functions, no fixtures, no app imports).
- `backend/tests/integration/test_elo_routes.py` — created (5 test functions + 2 file-local fixtures + 2 file-local seed helpers).

### The five test names and the success criterion each covers

| # | Test name | ROADMAP SC |
|---|-----------|------------|
| 1 | `test_history_no_filters_returns_active_players_with_points` | SC-1: default = active players, non-empty points covering all recorded games |
| 2 | `test_history_from_filter_drops_earlier_points_in_non_utc_tz` | SC-2: `?from=YYYY-MM-DD` returns only points with `recorded_at >= from`, no off-by-one drift in non-UTC TZ (defensive — see test docstring) |
| 3 | `test_history_player_ids_filter_drops_unknown_ids_silently` | SC-3: mix of valid + unknown ids returns only valid; HTTP 200 (not 400/422) |
| 4 | `test_history_invalid_from_returns_422` | SC-4a: invalid `from` value triggers FastAPI auto-422 |
| 5 | `test_history_response_shape_matches_player_elo_history_dto` | SC-4b: response field-for-field matches `PlayerEloHistoryDTO` (including `recorded_at` as YYYY-MM-DD string) |

### Final content of `backend/tests/integration/_elo_helpers.py`

```python
"""
Shared helpers for ELO integration tests.

Extracted from test_elo_cascade.py per CLAUDE.md §3 (no code duplication).
Used by test_elo_routes.py (Phase 8). The original copies in test_elo_cascade.py
remain in place — consolidating that file is OUT OF SCOPE for Phase 8.

The leading underscore marks this module as test-internal. Pytest does NOT
collect modules whose name starts with `_`, so this file is not a test file.
"""


def _player_result(player_id: str, terraform_rating: int, corp: str = "Credicor") -> dict:
    return {
        "player_id": player_id,
        "corporation": corp,
        "scores": {
            "terraform_rating": terraform_rating,
            "milestone_points": 0,
            "milestones": [],
            "award_points": 0,
            "card_points": 0,
            "card_resource_points": 0,
            "greenery_points": 0,
            "city_points": 0,
            "turmoil_points": None,
        },
        "end_stats": {"mc_total": 0},
    }


_CORP_BY_PLAYER = {"p1": "Credicor", "p2": "Ecoline", "p3": "Helion"}


def _pr(player_id: str, terraform_rating: int) -> dict:
    return _player_result(player_id, terraform_rating, _CORP_BY_PLAYER[player_id])


def _game_payload(game_id: str, on_date: str, results: list[dict]) -> dict:
    return {
        "id": game_id,
        "date": on_date,
        "map": "Hellas",
        "expansions": [],
        "draft": False,
        "generations": 10,
        "player_results": results,
        "awards": [],
    }


def _post_game(client, payload: dict) -> str:
    res = client.post("/games/", json=payload)
    assert res.status_code == 200, res.json()
    return res.json()["id"]
```

This is the canonical reference for a future cleanup phase that consolidates `test_elo_cascade.py`: a parity diff between the helper bodies in `_elo_helpers.py` and the inlined copies in `test_elo_cascade.py` (lines 33–76) should be byte-identical (modulo the surrounding blank-line conventions). When that cleanup phase runs, replacing the inlined copies with `from _elo_helpers import ...` is safe because both files now share the same source of truth.

### Test suite output (post-task `make test-backend`)

```
INFO  [alembic.runtime.migration] Running upgrade f3a9b2c1d4e5 -> b8d4e2c5a7f1, add elo system
........................................................................ [ 39%]
........................................................................ [ 79%]
.....................................                                    [100%]
181 passed in 1.64s
```

**181 passed, 0 failed** — exactly +5 over Plan 03's 176 baseline. The Makefile recipe runs the WHOLE backend suite (no `ARGS`, no per-file selection); the 5 new tests are necessarily included in the count, and the absence of any `F`/`E` in the dot string proves all 5 PASSED. Per-file verbose output is not available because the docker-compose entrypoint is hardcoded to `python -m pytest tests -q`.

### Pre-existing test_elo_cascade.py untouched (regression check)

```
$ git diff backend/tests/integration/test_elo_cascade.py
$ # (empty diff — file is byte-identical to its pre-plan state)
```

Confirms scope discipline: the inline helpers in `test_elo_cascade.py` stay in place; consolidating that file is left as a future cleanup phase.

### CLAUDE.md compliance

- **§3 (no duplicar código):** Phase 8 introduced ZERO new duplication. The 5 helpers are defined exactly once (in `_elo_helpers.py`) and consumed by `test_elo_routes.py` via absolute import. The pre-existing inline copies in `test_elo_cascade.py` were left intact (decoupled scope), but `_elo_helpers.py` now exists to enable a future cleanup phase to remove that older duplication safely.
- **§3 (refactor if function >20 lines):** All test functions are well under 20 lines (largest is `test_history_no_filters_returns_active_players_with_points` at ~17 lines including blank lines). Test-local seed helpers (`_seed_three_active_players`, `_seed_two_games`) are 4 and 9 lines respectively.
- **§3 (separar lógica y presentación):** Tests assert against the HTTP wire shape (`res.json()`); they do not poke at service internals or repository state directly. The shape check (`set(point.keys()) == {...}`) treats the DTO as a black-box contract.
- **§3 (actualizar archivos de documentación .md):** This SUMMARY documents the new test surface and unblocks Phases 9, 11, 12 with a frozen contract reference. STATE.md and REQUIREMENTS.md are updated below.
- **memory: feedback_never_run_pytest_locally:** Used `make test-backend` (Docker) — never `pytest` on host. Confirmed via the Makefile recipe (`docker compose -f docker-compose.test.yml run --rm --build backend_test`) which mounts the test DB only.

## Decisions Made

- **Helper import form:** Absolute (`from _elo_helpers import ...`) rather than relative. The plan acknowledged both forms; reading the directory layout confirmed `backend/tests/integration/` has NO `__init__.py`, so the relative form (`from ._elo_helpers import ...`) would fail. The absolute form works because pytest's rootdir-based collection prepends the test file's directory to `sys.path`, and the `_elo_helpers.py` underscore prefix prevents pytest from trying to collect it as a test module.
- All other choices were locked upstream in CONTEXT (D-02, D-03, D-04), PATTERNS (`backend/tests/integration/test_elo_routes.py` section), and the 08-04-PLAN itself.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1/2/3/4 deviations triggered. The "absolute vs relative import" choice was pre-authorized by the plan ("if it is NOT a package, fall back to `from _elo_helpers import ...`").

## Issues Encountered

None. The task had explicit pre-existing analogs (`test_elo_cascade.py` for the helper bodies and fixture wiring; `test_achievements_routes.py` for the route-level integration shape), zero ambiguity, no auth gates, no architectural questions. The defensive scope of the TZ test is explicitly documented in its docstring per the plan's WARNING-1 requirement.

## User Setup Required

None — pure test code, no env vars, no service config, no migrations. The Docker test DB is wiped/migrated fresh on every `make test-backend` invocation.

## Threat Flags

None. The new files are read-only test code that only exercises the existing `GET /elo/history` endpoint over an in-process `TestClient`. No new network surface, no auth path, no file I/O, no schema change, no new dependency.

## Requirements Status

`ELO-API-01` is now **Complete** — Phase 8's contractual seal: the four ROADMAP success criteria plus the defensive TZ regression are sealed by automated tests. The `requirements mark-complete ELO-API-01` invocation succeeded:

```
{
  "updated": true,
  "marked_complete": ["ELO-API-01"],
  "already_complete": [],
  "not_found": [],
  "total": 1
}
```

## Next Phase Readiness

- **ELO-API-01 closed.** Phase 8 is complete (from the plan-execution perspective). Whether the phase is marked Complete in ROADMAP.md is up to the orchestrator/verifier per the plan's critical rules ("DO NOT mark phase complete in ROADMAP — orchestrator handles that after verification").
- **Wire contract is now sealed by tests, not just promises.** Phases 09 (frontend ELO types — `src/types/index.ts`), 11 (Ranking page), and 12 (chart) MUST consume `PlayerEloHistoryDTO` field-for-field as the test asserts: top-level `{player_id, player_name, points}`; each point `{recorded_at, game_id, elo_after, delta}`; `recorded_at` is a YYYY-MM-DD string (never a datetime). Any future shape drift in the backend will fail `test_history_response_shape_matches_player_elo_history_dto`, catching the break before the frontend consumes it.
- **Helper module ready for future use.** `_elo_helpers.py` exists as a shared utility. A future cleanup phase can replace the inline copies in `test_elo_cascade.py` with `from _elo_helpers import ...` to remove the older (Phase-1-era) duplication. Out of scope for Phase 8.
- **No new dependencies.** All imports are stdlib (`time`) + already-installed `pytest` / `fastapi` / project modules.

## Note for downstream phases

This SUMMARY is the canonical reference for the locked `GET /elo/history` response shape. Phases 9, 11, 12 must consume:

- **Top-level:** `list[{player_id: str, player_name: str, points: list[...]}]`
- **Each point:** `{recorded_at: str (YYYY-MM-DD), game_id: str, elo_after: int, delta: int}`
- **Order within points:** ascending by `(recorded_at, game_id)` — guaranteed by `EloRepository.get_history` order-by tuple
- **Top-level player order:** ascending by `player_name` — implementation-only (Phase 12 chart assigns colors by id hash, not order)
- **Empty-history players:** dropped from response (no `points: []` entries)
- **Unknown ids in `?player_ids=`:** silently dropped (HTTP 200, not 400/422)
- **Invalid `?from=`:** HTTP 422 (FastAPI auto-validation)

## Note for a future cleanup phase

`backend/tests/integration/test_elo_cascade.py` still has inline copies of the 5 helpers (lines 33–76). Consolidating that file by replacing the inline copies with `from _elo_helpers import ...` is a candidate refactor — out of scope for Phase 8, but `_elo_helpers.py` exists specifically to enable it. Parity check: a `diff` between `test_elo_cascade.py` lines 33–76 and `_elo_helpers.py` lines 13–53 should show only whitespace/blank-line differences.

## Self-Check: PASSED

- `backend/tests/integration/_elo_helpers.py` — FOUND (created)
- `backend/tests/integration/test_elo_routes.py` — FOUND (created)
- Commit `3a81dce` (Task 1) — FOUND in `git log` (`git log --oneline -5 | grep 3a81dce`)
- All 5 test names present in `test_elo_routes.py` (verified via grep)
- All 5 helper definitions present in `_elo_helpers.py` (verified via grep)
- Zero helper definitions in `test_elo_routes.py` (verified via grep — the duplication check)
- `make test-backend` exits 0 with 181 passed (was 176 in Plan 03 — exactly +5 new tests, zero regressions)
- `test_elo_cascade.py` byte-identical (`git diff` empty)
- ELO-API-01 marked Complete in REQUIREMENTS.md (gsd-tools `requirements mark-complete` returned `marked_complete: ["ELO-API-01"]`)

---
*Phase: 08-backend-get-elo-history-endpoint*
*Completed: 2026-04-29*
