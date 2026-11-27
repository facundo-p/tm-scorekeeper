---
phase: 11
plan: 04
type: execute
wave: 3
depends_on: [11-02]
files_modified:
  - frontend/src/components/RankingFilters/RankingFilters.tsx
  - frontend/src/components/RankingFilters/RankingFilters.module.css
  - frontend/src/test/components/RankingFilters.test.tsx
autonomous: true
requirements: [RANK-03, RANK-04]
must_haves:
  truths:
    - "Component composes existing MultiSelect (player picker) + native <input type='date'> (Desde) + Button 'Limpiar filtros'"
    - "Player toggle in MultiSelect calls onPlayersChange with the new array"
    - "Date input change calls onFromDateChange with the raw 'YYYY-MM-DD' string OR null when cleared (NEVER wraps in new Date)"
    - "Limpiar filtros button calls onClear"
    - "Mobile-first CSS Module styling, all colors via design tokens, 36px+ touch targets, no inline styling"
  artifacts:
    - path: "frontend/src/components/RankingFilters/RankingFilters.tsx"
      provides: "Presentational composer for ranking filters"
      exports: ["default RankingFilters", "RankingFiltersProps"]
    - path: "frontend/src/components/RankingFilters/RankingFilters.module.css"
      provides: "Mobile-first styles using design tokens; no hardcoded colors"
      contains: "var(--color"
    - path: "frontend/src/test/components/RankingFilters.test.tsx"
      provides: "Component tests covering MultiSelect interaction, date handler, clear button"
      contains: "describe('RankingFilters"
  key_links:
    - from: "frontend/src/components/RankingFilters/RankingFilters.tsx"
      to: "frontend/src/components/MultiSelect/MultiSelect.tsx"
      via: "composition (rendered child)"
      pattern: "import MultiSelect from '@/components/MultiSelect/MultiSelect'"
    - from: "frontend/src/components/RankingFilters/RankingFilters.tsx"
      to: "frontend/src/components/Button/Button.tsx"
      via: "composition (Limpiar filtros)"
      pattern: "import Button from '@/components/Button/Button'"
    - from: "Date input onChange"
      to: "onFromDateChange prop"
      via: "opaque YYYY-MM-DD string passthrough; '' → null"
      pattern: "e\\.target\\.value === ''"
---

<objective>
Build `<RankingFilters>` — the single component that composes `MultiSelect` (player picker) + a native `<input type="date">` (Desde) + a `<Button variant="ghost">Limpiar filtros</Button>` reset. Pure presentational, props-only (D-A1). The component does NOT own URL state — it just wires user events back to the parent via three named callbacks.

Why a dedicated plan: the component is the smallest extractable unit between the hook (Plan 03) and the page (Plan 05). Splitting it from the page lets Plan 05 stay focused on fetch/filter pipeline. The component test is also the primary place to verify the date handler does NOT wrap values in `new Date()` (Pitfall F regression guard).

Closes the presentational layer for RANK-03 (player MultiSelect rendered) and RANK-04 (date input rendered, opaque-string passthrough).

Purpose: Provide Plan 05 a stable child component with separate-handler API matching CONTEXT D-A1.

Output: 3 files (component + CSS + test), all tests green.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-RESEARCH.md
@.planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md
@frontend/src/components/MultiSelect/MultiSelect.tsx
@frontend/src/components/MultiSelect/MultiSelect.module.css
@frontend/src/components/Button/Button.tsx
@frontend/src/components/EloSummaryCard/EloSummaryCard.tsx
@frontend/src/pages/GamesList/GamesList.tsx
@frontend/src/pages/GamesList/GamesList.module.css
@frontend/src/test/components/EloSummaryCard.test.tsx
@frontend/src/index.css

<interfaces>
<!-- Existing components consumed by RankingFilters. Locked contracts. -->

`MultiSelect` (verified at `src/components/MultiSelect/MultiSelect.tsx:1-14`):
```typescript
export interface MultiSelectOption { value: string; label: string }
interface MultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}
export default function MultiSelect({ label, options, value, onChange, error }: MultiSelectProps): JSX.Element
```

`Button` (verified at `src/components/Button/Button.tsx`):
```typescript
// Variants in use across project: 'primary' | 'secondary' | 'ghost' | 'danger'
// Size in use: 'sm' | 'md' | 'lg' (default md)
<Button variant="ghost" onClick={...}>Limpiar filtros</Button>
```

Native `<input type="date">` semantics (RESEARCH §"Pitfall F" line 519): `event.target.value` is `''` when cleared, `'YYYY-MM-DD'` otherwise. NEVER wrap.

Public component contract this plan ships:
```typescript
export interface RankingFiltersProps {
  players: string[]                            // resolved selection (controlled)
  fromDate: string | null                      // controlled
  activePlayersOptions: MultiSelectOption[]    // [{ value: player_id, label: name }, ...]
  onPlayersChange: (next: string[]) => void
  onFromDateChange: (next: string | null) => void
  onClear: () => void
}
export default function RankingFilters(props: RankingFiltersProps): JSX.Element
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Write component test FIRST (RED), then implement RankingFilters.tsx + .module.css (GREEN)</name>
  <files>
    frontend/src/test/components/RankingFilters.test.tsx
    frontend/src/components/RankingFilters/RankingFilters.tsx
    frontend/src/components/RankingFilters/RankingFilters.module.css
  </files>
  <read_first>
    - frontend/src/components/MultiSelect/MultiSelect.tsx (composition target — verify the prop shape exactly)
    - frontend/src/components/MultiSelect/MultiSelect.module.css (token-usage analog for the new CSS module)
    - frontend/src/components/Button/Button.tsx (verify `variant="ghost"` exists)
    - frontend/src/components/EloSummaryCard/EloSummaryCard.tsx (props-only-card analog for the .tsx file shape)
    - frontend/src/test/components/EloSummaryCard.test.tsx (component test idiom — render, screen, getByText/Role, fireEvent)
    - frontend/src/pages/GamesList/GamesList.tsx (lines 73-75, 96-134 — date input pattern + clear button precedent)
    - frontend/src/pages/GamesList/GamesList.module.css (lines 35-50 — date input styling tokens)
    - frontend/src/index.css (verify tokens: --color-text-muted, --color-border, --color-surface, --color-text, --spacing-*, --font-size-sm, --border-radius)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-PATTERNS.md (§`src/components/RankingFilters/RankingFilters.tsx` lines 223-299, §`.module.css` lines 302-348, §test lines 352-381)
    - .planning/phases/11-ranking-page-skeleton-filters-url-state/11-CONTEXT.md (D-A1 prop contract)
  </read_first>
  <behavior>
    Test cases (RED first):

    Module: `RankingFilters` (rendered with controlled props, no router needed)

    1. **Renders MultiSelect with provided options + value:**
       - Pass `activePlayersOptions = [{ value: 'p1', label: 'Alice' }, { value: 'p2', label: 'Bob' }]`, `players = ['p1']`
       - Assert: `screen.getByText('Alice')` is in the document; the option for 'Alice' is visually marked as selected (rely on whatever marker MultiSelect uses — read MultiSelect.tsx to confirm; commonly a leading `✓ ` or selected-class — assert by `getByRole` or `getByText('✓ Alice')`)

    2. **MultiSelect change propagates via onPlayersChange:**
       - With players=['p1'], options=[p1, p2], `onPlayersChange = vi.fn()`
       - `fireEvent.click(screen.getByText(/Bob/))` — toggling p2 ON
       - Assert: `onPlayersChange` called once with `['p1', 'p2']` (or whatever order MultiSelect emits — assert array contents, not order)

    3. **Date input renders with `value` reflecting `fromDate` prop:**
       - Pass `fromDate = '2026-01-15'` → `screen.getByLabelText(/desde/i)` (or `getByRole('textbox')` if MultiSelect labels conflict — prefer `getByLabelText`) has `value === '2026-01-15'`
       - Pass `fromDate = null` → input has `value === ''`

    4. **Date change → onFromDateChange with raw string:**
       - `fireEvent.change(input, { target: { value: '2026-03-01' } })`
       - Assert: `onFromDateChange` called once with `'2026-03-01'` (literal string, NOT a Date object)

    5. **Date clear → onFromDateChange with null:**
       - `fireEvent.change(input, { target: { value: '' } })`
       - Assert: `onFromDateChange` called once with `null` (Pitfall F: empty input maps to null, not empty string, so the page can serialize "no from" cleanly)

    6. **Limpiar filtros button → onClear:**
       - Find by accessible name: `screen.getByRole('button', { name: /limpiar filtros/i })`
       - `fireEvent.click(button)`
       - Assert: `onClear` called once

    7. **No-inline-style regression guard:**
       - The rendered DOM has zero elements with a `style` attribute (assert via `container.querySelectorAll('[style]').length === 0`).

    8. **Source-file no-`new Date` regression guard (acceptance criteria, not a runtime test):**
       - `! grep "new Date" frontend/src/components/RankingFilters/RankingFilters.tsx`
  </behavior>
  <action>
    **STEP A — RED:** Create `frontend/src/test/components/RankingFilters.test.tsx`. Use the idiom from `EloSummaryCard.test.tsx` (no router needed — the component is purely presentational). Imports:

    ```typescript
    import { describe, it, expect, vi } from 'vitest'
    import { render, screen, fireEvent } from '@testing-library/react'
    import RankingFilters from '@/components/RankingFilters/RankingFilters'
    import type { MultiSelectOption } from '@/components/MultiSelect/MultiSelect'
    ```

    Define the 8 tests above inside one `describe('RankingFilters', ...)`. Run vitest — all RED.

    **STEP B — GREEN:** Create `frontend/src/components/RankingFilters/RankingFilters.tsx`. Match PATTERNS.md §`src/components/RankingFilters/RankingFilters.tsx` (lines 223-299) — destructured props, default export, separate-handler API per CONTEXT D-A1.

    File body:

    ```typescript
    import type React from 'react'
    import MultiSelect, { type MultiSelectOption } from '@/components/MultiSelect/MultiSelect'
    import Button from '@/components/Button/Button'
    import styles from './RankingFilters.module.css'

    export interface RankingFiltersProps {
      players: string[]
      fromDate: string | null
      activePlayersOptions: MultiSelectOption[]
      onPlayersChange: (next: string[]) => void
      onFromDateChange: (next: string | null) => void
      onClear: () => void
    }

    export default function RankingFilters({
      players,
      fromDate,
      activePlayersOptions,
      onPlayersChange,
      onFromDateChange,
      onClear,
    }: RankingFiltersProps) {
      const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // CRITICAL: pass through as opaque string. '' → null. NEVER new Date().
        onFromDateChange(e.target.value === '' ? null : e.target.value)
      }

      return (
        <div className={styles.wrapper}>
          <MultiSelect
            label="Jugadores"
            options={activePlayersOptions}
            value={players}
            onChange={onPlayersChange}
          />
          <label className={styles.dateField}>
            <span className={styles.dateLabel}>Desde</span>
            <input
              type="date"
              className={styles.dateInput}
              value={fromDate ?? ''}
              onChange={handleFromChange}
            />
          </label>
          <Button variant="ghost" onClick={onClear}>Limpiar filtros</Button>
        </div>
      )
    }
    ```

    Component body must be ≤20 LOC excluding props destructuring (CLAUDE.md §3). The `handleFromChange` helper is 3 LOC. Keep it inline; do not extract.

    **STEP C — GREEN (CSS):** Create `frontend/src/components/RankingFilters/RankingFilters.module.css`. Match PATTERNS.md §`.module.css` token usage (lines 302-348). Mobile-first, design tokens only:

    ```css
    .wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
    }

    .dateField {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .dateLabel {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }

    .dateInput {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      color: var(--color-text);
      padding: var(--spacing-sm);
      font-size: var(--font-size-base);
      min-height: 36px;
      width: 100%;
    }
    ```

    No hardcoded colors. No hardcoded spacing pixels. No inline styles. 36px touch target on the date input.

    Run `npx vitest run src/test/components/RankingFilters.test.tsx` — all 8 tests must pass.

    Implements RANK-03 (player MultiSelect rendered) and RANK-04 (native date input with opaque-string passthrough).
  </action>
  <verify>
    <automated>cd frontend &amp;&amp; npx vitest run src/test/components/RankingFilters.test.tsx --reporter=basic 2>&amp;1 | tail -30</automated>
  </verify>
  <acceptance_criteria>
    - File `frontend/src/components/RankingFilters/RankingFilters.tsx` exists; `grep -c "^export default function RankingFilters" frontend/src/components/RankingFilters/RankingFilters.tsx` == 1
    - `! grep "new Date" frontend/src/components/RankingFilters/RankingFilters.tsx` (Pitfall F)
    - `! grep " style=" frontend/src/components/RankingFilters/RankingFilters.tsx` (no inline JSX style attribute — CLAUDE.md Frontend Rules)
    - File `frontend/src/components/RankingFilters/RankingFilters.module.css` exists; `grep -c "var(--" frontend/src/components/RankingFilters/RankingFilters.module.css` >= 8 (heavy token reuse)
    - `! grep -E "#[0-9a-fA-F]{3,6}" frontend/src/components/RankingFilters/RankingFilters.module.css` (no hardcoded hex colors)
    - File `frontend/src/test/components/RankingFilters.test.tsx` exists; `grep -c "^  it(" frontend/src/test/components/RankingFilters.test.tsx` >= 7
    - `npx vitest run src/test/components/RankingFilters.test.tsx` exits 0 with all tests green
    - `npx tsc --noEmit` from `frontend/` exits 0
    - Component body (the function exported as default) is ≤20 LOC measured from the line after the destructured `}: RankingFiltersProps) {` to the closing `}` of the function
  </acceptance_criteria>
  <done>
    Component renders MultiSelect + date input + Limpiar filtros button. All 7+ tests green. CSS uses tokens only, no hardcoded colors, mobile-first. Plan 05 can import `RankingFilters` against the locked prop contract.
  </done>
</task>

</tasks>

<verification>
- 7+ component tests green
- `npx tsc --noEmit` from `frontend/` exits 0
- Source has zero `new Date(` and zero ` style=` attributes
- CSS has ≥8 `var(--` references and zero hex literals
</verification>

<success_criteria>
- `<RankingFilters>` exported as default with `RankingFiltersProps` interface matching CONTEXT D-A1 verbatim
- Date handler maps `''` → `null` so the page serializer can drop the key cleanly
- All UI primitives reused (`MultiSelect`, `Button`) — no re-implementation
- Plan 05 unblocked
</success_criteria>

<output>
After completion, create `.planning/phases/11-ranking-page-skeleton-filters-url-state/11-04-SUMMARY.md` documenting:
- Component prop signature (paste verbatim)
- File LOC counts (component body ≤20, CSS file)
- Test count + green confirmation
- Confirmation: zero `new Date(`, zero ` style=`, zero hex literals in CSS
</output>
