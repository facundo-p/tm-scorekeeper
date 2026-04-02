---
phase: 02
slug: integraci-n-y-api
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (backend), vitest (frontend types) |
| **Config file** | `backend/pytest.ini` or `backend/pyproject.toml` |
| **Quick run command** | `cd backend && python -m pytest tests/test_achievements_service.py tests/test_achievements_routes.py -x -q` |
| **Full suite command** | `cd backend && python -m pytest -x -q` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | INTG-01,02 | unit | `pytest tests/test_achievements_service.py -k "evaluate_game" -x -q` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | INTG-03,04,05 | unit | `pytest tests/test_achievements_service.py -k "response" -x -q` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | API-03 | unit | `pytest tests/test_achievements_service.py -k "mapper" -x -q` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | INTG-03 | integration | `pytest tests/test_achievements_routes.py -k "post_evaluate" -x -q` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | API-01 | integration | `pytest tests/test_achievements_routes.py -k "get_player" -x -q` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | API-02 | integration | `pytest tests/test_achievements_routes.py -k "catalog" -x -q` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_achievements_service.py` — stubs for service tests
- [ ] `backend/tests/test_achievements_routes.py` — stubs for route tests

*Existing infrastructure (conftest.py, setup_db, clean_tables) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Frontend auto-chains POST /games/{id}/achievements | INTG-03 | Frontend integration | Create game, verify achievements endpoint called automatically |
| Retry + toast on failure | D-09/D-10 | Frontend UX | Simulate backend error, verify retry and toast |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
