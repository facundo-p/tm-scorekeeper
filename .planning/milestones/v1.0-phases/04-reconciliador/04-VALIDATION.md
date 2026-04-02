---
phase: 4
slug: reconciliador
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (already configured) |
| **Config file** | `docker-compose.test.yml` |
| **Quick run command** | `make test-backend` |
| **Full suite command** | `make test-backend` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `make test-backend`
- **After every plan wave:** Run `make test-backend`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | TOOL-01 | integration | `make test-backend -k test_reconcile` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | TOOL-01 | unit | `make test-backend -k test_reconcile_applies` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | TOOL-01 | unit | `make test-backend -k test_reconcile_all_players` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | TOOL-02 | unit | `make test-backend -k test_reconcile_skips_downgrade` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | TOOL-02 | unit (caplog) | `make test-backend -k test_reconcile_logs_downgrade` | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 1 | TOOL-03 | integration | `make test-backend -k test_reconcile_backfill` | ❌ W0 | ⬜ pending |
| 04-01-07 | 01 | 1 | TOOL-03 | unit | `make test-backend -k test_reconcile_skips_failed_player` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/test_achievements_service.py` — add `TestReconcileAll` class with unit tests for TOOL-01, TOOL-02, TOOL-03
- [ ] `backend/tests/integration/test_achievements_routes.py` — add reconcile endpoint integration tests for TOOL-01, TOOL-03

*Existing infrastructure covers test framework and fixtures.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
