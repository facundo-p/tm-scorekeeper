# Phase 2: Integración y API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 02-integraci-n-y-api
**Areas discussed:** Response shape, Evaluation failure handling, Catalog & player endpoints, Frontend type sync

---

## Response Shape for POST /games/

| Option | Description | Selected |
|--------|-------------|----------|
| Flat list in response root | Add 'achievements' field at root level alongside 'id' and 'game' | |
| Grouped by player | Achievements nested under each player in achievements_by_player | ✓ |
| Embedded in player_results | Each player_result gets an 'achievements' sub-array | |

**User's choice:** Grouped by player
**Notes:** None

### Fields per achievement item

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal: code, title, tier, is_new, is_upgrade | Just what frontend needs for mini badge | |
| With icon info: + icon, fallback_icon | Include icon paths so frontend doesn't need separate mapping | ✓ |
| Full: + description, max_tier, previous_tier | Everything for richer display | |

**User's choice:** With icon info
**Notes:** None

### Empty players in response

| Option | Description | Selected |
|--------|-------------|----------|
| Omit players with no achievements | Only players who unlocked/upgraded something appear | ✓ |
| Include all players with empty arrays | Every player appears, even with [] | |

**User's choice:** Omit players with no achievements
**Notes:** None

---

## Evaluation Failure Handling

### Integration point

| Option | Description | Selected |
|--------|-------------|----------|
| Never block — log and return empty | Game creation is critical path, achievements are bonus | |
| Fail the whole request | Achievements are part of the contract | |
| Partial — return what succeeded | Return successful evaluations, log failures | |

**User's choice:** User asked about endpoint separation — "Should we calculate achievements in the same endpoint as game save? Should be like records, calculated in a separate endpoint"
**Notes:** This led to a design pivot — achievements evaluated via separate endpoint

### Endpoint design

| Option | Description | Selected |
|--------|-------------|----------|
| En POST /games/ (inline) | Evaluate and persist in same transaction | |
| Endpoint separado POST /games/{id}/achievements | Decouple creation from calculation, 2 frontend calls | ✓ |
| Inline pero no-bloqueante | Persist in POST /games/ but fail silently | |

**User's choice:** Endpoint separado
**Notes:** Similar to records pattern with GET /games/{id}/records

### Frontend trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Frontend llama automáticamente | After POST /games/ success, auto-call achievements endpoint | ✓ |
| El usuario lo dispara | Button 'Ver logros' in end-of-game screen | |

**User's choice:** Frontend llama automáticamente
**Notes:** None

### Error UX

| Option | Description | Selected |
|--------|-------------|----------|
| Silencioso — no mostrar sección | If fails, simply don't show achievements section | |
| Retry automático + fallback silencioso | Retry once, if fails again don't show | |
| Mostrar mensaje de error sutil | Toast or small note | |

**User's choice:** Mix of retry + toast — retry once, if 2nd attempt fails show toast
**Notes:** User specified hybrid approach

---

## Catalog & Player Endpoints

### GET /players/{id}/achievements fields

| Option | Description | Selected |
|--------|-------------|----------|
| Full badge | code, title, description, tier, max_tier, icon, fallback_icon, unlocked, unlocked_at, progress | ✓ |
| Solo desbloqueados | Don't include locked achievements | |
| You decide | Claude chooses based on Phase 3 needs | |

**User's choice:** Full badge with all fields
**Notes:** None

### GET /achievements/catalog design

| Option | Description | Selected |
|--------|-------------|----------|
| Lista con players holders | Each achievement includes who has it | |
| Solo definiciones | Pure catalog without player state | |
| You decide | Claude chooses optimal for Phase 3 | |

**User's choice:** Custom — "Catalog page shows achievement list without player holders. Clicking an achievement opens a modal/popup showing who has it"
**Notes:** Implies holders data must be available but displayed on-demand

### Holders API approach

| Option | Description | Selected |
|--------|-------------|----------|
| Todo en un endpoint | GET /achievements/catalog returns definitions + holders. Frontend decides when to show | ✓ |
| Endpoint separado | GET /achievements/catalog for definitions, GET /achievements/{code}/holders for players | |

**User's choice:** Todo en un endpoint — with few players, payload is small
**Notes:** None

---

## Frontend Type Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Actualizar manualmente types/index.ts | Add interfaces to existing types file — current project pattern | ✓ |
| Documentar shape en plan | Plan includes exact DTO shapes, executor creates types | |
| You decide | Claude chooses most consistent approach | |

**User's choice:** Manual update to types/index.ts
**Notes:** None

---

## Claude's Discretion

- AchievementsService internal structure (methods, DI)
- Game loading strategy for evaluation (bulk vs lazy, N+1 prevention)
- File organization for new DTOs/schemas
- Internal mapper implementation

## Deferred Ideas

None — discussion stayed within phase scope
