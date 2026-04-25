---
name: sync-enums
description: Compare backend Python enums with frontend TypeScript enums and report any mismatches
allowed-tools: Read, Grep, Bash
---

# Sync Enums — Frontend/Backend Verification

Compare enums between backend and frontend to detect desynchronization.

## Files to compare

- **Backend**: `backend/models/enums.py` (Python Enum classes)
- **Frontend**: `frontend/src/constants/enums.ts` (TypeScript enums)

## Enums to check

| Backend Class | Frontend Enum |
|--------------|---------------|
| `MapName` | `MapName` |
| `Expansion` | `Expansion` |
| `Milestone` | `Milestone` |
| `Award` | `Award` |
| `Corporation` | `Corporation` |

## Process

1. Read both files
2. For each enum, extract all key-value pairs from both sides
3. Compare and report:
   - **Missing in frontend**: keys present in backend but not in frontend
   - **Missing in backend**: keys present in frontend but not in backend
   - **Value mismatch**: same key but different string value
   - **Order differences**: only note if significant (e.g. grouping by map/expansion changed)

## Output format

For each enum, report:

```
## {EnumName}: {OK | MISMATCH}

{If MISMATCH:}
- MISSING in frontend: KEY = "value"
- MISSING in backend: KEY = "value"
- VALUE MISMATCH: KEY → backend="X" vs frontend="Y"
```

## If mismatches found

- Ask the user which direction to sync (backend → frontend is the default, since backend is the source of truth)
- Apply the fix
- Remind about the comment at the top of `enums.ts`: "Values must match backend string values exactly"

## If all OK

Report: "All enums synchronized. {N} enums checked, {M} total values."
