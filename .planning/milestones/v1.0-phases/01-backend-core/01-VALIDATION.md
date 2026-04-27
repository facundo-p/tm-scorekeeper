---
phase: 1
slug: backend-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | backend/pytest.ini or pyproject.toml |
| **Quick run command** | `cd backend && python -m pytest tests/test_achievement_evaluators.py -x -q` |
| **Full suite command** | `cd backend && python -m pytest tests/ -q` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && python -m pytest tests/test_achievement_evaluators.py -x -q`
- **After every plan wave:** Run `cd backend && python -m pytest tests/ -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PERS-01 | unit | `pytest tests/test_achievement_repository.py -k test_table_schema` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | PERS-02 | migration | `alembic upgrade head` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | PERS-03 | unit | `pytest tests/test_achievement_repository.py -k test_upsert_no_downgrade` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | PERS-04 | unit | `pytest tests/test_achievement_repository.py -k test_player_relationship` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | CORE-01,02 | unit | `pytest tests/test_achievement_evaluators.py -k test_definition` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | CORE-03 | unit | `pytest tests/test_achievement_evaluators.py -k test_base_evaluator` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | CORE-04 | unit | `pytest tests/test_achievement_evaluators.py -k test_single_game_threshold` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | CORE-05 | unit | `pytest tests/test_achievement_evaluators.py -k test_accumulated` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 1 | CORE-06 | unit | `pytest tests/test_achievement_evaluators.py -k test_win_streak` | ❌ W0 | ⬜ pending |
| 01-02-06 | 02 | 1 | CORE-07 | unit | `pytest tests/test_achievement_evaluators.py -k test_all_maps` | ❌ W0 | ⬜ pending |
| 01-02-07 | 02 | 1 | CORE-08 | unit | `pytest tests/test_achievement_evaluators.py -k test_registry` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_achievement_evaluators.py` — stubs for CORE-01..08
- [ ] `backend/tests/test_achievement_repository.py` — stubs for PERS-01..04

*Existing pytest infrastructure covers framework needs.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
