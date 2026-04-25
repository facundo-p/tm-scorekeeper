---
name: new-hook
description: Scaffold a custom React hook for data fetching with loading/error states and CRUD operations
argument-hint: [resourceName]
---

# New Custom Hook Scaffold

Generate a custom React hook for `$ARGUMENTS`.

## Pre-flight

1. Ask the user for:
   - **Resource name** (if not provided): camelCase singular (e.g. `player`, `game`)
   - **API module**: which file in `frontend/src/api/` to import from (or create new)
   - **Operations**: which CRUD ops to expose (fetch, add, edit, delete)
   - **Fetch params**: any filtering options (e.g. `activeOnly?: boolean`)

2. Confirm before generating.

## Files to generate

### 1. Hook — `frontend/src/hooks/use{Resources}.ts`

Follow this exact pattern from the codebase:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { get{Resources}, create{Resource}, update{Resource} } from '@/api/{resources}'
import type { {Resource}ResponseDTO, {Resource}CreateDTO, {Resource}UpdateDTO } from '@/types'

interface Use{Resources}Options {
  // filtering params
}

export function use{Resources}(options: Use{Resources}Options = {}) {
  const [{resources}, set{Resources}] = useState<{Resource}ResponseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch{Resources} = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get{Resources}(/* params from options */)
      set{Resources}(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar {resources}')
    } finally {
      setLoading(false)
    }
  }, [/* deps from options */])

  useEffect(() => { fetch{Resources}() }, [fetch{Resources}])

  const add{Resource} = useCallback(async (data: {Resource}CreateDTO): Promise<void> => {
    await create{Resource}(data)
    await fetch{Resources}()
  }, [fetch{Resources}])

  const edit{Resource} = useCallback(async (id: string, data: {Resource}UpdateDTO): Promise<void> => {
    await update{Resource}(id, data)
    await fetch{Resources}()
  }, [fetch{Resources}])

  return { {resources}, loading, error, refetch: fetch{Resources}, add{Resource}, edit{Resource} }
}
```

Reference: `frontend/src/hooks/usePlayers.ts`, `frontend/src/hooks/useGames.ts`

### 2. API Service (if needed) — `frontend/src/api/{resources}.ts`

```typescript
import { api } from './client'
import type { {Resource}ResponseDTO, {Resource}CreateDTO } from '@/types'

export function get{Resources}(): Promise<{Resource}ResponseDTO[]> {
  return api.get<{Resource}ResponseDTO[]>('/{resources}/')
}

export function create{Resource}(data: {Resource}CreateDTO): Promise<{ id: string }> {
  return api.post<{ id: string }>('/{resources}/', data)
}

// ... more as needed
```

Reference: `frontend/src/api/players.ts`

### 3. Types (if needed) — add to `frontend/src/types/`

- Interface for each DTO matching the backend schema
- Export from types index if one exists

## Conventions

- Hook name: `use{Resources}` (plural)
- Always return: `{ items, loading, error, refetch, ...mutations }`
- `useCallback` on all async functions
- `useEffect` triggers initial fetch
- Mutations auto-refetch after success
- Error messages in Spanish
- No error handling in mutations (let it bubble to the component)
