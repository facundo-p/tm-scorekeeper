---
name: new-hook
description: Scaffold a data hook (TanStack Query read or mutation) for the v2.0 API with loading/error states
argument-hint: [resourceName]
---

# New Data Hook Scaffold

Generate a data hook for `$ARGUMENTS`.

## Pre-flight

1. Ask the user for:
   - **Resource name** (if not provided): camelCase (e.g. `ranking`, `playerInsights`)
   - **Endpoint**: path and query params (e.g. `/ranking?player_count=`)
   - **Kind**: read (query) or write (mutation)
   - **Response type**: whether it already exists in `frontend/src/data/types.ts`

2. Confirm before generating.

## Reads — `frontend/src/data/hooks.ts`

Wrap `useApiQuery` (`frontend/src/data/query.ts`). It returns `{ data, loading, error, refetch }` (D-10); rename `data` to the resource. The cache key is the API path with its query string (`apiPath()` drops empty params), so filters such as `?player_count=` get separate entries:

```typescript
export function useRanking(options: { mesa?: TableSize | null } = {}) {
  const { data, ...rest } = useApiQuery<Ranking>(apiPath('/ranking', { player_count: options.mesa }))
  return { ranking: data, ...rest }   // { ranking, loading, error, refetch }
}
```

- `useApiQuery(path, enabled, keepPrevious)`:
  - `enabled = false` skips the request (for example, until an id is known).
  - `keepPrevious` keeps the previous data while the next one loads. Pass `true`, or a path prefix (e.g. `/players/<id>/`) so that data is only kept while the prefix matches and never lent to another entity.
- Screens retry several failed queries with `retryFailed([...])`.

Reference: `useRanking`, `usePlayerInsights` and `useRecords` in `frontend/src/data/hooks.ts`.

## Writes — `frontend/src/data/mutations.ts`

Use `useMutation` with `http()` (`frontend/src/api/http.ts`: Bearer, 15 s timeout, `ApiError`). After success, invalidate the whole cache: a game changes ELO, records, achievements and seasons downstream (D-04).

```typescript
export function useSavePlayer(onSaved: () => void) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: PlayerWrite }) =>
      http<unknown>(id ? `/players/${encodeURIComponent(id)}` : '/players/', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { onSaved(); void client.invalidateQueries() },
  })
}
```

Reference: `useSaveGame`, `useDeleteGame` and `useSavePlayer` in `frontend/src/data/mutations.ts`.

## Types — `frontend/src/data/types.ts`

One interface per response, matching the backend schema (`backend/schemas/`), with snake_case keys as the API sends them.

## Tests

Test the screen that uses the hook, with `fetch` mocked (e.g. `frontend/src/test/screens/Ranking.test.tsx`), and include the error and retry case. Pure transformations of the response go in the screen's `model.ts`, with their own test.

## Conventions

- Read hooks: `use{Resource}`, returning `{ resource, loading, error, refetch }`.
- Write hooks: `use{Verb}{Resource}` with a success callback.
- Error messages in Spanish are written by the screen (`ui/states`), not by the hook.
