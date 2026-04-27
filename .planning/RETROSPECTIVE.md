# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Sistema de Logros

**Shipped:** 2026-04-01
**Phases:** 4 | **Plans:** 8

### What Was Built
- Achievement evaluator system with strategy pattern (4 evaluator types, registry, TDD)
- Auto-evaluation on game creation with tier-based notifications
- REST API (3 endpoints: player achievements, catalog, reconcile)
- Frontend: end-of-game badges, player profile with tabs, achievement catalog with holders modal
- Reconciler tool with no-downgrade guarantee

### What Worked
- Strategy pattern from records translated well to achievements — familiar pattern, fast implementation
- TDD approach caught the compute_tier vs evaluate() distinction early in Phase 4
- Phase decomposition (backend core → integration → frontend → tools) kept each phase focused
- Discuss-phase workflow captured critical decisions upfront (trigger mechanism, no-downgrade, no dry-run)

### What Was Inefficient
- REQUIREMENTS.md traceability wasn't auto-updated when phases completed — 3 requirements showed "Pending" despite being implemented
- ICON-02 (vite-plugin-svgr) was planned but lucide-react was sufficient — should have adjusted requirements earlier
- Phase 4 ROADMAP.md wasn't fully updated (plan checkbox still unchecked after execution)

### Patterns Established
- Achievement evaluators follow same registry pattern as record calculators — easy to add new achievements
- CSS Modules with shared variables for achievement theming (tier colors, progress bars)
- Container-based DI pattern extended to achievement services

### Key Lessons
- When code has distinct "no change" vs "would downgrade" cases, the generic `evaluate()` method may hide the distinction — call the lower-level `compute_tier()` directly
- Frontend catalog pages with holder modals work well for small player groups
- Reconciler as POST endpoint (not CLI script) keeps the API surface consistent

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 4 |
| Plans | 8 |
| Commits | 63 |
| Net LOC | +12,385 |
| Timeline | ~3 days |
