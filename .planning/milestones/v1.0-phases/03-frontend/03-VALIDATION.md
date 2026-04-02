---
phase: 3
slug: frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + React Testing Library 16.1.0 |
| **Config file** | `frontend/vite.config.ts` (vitest config inline, `test.environment: 'jsdom'`) |
| **Quick run command** | `cd frontend && npm test -- --run` |
| **Full suite command** | `cd frontend && npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npm test -- --run`
- **After every plan wave:** Run `cd frontend && npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | ICON-01 | unit | `npm test -- --run AchievementIcon` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | ICON-03 | unit | `npm test -- --run AchievementIcon` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | ENDG-02 | unit | `npm test -- --run AchievementBadgeMini` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | ENDG-03 | unit | `npm test -- --run AchievementBadgeMini` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | PROF-01 | unit | `npm test -- --run TabBar` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PROF-02 | unit | `npm test -- --run AchievementCard` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | PROF-03 | unit | `npm test -- --run ProgressBar` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 2 | PROF-04 | unit | `npm test -- --run AchievementCard` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | ENDG-01 | unit | `npm test -- --run AchievementModal` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 3 | CATL-01 | unit | `npm test -- --run AchievementCatalog` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 3 | CATL-02 | unit | `npm test -- --run AchievementCatalog` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/test/components/AchievementIcon.test.tsx` — stubs for ICON-01, ICON-03
- [ ] `frontend/src/test/components/AchievementBadgeMini.test.tsx` — stubs for ENDG-02, ENDG-03
- [ ] `frontend/src/test/components/AchievementCard.test.tsx` — stubs for PROF-02, PROF-03, PROF-04
- [ ] `frontend/src/test/components/TabBar.test.tsx` — stubs for PROF-01
- [ ] `frontend/src/test/components/ProgressBar.test.tsx` — stubs for PROF-03
- [ ] `frontend/src/test/components/AchievementCatalog.test.tsx` — stubs for CATL-01, CATL-02
- [ ] `frontend/src/test/components/AchievementModal.test.tsx` — stubs for ENDG-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Achievement modal appears after game submit | ENDG-01 | Integration with GameRecords page flow | Submit a game with achievements, verify modal appears |
| Profile tab navigation persists on reload | PROF-01 | Browser navigation behavior | Switch tabs, refresh page, verify tab state |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
