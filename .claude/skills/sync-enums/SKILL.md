---
name: sync-enums
description: Compare backend Python enums with the frontend game catalog and report any mismatches
allowed-tools: Read, Grep, Bash
---

# Sync Enums — Frontend/Backend Verification

Compare enums between backend and frontend to detect desynchronization.

## Files to compare

- **Backend**: `backend/models/enums.py` (Python Enum classes) and `backend/models/game_rules.py` (milestones and awards per map and expansion)
- **Frontend**: `frontend/src/domain/catalog.ts` (maps with their milestones and awards, expansions, corporations) and `frontend/src/domain/labels.ts` (Spanish labels)

The frontend has no enums: its catalog is keyed by the backend string values. `frontend/src/test/unit/catalogEnums.test.ts` and `TestFrontendMirror` in `backend/tests/test_game_validation.py` check this in CI; this skill is the detailed report.

## Enums to check

| Backend | Frontend |
|--------------|---------------|
| `MapName` | keys of `MAPS` / `MAP_ORDER` |
| `Expansion` | keys of `EXPANSIONS` |
| `Milestone` | `MAPS[*].milestones`, `EXPANSION_MILESTONES`, `MILESTONE_LABELS` |
| `Award` | `MAPS[*].awards`, `EXPANSION_AWARDS`, `AWARD_LABELS` |
| `Corporation` | `CORPS` / `CORP_BY_NAME` |

## Process

1. Read both files
2. For each enum, extract the backend string values and the frontend keys
3. Compare and report:
   - **Missing in frontend**: values present in backend but not in frontend
   - **Missing in backend**: values present in frontend but not in backend
   - **Per-map mismatch**: a map's milestones or awards differ from `game_rules.py`

## Output format

For each enum, report:

```
## {EnumName}: {OK | MISMATCH}

{If MISMATCH:}
- MISSING in frontend: "value"
- MISSING in backend: "value"
- PER-MAP MISMATCH: map → backend=[...] vs frontend=[...]
```

## If mismatches found

- Ask the user which direction to sync (backend → frontend is the default, since backend is the source of truth)
- Apply the fix
- Keep the mockup catalog (`docs/redesign/mockup/js/data/catalog.js`) in sync too, and regenerate the fixtures (`node tools/fixtures/export.mjs`)

## If all OK

Report: "All enums synchronized. {N} enums checked, {M} total values."
