---
phase: 11
slug: ranking-page-skeleton-filters-url-state
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (jsdom) |
| **Config file** | `frontend/vitest.config.ts` (verify; if missing, Wave 0 wires it) |
| **Quick run command** | `cd frontend && npx vitest run --reporter=basic` |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~10–20 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command (scoped to changed files when feasible: `npx vitest run src/utils/rankingFilters.test.ts`)
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

> Filled in by the planner per PLAN.md task. Concrete entries appear once plans are written.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-XX-01 | XX | 1 | RANK-XX | — | N/A (frontend, no auth boundary changes) | unit/integration | `npx vitest run <path>` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `frontend/vitest.config.ts` exists with jsdom env; if missing, install + configure
- [ ] Verify `frontend/src/test/setup.ts` pins `process.env.TZ = 'America/Argentina/Buenos_Aires'` (RESEARCH §TZ — required for SC#5)
- [ ] If no setupFiles entry → add `setupFiles: ['./src/test/setup.ts']` to vitest config
- [ ] CI fallback: ensure `package.json` test script can be invoked with `TZ=America/Argentina/Buenos_Aires` prefix

*If existing infra already covers all of the above: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tile click navigates from Home to `/ranking` | RANK-01 / SC#1 | Browser routing + auth wrapper requires real navigation | `npm run dev` → login → click "Ranking — Evolución de ELO" tile → URL becomes `/ranking`, page renders filters + skeleton |
| URL share / reload reproduces filter state | RANK-06 / SC#3 | Browser URL persistence across reload only verifiable in real browser | Apply filters → copy URL → paste in new tab → same selection rendered |
| Empty state CTA "Limpiar filtros" resets URL | RANK-04 / SC#6 | UX flow validates real-time URL updates + DOM | Apply filter that excludes data → see empty state → click "Limpiar filtros" → URL becomes `/ranking` (clean) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
