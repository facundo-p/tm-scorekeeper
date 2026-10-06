# Phase 10: End-of-game unified summary modal with ELO section — Research

**Researched:** 2026-04-29
**Domain:** React 18 component refactor — modal composition, API wiring, CSS Modules
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `GameRecords.tsx` post-refactor contains only the header "¡Partida guardada!" + botón "Volver al inicio". Toda la información de la partida vive en `EndOfGameSummaryModal`.
- **D-02:** `EndOfGameSummaryModal` tiene **4 secciones en orden**: Resultados, Records, Logros, ELO. `AchievementModal` se elimina completamente (no se mantiene como componente residual).
- **D-03:** El modal se abre **siempre** al cargar GameRecords (no condicionado a si hay achievements). Se cierra una sola vez; no hay botón de reabrir.
- **D-04:** Secciones con datos vacíos muestran mensaje neutro. ELO: si `fetchEloChanges` falla 2 veces (retry-once), la sección ELO se **omite silenciosamente** + `console.warn`. Records y Logros siguen renderizándose.
- **D-05:** Resultados y ELO siempre tienen datos. Solo Records y Logros pueden estar vacíos (mostrar mensaje vacío).
- **D-06:** Cada fila ELO muestra: posición (`#1`, `#2`, …) + nombre del jugador + `elo_before → elo_after` + delta con signo y color.
- **D-07:** Delta syntax: solo número con signo (`+23` / `-12` / `±0`). Color: `--color-success` positivo, `--color-error` negativo, `--color-text-muted` cero.
- **D-08:** Posición viene de `GameResultDTO.results[].position`. Join por `player_id` con `EloChangeDTO`.
- **D-09:** `getEloChanges(gameId): Promise<EloChangeDTO[]>` en `src/api/elo.ts`. Llama `GET /games/{game_id}/elo`. Sin cache, sin estado persistido.
- **D-10:** Retry-once en el fetch de ELO: igual que `fetchAchievements` en `useGames.ts`. Se encapsula en `fetchEloChanges` expuesto desde `useGames`.

### Claude's Discretion

- Nombre exacto de subcomponentes internos del modal (ej: `EloSection`, `RecordsSection`, `AchievementsSection`).
- Estructura HTML interna de cada fila ELO (qué es `<tr>` vs `<div>` vs `<li>`), siempre que cumpla mobile-first y CSS Modules.
- Tamaños de tipografía de posición, elo_before/after, delta dentro de la fila.
- Timing exacto de la apertura del modal: si espera al Promise.all de los 4 fetches o abre con skeleton/spinner mientras cargan.
- Nombre de clases CSS del modal unificado.

### Deferred Ideas (OUT OF SCOPE)

- Botón "Ver resumen" para reabrir el modal — el usuario prefirió UX simple (no reabrir).
- Scroll interno en el modal — Claude puede decidir si hace falta.
- Animación de aparición del modal.
- Gamification del resumen (sonidos, confetti).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POST-01 | Al terminar una partida, el modal post-partida (refactor unificado) muestra records, achievements y cambios de ELO en una sola pantalla | Verified: `AchievementModal` pattern + `RecordsSection` component already exist; modal composition via existing `Modal.tsx` wrapper |
| POST-02 | La sección de ELO lista a cada jugador con ELO anterior, ELO nuevo, y delta visualmente codificada (color por signo) | Verified: `EloChangeDTO` already has `elo_before, elo_after, delta`; color tokens `--color-success/error/text-muted` confirmed in `index.css` |
| POST-03 | Junto al delta de cada jugador se muestra la posición que ocupó en la partida | Verified: `GameResultDTO.results[].position` already available; join by `player_id` with `EloChangeDTO` |
</phase_requirements>

---

## Summary

Phase 10 is a focused frontend refactor — no new backend work, no new dependencies. The backend endpoint `GET /games/{game_id}/elo` already exists and returns `list[EloChangeDTO]` with `player_id, player_name, elo_before, elo_after, delta`. The frontend types `EloChangeDTO` and `GameResultDTO` are already defined in `src/types/index.ts`.

The primary work is: (1) creating `EndOfGameSummaryModal` that wraps the existing `Modal` base and composes four sections, (2) adding `getEloChanges(gameId)` to `src/api/elo.ts` and `fetchEloChanges(gameId)` to `useGames`, (3) refactoring `GameRecords.tsx` to open the modal unconditionally on mount and strip all inline sections, and (4) deleting `AchievementModal` along with its tests and migrating the test coverage.

The most important architectural decision (from CONTEXT.md) is the loading strategy: the modal opens immediately on mount and each section manages its own loading state with a `<Spinner />` — fetches run in parallel rather than blocking on a `Promise.all`. This is Claude's Discretion per CONTEXT.md and is the right call for progressive display.

**Primary recommendation:** Model `fetchEloChanges` exactly after `fetchAchievements` in `useGames.ts` (lines 83-96). Model `getEloChanges` exactly after `getEloSummary` in `src/api/elo.ts`. Reuse existing CSS classes from `GameRecords.module.css` (`.rankRow`, `.position`, `.playerName`, `.rankingList`) for the ELO rows — the grid pattern is identical.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Modal open/close state | Frontend (React state) | — | `showModal` boolean in `GameRecords.tsx`, cleared once on close |
| ELO data fetch | Frontend (on-mount useEffect) | API (`GET /games/{id}/elo`) | No SSR; data fetched client-side on page mount |
| Results join (position × ELO) | Frontend (render-time) | — | Join `GameResultDTO.results` × `EloChangeDTO[]` by `player_id` in `EloSection` — pure data derivation, no backend computation needed |
| Retry-once on ELO fetch failure | Frontend (`useGames.fetchEloChanges`) | — | Mirror of `fetchAchievements` pattern; ELO non-critical to page render |
| ELO endpoint | Backend (`GET /games/{id}/elo`) | — | Already exists; no backend changes in this phase |
| CSS theming (delta colors) | Frontend (CSS Modules + design tokens) | — | `--color-success/error/text-muted` in `index.css` |

---

## Standard Stack

This phase introduces **no new dependencies**. All libraries, design tokens, and base components are already present.

### Core (all pre-existing, no install needed)
| Asset | Location | Purpose |
|-------|----------|---------|
| `Modal` component | `src/components/Modal/Modal.tsx` | Base wrapper — overlay, close button, Escape handler |
| `RecordsSection` | `src/components/RecordsSection/RecordsSection.tsx` | Renders record comparison cards — imported as-is |
| `AchievementBadgeMini` | `src/components/AchievementBadgeMini/AchievementBadgeMini.tsx` | Badge renderer — reused inside `AchievementsSection` |
| `Button` | `src/components/Button/Button.tsx` | "Continuar" CTA in modal footer |
| `Spinner` | `src/components/Spinner/Spinner.tsx` | Per-section loading placeholder |
| `useGames` hook | `src/hooks/useGames.ts` | Will receive new `fetchEloChanges` — do not create a new hook |
| `src/api/elo.ts` | `src/api/elo.ts` | Already has `getEloSummary`; add `getEloChanges` here |
| `EloChangeDTO` | `src/types/index.ts` | Already typed: `{ player_id, player_name, elo_before, elo_after, delta }` |
| `GameResultDTO` | `src/types/index.ts` | Already typed: `results[]: { player_id, total_points, mc_total, position, tied }` |

**Installation:** None required.

---

## Architecture Patterns

### System Architecture Diagram

```
GameRecords.tsx mounts
       │
       ├─► getGameResults(gameId) ─────────────► result state
       ├─► getGameRecords(gameId) ─────────────► records state
       ├─► getPlayers() ─────────────────────── players state
       ├─► fetchAchievements(gameId) ──────────► achievements state
       └─► fetchEloChanges(gameId) ────────────► eloChanges state
                                                        │
                    showModal = true (always on mount)  │
                           │                            │
                    EndOfGameSummaryModal ◄──────────── all states passed as props
                           │
              ┌────────────┼──────────────┬────────────┐
              ▼            ▼              ▼             ▼
        ResultsSection  RecordsSection  AchievementsSection  EloSection
        (result data)   (records data)  (achievements data)  (eloChanges + result)
              │              │                │                    │
           Spinner        Spinner          Spinner             [omit on error]
         while load      while load       while load
```

### Recommended Project Structure

```
src/
├── api/
│   └── elo.ts                   # ADD: getEloChanges(gameId)
├── components/
│   ├── EndOfGameSummaryModal/   # NEW directory
│   │   ├── EndOfGameSummaryModal.tsx
│   │   ├── EndOfGameSummaryModal.module.css
│   │   ├── ResultsSection.tsx   # extracted from GameRecords
│   │   ├── EloSection.tsx       # new
│   │   └── AchievementsSection.tsx  # extracted from AchievementModal
│   ├── AchievementModal/        # DELETE entire directory
│   ├── Modal/                   # unchanged
│   └── RecordsSection/          # unchanged
├── hooks/
│   └── useGames.ts              # ADD: fetchEloChanges callback
└── pages/
    └── GameRecords/
        ├── GameRecords.tsx      # REFACTOR
        └── GameRecords.module.css  # KEEP (stripped of unused classes)
```

### Pattern 1: fetchEloChanges — retry-once mirror of fetchAchievements

**What:** Add `fetchEloChanges` to `useGames` following the exact same try/catch/retry/warn shape as the existing `fetchAchievements`.

**When to use:** Any non-critical secondary fetch that should not block the page render.

```typescript
// Source: mirror of frontend/src/hooks/useGames.ts lines 83-96
// [VERIFIED: direct codebase read]
const fetchEloChanges = useCallback(async (gameId: string): Promise<EloChangeDTO[] | null> => {
  try {
    return await getEloChanges(gameId)
  } catch {
    try {
      return await getEloChanges(gameId)
    } catch {
      console.warn('Failed to load ELO changes after retry')
      return null
    }
  }
}, [])
```

The `console.warn` message should be unique (not the same string as `fetchAchievements`) so tests can assert on it independently.

### Pattern 2: getEloChanges API wrapper

**What:** Add a second export to `src/api/elo.ts` following the same shape as `getEloSummary`.

```typescript
// Source: mirror of frontend/src/api/elo.ts
// [VERIFIED: direct codebase read]
export function getEloChanges(gameId: string): Promise<EloChangeDTO[]> {
  return api.get<EloChangeDTO[]>(`/games/${gameId}/elo`)
}
```

### Pattern 3: ELO row join (position × EloChangeDTO)

**What:** Derive display rows by joining `GameResultDTO.results` (ordered by `position`) with `EloChangeDTO[]` by `player_id`. The join is pure data — no API call.

**When to use:** Inside `EloSection`, as a `useMemo` or inline computation.

```typescript
// Source: [VERIFIED: types/index.ts, CONTEXT.md D-08]
// result.results is already sorted by position from the backend
const eloRows = result.results.map(r => {
  const elo = eloChanges.find(e => e.player_id === r.player_id)
  return { position: r.position, playerName: r.player_id, elo }
})
```

Note: `player_name` is available directly on `EloChangeDTO.player_name`, so the `players` map from `getPlayers()` is not strictly required for ELO rows. However `GameRecords` already fetches players for the Resultados section — pass the same map down.

### Pattern 4: GameRecords refactor — modal always-open

**What:** Replace the conditional `showAchievementModal` with unconditional `showModal = true`. Eliminate the `hasAny` check — the modal opens regardless of achievement data.

```typescript
// Source: [VERIFIED: GameRecords.tsx direct read]
// BEFORE (conditional):
const hasAny = Object.values(data.achievements_by_player).some(list => list.length > 0)
if (hasAny) { setAchievements(data); setShowAchievementModal(true) }

// AFTER (unconditional — modal opens on mount):
const [showModal, setShowModal] = useState(true)   // always true on mount
```

The modal is shown immediately. Each section shows `<Spinner />` until its data resolves. When the modal closes (`setShowModal(false)`), `GameRecords` renders only the header + "Volver al inicio" button.

### Pattern 5: ELO row CSS — reuse rankRow grid

The UI-SPEC prescribes `grid-template-columns: 48px 1fr auto auto` for ELO rows — identical to the existing `.rankRow` in `GameRecords.module.css`. The `EloSection` should define its own `.eloRow` class in `EndOfGameSummaryModal.module.css` with the same grid definition. Do NOT import classes across module boundaries.

### Pattern 6: Delta color via inline className, not inline style

```typescript
// Source: [VERIFIED: CONTEXT.md D-07, index.css tokens, Phase 9 EloSummaryCard pattern]
// Use a CSS Module class per sign variant — not inline style={{ color: '...' }}
// e.g., styles.deltaPositive / styles.deltaNegative / styles.deltaZero
// inside the class definitions use var(--color-success), var(--color-error), var(--color-text-muted)

function deltaClass(delta: number, styles: CSSModuleClasses) {
  if (delta > 0) return styles.deltaPositive
  if (delta < 0) return styles.deltaNegative
  return styles.deltaZero
}
```

### Pattern 7: Section empty states

| Section | Empty condition | Render |
|---------|----------------|--------|
| Resultados | Never empty | N/A |
| Records | `records.filter(r => r.achieved).length === 0` | "Ningún record nuevo en esta partida." |
| Logros | All player achievement arrays empty | "Ningún logro desbloqueado." |
| ELO | `fetchEloChanges` returns `null` | Omit section entirely (no heading rendered) |

### Anti-Patterns to Avoid

- **Conditional modal open based on achievement data:** The old `AchievementModal` was gated by `hasAny`. `EndOfGameSummaryModal` must NEVER do this — it opens unconditionally (D-03).
- **Single Promise.all blocking render:** Do not await all fetches before opening the modal. Open immediately, show spinners per section.
- **Cross-module CSS import:** `EloSection` must define its own CSS classes — not import `.rankRow` from `GameRecords.module.css`. CSS Modules are scoped to their component.
- **Inline color styles for delta:** Use CSS Module classes (e.g., `.deltaPositive`) not `style={{ color: 'var(--color-success)' }}`. This is a project rule (no inline styling).
- **Creating a new hook for ELO:** `fetchEloChanges` goes inside existing `useGames` — not a new `useElo` hook.
- **Keeping AchievementModal as a wrapper:** D-02 is explicit: delete the file. No residual component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal overlay, Escape key, click-outside | Custom modal | `Modal` component (`Modal.tsx`) | Already handles all three; tested |
| Record display cards | Custom record row | `RecordsSection` component | Already implements comparison logic and empty states |
| Achievement badge display | Custom badge | `AchievementBadgeMini` | Already handles tier styling and is_new/is_upgrade variants |
| Spinner while loading | Custom loading indicator | `Spinner` component | Consistent with all other pages |
| Retry-once on fetch failure | Custom retry wrapper | `fetchAchievements` pattern in `useGames` | The pattern already exists — copy it, don't reinvent |
| Position formatting (`#1`) | Custom ordinal helper | Inline string template: `` `#${r.position}` `` | UI-SPEC mandates `#N` format — simple enough inline |

**Key insight:** This phase is a composition phase. Nearly all building blocks exist. The risk is over-engineering what is fundamentally a wiring job.

---

## Common Pitfalls

### Pitfall 1: AchievementModal test file imports break the build

**What goes wrong:** `AchievementModal.test.tsx` imports `AchievementModal` which will be deleted. If the test file is left in place, `vitest` will fail with a module-not-found error.

**Why it happens:** Test files in `src/test/components/` import from components by path. Deleting the component without updating the test causes a broken import.

**How to avoid:** Delete `AchievementModal.test.tsx` together with `AchievementModal.tsx` and `AchievementModal.module.css`. Create `EndOfGameSummaryModal.test.tsx` that covers the behaviors the old tests verified (plus new ELO section behaviors). Do this in the same plan wave — never leave broken imports between commits.

**Warning signs:** `vitest` run after deleting `AchievementModal` fails with `Cannot find module '@/components/AchievementModal/AchievementModal'`.

### Pitfall 2: GameRecords.test.tsx still mocks old AchievementModal behavior

**What goes wrong:** `GameRecords.test.tsx` currently:
- Mocks `triggerAchievements` via `vi.mock('@/api/achievements')`
- Asserts that `AchievementModal` renders conditionally based on `hasAny`
- Checks for `button[name=/continuar/i]` appearing only when `hasAny === true`

After the refactor, `EndOfGameSummaryModal` always opens. All of these assertions will break.

**Why it happens:** The test was written for the old conditional-open behavior. The new behavior is fundamentally different.

**How to avoid:** Rewrite `GameRecords.test.tsx` for the new contract. Key new assertions:
- Modal always renders on mount (no `hasAny` condition)
- `fetchEloChanges` is also mocked and called
- ELO section appears when `fetchEloChanges` resolves
- ELO section is absent when `fetchEloChanges` fails twice
- Records and Logros still render when ELO fails
- "Continuar" button always present (not gated by achievements)

The test must additionally mock `@/api/elo` for `getEloChanges`.

**Warning signs:** Tests pass in isolation but fail after the refactor because stale assertions reference `AchievementModal` or `showAchievementModal`.

### Pitfall 3: ELO section renders before result data is available (position undefined)

**What goes wrong:** `EloSection` needs `result.results` to display position numbers. If `fetchEloChanges` resolves before `getGameResults`, the join fails — `result` is still `null`.

**Why it happens:** Fetches run in parallel. ELO can be fast; results can be slow.

**How to avoid:** `EloSection` receives both `eloChanges` and `result` as props. When either is `null`, show `<Spinner />`. The join (`eloChanges.find(e => e.player_id === r.player_id)`) only runs when both are defined.

```typescript
// EloSection props
interface EloSectionProps {
  eloChanges: EloChangeDTO[] | null
  result: GameResultDTO | null
}

// If either is null → spinner
if (!eloChanges || !result) return <Spinner />
```

### Pitfall 4: CSS class collision between modal sections and GameRecords page

**What goes wrong:** `EndOfGameSummaryModal.module.css` defines `.sectionTitle`, `.rankingList`, `.rankRow` — names that also exist in `GameRecords.module.css`. If a developer accidentally references the wrong module, styles bleed or TypeScript complains.

**Why it happens:** The modal extracts what was inline in `GameRecords`, so natural naming is identical.

**How to avoid:** CSS Modules are automatically scoped — there is no actual bleeding at runtime. The risk is developer confusion, not a bug. Name the modal's classes clearly (e.g., `.eloRow` not `.rankRow`, `.eloList` not `.rankingList`) to make the files distinguishable. The modal's sections should have distinct class names from the page's now-unused classes.

Also: **strip unused CSS classes from `GameRecords.module.css`** after the refactor. Classes `.section`, `.sectionTitle`, `.gameMeta`, `.rankingList`, `.rankRow`, `.firstPlace`, `.position`, `.playerName`, `.points`, `.mc` are currently used for the inline sections that move into the modal. Once those sections move, these classes become dead code. Remove them to avoid confusion — the page only needs `.page`, `.card`, `.header`, `.icon`, `.title`, `.actions`.

**Warning signs:** TypeScript shows no error (CSS Modules are untyped unless using `typed-css-modules`), but a visual review reveals inconsistent spacing in the modal because the wrong base class was applied.

### Pitfall 5: ELO section shown with empty array when fetch technically succeeds

**What goes wrong:** `GET /games/{id}/elo` returns `200 []` if ELO changes haven't been computed yet (e.g., the game was created before ELO was implemented). The section renders with a heading but no rows — looks broken.

**Why it happens:** Backend can return a valid empty array for games without ELO history.

**How to avoid:** In `EloSection`, treat `eloChanges.length === 0` the same as `eloChanges === null` — omit the section entirely (or show a note). Per D-05, ELO "always has data when fetch succeeds" — but this is only guaranteed for new games post-backend-ELO-implementation. The defensive check costs nothing.

**Warning signs:** The ELO section heading "ELO" renders with no rows below it.

---

## Code Examples

### EndOfGameSummaryModal props interface

```typescript
// Source: [VERIFIED: GameRecords.tsx + AchievementModal.tsx + types/index.ts direct reads]
interface EndOfGameSummaryModalProps {
  result: GameResultDTO | null
  records: RecordComparisonDTO[] | null
  loadingRecords: boolean
  notAvailable: boolean
  achievements: AchievementsByPlayerDTO | null
  eloChanges: EloChangeDTO[] | null
  playerNames: Map<string, string>
  onClose: () => void
}
```

### Delta formatting utility

```typescript
// Source: [VERIFIED: CONTEXT.md D-07]
// Inline helper or small utility — no separate file needed (under 5 lines)
function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  if (delta < 0) return `${delta}`
  return '±0'
}
```

### GameRecords.tsx after refactor (shape)

```typescript
// Source: [VERIFIED: GameRecords.tsx + CONTEXT.md D-01, D-03]
// Only state that changes: add eloChanges, change showAchievementModal → showModal = true

const [showModal, setShowModal] = useState(true)   // always true on mount
const [eloChanges, setEloChanges] = useState<EloChangeDTO[] | null>(null)
const { fetchAchievements, fetchEloChanges } = useGames()

useEffect(() => {
  if (!gameId) return
  getGameRecords(gameId).then(setRecords).catch(...).finally(...)
  getGameResults(gameId).then(setResult).finally(...)
  getPlayers().then(setPlayers).catch(() => {})
  fetchAchievements(gameId).then(data => { if (data) setAchievements(data) })
  fetchEloChanges(gameId).then(data => setEloChanges(data))  // null on failure (already handled in hook)
}, [gameId])

// Render: only header + button (+ modal overlay)
return (
  <div className={styles.page}>
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>🏆</span>
        <h1 className={styles.title}>¡Partida guardada!</h1>
      </div>
      <div className={styles.actions}>
        <Button onClick={() => navigate('/home')}>Volver al inicio</Button>
      </div>
    </div>
    {showModal && (
      <EndOfGameSummaryModal
        result={result}
        records={records}
        loadingRecords={loadingRecords}
        notAvailable={notAvailable}
        achievements={achievements}
        eloChanges={eloChanges}
        playerNames={playersMap}
        onClose={() => setShowModal(false)}
      />
    )}
  </div>
)
```

---

## Runtime State Inventory

> Omitted — this is a greenfield component creation + in-place refactor, not a rename/migration phase. No stored data, live service config, OS-registered state, secrets, or build artifacts carry references to `AchievementModal` outside the codebase itself.

---

## Environment Availability

> Step 2.6: No external dependencies beyond the existing frontend toolchain. All tools are already installed and in use.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node / npm | Frontend build | Yes | (project-managed) | — |
| Vitest | Test runner | Yes | ^3.2.4 | — |
| @testing-library/react | Component tests | Yes | ^16.1.0 | — |
| React 18 | Component library | Yes | ^18.3.1 | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `frontend/vite.config.ts` (inline `test` block) |
| Quick run command | `cd frontend && npm test -- --run --reporter=verbose` |
| Full suite command | `cd frontend && npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POST-01 | Modal always opens on GameRecords mount | component | `cd frontend && npm test -- --run --reporter=verbose GameRecords` | ✅ (needs update) |
| POST-01 | Modal contains all 4 sections: Resultados, Records, Logros, ELO | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ❌ Wave 0 |
| POST-01 | Modal does not re-open after close | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ❌ Wave 0 |
| POST-02 | ELO section shows elo_before → elo_after + color-coded delta | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ❌ Wave 0 |
| POST-02 | ELO section omitted silently when fetchEloChanges fails twice | component | `cd frontend && npm test -- --run --reporter=verbose GameRecords` | ✅ (needs update) |
| POST-02 | Records and Logros sections still render when ELO fails | component | `cd frontend && npm test -- --run --reporter=verbose GameRecords` | ✅ (needs update) |
| POST-03 | Position column shows #1, #2, … alongside each ELO row | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ❌ Wave 0 |
| POST-03 | Position is derived from GameResultDTO.results[].position (join by player_id) | component | `cd frontend && npm test -- --run --reporter=verbose EndOfGameSummaryModal` | ❌ Wave 0 |

**Additional hook-level tests:**
| Behavior | Test Type | File |
|----------|-----------|------|
| `fetchEloChanges` returns data on first success (no retry) | unit | `useGames.test.ts` (needs new describe block) |
| `fetchEloChanges` retries once and returns data on second success | unit | `useGames.test.ts` |
| `fetchEloChanges` returns null and warns exactly once when both attempts fail | unit | `useGames.test.ts` |

### Sampling Rate
- **Per task commit:** `cd frontend && npm test -- --run --reporter=verbose`
- **Per wave merge:** `cd frontend && npm test -- --run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/test/components/EndOfGameSummaryModal.test.tsx` — covers POST-01, POST-02, POST-03
- [ ] Update `frontend/src/test/components/GameRecords.test.tsx` — remove `AchievementModal` assertions, add `EndOfGameSummaryModal` + `getEloChanges` mocks
- [ ] Update `frontend/src/test/hooks/useGames.test.ts` — add `fetchEloChanges` describe block (mirrors existing `fetchAchievements` block)
- [ ] Delete `frontend/src/test/components/AchievementModal.test.tsx` — component is deleted

---

## Security Domain

> `security_enforcement` not explicitly set to false in config. Applying minimal security review.

This phase renders data already validated and stored by the backend. No user input is accepted in the modal (read-only display). No new API surface. No new authentication paths.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Protected route already handles auth gate |
| V3 Session Management | No | No session changes |
| V4 Access Control | No | Backend enforces; frontend displays what backend returns |
| V5 Input Validation | No | Modal is display-only; no user input |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via player name in ELO row | Tampering | React JSX escapes all string values automatically — `{player_name}` in JSX is safe |
| XSS via delta value | Tampering | Delta is a number; rendered via `{formatDelta(delta)}` which only interpolates a number — safe |

**No new security concerns introduced by this phase.** [VERIFIED: codebase read — all data displayed is backend-originated, React escapes JSX string interpolations, no `dangerouslySetInnerHTML` usage in any existing component]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `AchievementModal` (conditional, opens only when achievements exist) | `EndOfGameSummaryModal` (always opens, 4 composed sections) | Phase 10 | Modal becomes the canonical post-game summary; GameRecords page becomes a shell |
| `fetchAchievements` as only non-critical fetch in useGames | `fetchEloChanges` added alongside it | Phase 10 | Two non-critical parallel fetches from GameRecords on mount |

**Deprecated/outdated:**
- `AchievementModal` component: deleted in this phase, replaced by `AchievementsSection` inside `EndOfGameSummaryModal`
- Inline Resultados + Records sections in `GameRecords.tsx`: moved into modal, removed from page

---

## Open Questions

1. **Should `loadingResults` be passed to `EndOfGameSummaryModal` or derived from `result === null`?**
   - What we know: `GameRecords.tsx` has both `loadingResults` (boolean) and `result` (null until resolved). Both are available.
   - What's unclear: Whether `ResultsSection` prefers a boolean loading flag or a null check.
   - Recommendation: Use `result === null` as the loading signal inside `ResultsSection` — it's simpler and avoids prop count growth. Remove `loadingResults` from modal props.

2. **Does `RecordsSection` need a `notAvailable` prop in the modal context?**
   - What we know: `RecordsSection` currently accepts `{ records, loading, notAvailable }`. `notAvailable` is set when `getGameRecords` returns 404.
   - What's unclear: Whether a 404 scenario is realistic in the post-game modal (it shouldn't be — the game was just created).
   - Recommendation: Pass `notAvailable` through to be safe — it's already in `GameRecords` state and `RecordsSection`'s interface won't change.

3. **Empty state copy for Logros section in the modal**
   - What we know: CONTEXT.md D-04 says "Ningún logro desbloqueado." and UI-SPEC confirms the same.
   - What's unclear: Whether this applies when `achievements === null` (fetch pending / failed) or only when `achievements.achievements_by_player` has all-empty arrays.
   - Recommendation: Show spinner when `achievements === null`. Show "Ningún logro desbloqueado." when `achievements` is defined but all arrays are empty. This matches D-04/D-05 semantics.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `EloChangeDTO.player_name` is always populated (backend joins player name before responding) | Code Examples | ELO rows would show empty name; use `playersMap.get(player_id)` as fallback |
| A2 | `GameResultDTO.results` order is stable and by position ascending | Pattern 3 | ELO rows would be in random order; sort by `position` client-side as defensive measure |

**All other claims in this research are VERIFIED via direct codebase reads or CITED from CONTEXT.md/UI-SPEC.**

---

## Sources

### Primary (HIGH confidence — direct codebase reads)

- `frontend/src/pages/GameRecords/GameRecords.tsx` — current state machine, fetch pattern, state shape
- `frontend/src/components/AchievementModal/AchievementModal.tsx` — component to be deleted; patterns to migrate
- `frontend/src/components/Modal/Modal.tsx` — base modal API (props: `title`, `onClose`, `children`)
- `frontend/src/hooks/useGames.ts` — `fetchAchievements` retry pattern (lines 83-96); return contract
- `frontend/src/api/elo.ts` — existing `getEloSummary` shape; where `getEloChanges` is added
- `frontend/src/types/index.ts` — `EloChangeDTO` (lines 217-223), `GameResultDTO` (lines 113-117), all DTO shapes
- `frontend/src/index.css` — all design tokens verified: `--color-success`, `--color-error`, `--color-text-muted`, spacing, typography
- `frontend/src/components/Modal/Modal.module.css` — overlay, modal dimensions (480px max-width, 90vh max-height, overflow-y auto)
- `frontend/src/pages/GameRecords/GameRecords.module.css` — `.rankRow` grid pattern (48px 1fr auto auto); `.firstPlace` border color
- `frontend/src/components/AchievementModal/AchievementModal.module.css` — `.playerGroup`, `.badgeList`, `.footer` patterns
- `frontend/src/components/RecordsSection/RecordsSection.tsx` — props interface: `{ records, loading, notAvailable }`
- `backend/routes/games_routes.py:94-100` — `GET /{game_id}/elo` endpoint confirmed
- `frontend/src/test/components/AchievementModal.test.tsx` — test cases to migrate
- `frontend/src/test/components/GameRecords.test.tsx` — test cases to update (mock pattern for `triggerAchievements`)
- `frontend/src/test/hooks/useGames.test.ts` — retry-once test pattern to replicate for `fetchEloChanges`
- `frontend/vite.config.ts` — vitest config: jsdom, setupFiles, exclude e2e

### Secondary (HIGH confidence — planning docs verified against codebase)

- `.planning/phases/10-end-of-game-unified-summary-modal-with-elo-section/10-CONTEXT.md` — all decisions D-01 through D-10
- `.planning/phases/10-end-of-game-unified-summary-modal-with-elo-section/10-UI-SPEC.md` — component inventory, layout contract, ELO row grid, copy contract
- `.planning/research/PITFALLS.md` — Pitfall 2 (end-of-game read-after-write race LOW), Pitfall 1 (no cache discipline)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified via direct file reads; no new dependencies
- Architecture: HIGH — all patterns are direct extrapolations of verified existing code
- Pitfalls: HIGH — grounded in direct codebase reads (tests that will break, CSS class conflicts, fetch ordering)

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (stable domain — all patterns are project-internal, not library-dependent)
