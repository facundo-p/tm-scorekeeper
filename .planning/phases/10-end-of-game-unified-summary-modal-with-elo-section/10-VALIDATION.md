---
phase: 10
slug: end-of-game-unified-summary-modal-with-elo-section
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `frontend/vite.config.ts` (inline `test` block) |
| **Quick run command** | `cd frontend && npm test -- --run --reporter=verbose` |
| **Full suite command** | `cd frontend && npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npm test -- --run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| Wave0-01 | 01 | 0 | POST-01, POST-02, POST-03 | — | N/A | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ❌ W0 | ⬜ pending |
| Wave0-02 | 01 | 0 | POST-01, POST-02 | — | N/A | component | `cd frontend && npm test -- --run --reporter=verbose GameRecords` | ✅ (update) | ⬜ pending |
| Wave0-03 | 01 | 0 | POST-02 | — | N/A | unit | `cd frontend && npm test -- --run --reporter=verbose useGames` | ✅ (update) | ⬜ pending |
| 10-01-T1 | 01 | 1 | POST-02 | — | fetchEloChanges → null + console.warn on double failure | unit | `cd frontend && npm test -- --run --reporter=verbose useGames` | ✅ W0 | ⬜ pending |
| 10-01-T2 | 01 | 1 | POST-01 | — | Modal opens on every GameRecords mount | component | `cd frontend && npm test -- --run --reporter=verbose GameRecords` | ✅ W0 | ⬜ pending |
| 10-02-T1 | 01 | 1 | POST-01, POST-02, POST-03 | — | 4 sections rendered; ELO rows with position+delta | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ✅ W0 | ⬜ pending |
| 10-02-T2 | 01 | 1 | POST-02 | — | ELO section omitted silently when fails twice | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ✅ W0 | ⬜ pending |
| 10-02-T3 | 01 | 1 | POST-03 | — | Position derived from GameResultDTO.results[].position join | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/test/components/EndOfGameSummaryModal.test.tsx` — new file covering POST-01, POST-02, POST-03 (modal sections, ELO rows, position join, silent ELO omission)
- [ ] Update `frontend/src/test/components/GameRecords.test.tsx` — remove `AchievementModal` assertions, add `EndOfGameSummaryModal` + `fetchEloChanges` mocks, assert modal always opens
- [ ] Update `frontend/src/test/hooks/useGames.test.ts` — add `fetchEloChanges` describe block (mirrors existing `fetchAchievements` block: success, retry, double-failure)
- [ ] Delete `frontend/src/test/components/AchievementModal.test.tsx` — component deleted in this phase

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Modal renders correctly on real mobile viewport | POST-01 | Visual layout at <375px requires human eye | Open GameRecords on iPhone Safari after game submit; verify all 4 sections fit, no overflow |
| ELO section silently absent when backend unreachable | POST-02 | Network error path requires dev-server manipulation | Use Chrome DevTools → Network → block `*/elo*`; submit game; verify ELO section absent, no error shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
