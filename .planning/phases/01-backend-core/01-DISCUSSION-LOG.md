# Phase 1: Backend Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 01-Backend Core
**Areas discussed:** (skipped — all decisions carried from project initialization)

---

## Discussion Summary

The user indicated that all gray areas for Phase 1 were already thoroughly discussed during project initialization (`/gsd:new-project`). The following areas were identified but the user confirmed they could be inferred from prior conversations:

### Catálogo Inicial

| Option | Description | Selected |
|--------|-------------|----------|
| Inferir de conversación previa | Usar los ejemplos discutidos (high_score, games_played, win_streak) como base | ✓ |

**User's choice:** Infer from prior discussion
**Notes:** Examples in PROJECT.md §"Referencia de implementación" are the source of truth

### Ubicación en Código

| Option | Description | Selected |
|--------|-------------|----------|
| Paralelo a record_calculators | backend/services/achievement_evaluators/ | ✓ |

**User's choice:** Infer from prior discussion
**Notes:** Follows established codebase convention

### Testing Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Unit + integration | Tests por evaluador + upsert no-downgrade + registry completeness | ✓ |

**User's choice:** Infer from prior discussion
**Notes:** Consistent with existing pytest patterns

### AllMaps Evaluator

| Option | Description | Selected |
|--------|-------------|----------|
| Claude's discretion | Use MapName enum, decide tiers vs binary during implementation | ✓ |

**User's choice:** Claude's discretion
**Notes:** Deferred to implementation — evaluator pattern is clear, specifics can be decided by planner

## Claude's Discretion

- AllMaps tiers vs binary
- Exact tier thresholds for games_won

## Deferred Ideas

None
