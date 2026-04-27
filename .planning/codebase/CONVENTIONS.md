# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- PascalCase for React components: `Input.tsx`, `Button.tsx`, `Home.tsx`
- camelCase for utility/hook files: `gameCalculations.ts`, `validation.ts`, `formatDate.ts`
- camelCase for context files: `AuthContext.tsx`
- PascalCase for page components: `GameForm.tsx`, `Players.tsx`, `Login.tsx`
- CSS Modules: `ComponentName.module.css`
- Constants file: `enums.ts`, `gameRules.ts`, `auth.ts`

**Functions:**
- camelCase for all function names: `calcMilestonePoints()`, `validateStepGameSetup()`, `useAuth()`
- useXxx pattern for custom hooks: `useAuth()`, `useGames()`, `usePlayers()`
- Descriptive names based on responsibility: `validateStepPlayerSelection()`, `syncPlayersFromSelection()`

**Variables:**
- camelCase for all variables and constants within functions
- UPPER_SNAKE_CASE for module-level constants: `SESSION_KEY`, `MILESTONE_POINTS`, `MAX_PLAYERS`
- Descriptive naming reflecting data type/purpose: `isAuthenticated`, `errorText`, `selectedPlayerIds`

**Types:**
- PascalCase for all interface and type names: `InputProps`, `ButtonProps`, `AuthContextValue`, `GameFormState`
- Descriptive names indicating purpose: `PlayerFormData`, `AwardEntry`, `MilestoneEntry`, `PlayerScoreDTO`
- DTO suffix for data transfer objects: `PlayerResponseDTO`, `GameDTO`, `RecordComparisonDTO`

## Code Style

**Formatting:**
- TypeScript with strict mode enabled (`strict: true`)
- No explicit linting config (ESLint/Prettier) detected - relies on TypeScript strict checking
- Consistent spacing and indentation (2 spaces, inferred from file samples)

**Linting:**
- TypeScript strict mode enforces:
  - `noUnusedLocals: true` - prevents unused variables
  - `noUnusedParameters: true` - prevents unused parameters
  - `noFallthroughCasesInSwitch: true` - switch statement safety
  - `noUncheckedSideEffectImports: true` - prevents unsafe imports

**File Structure:**
- Imports at top, organized by source
- Exports at end or inline with declaration
- Type definitions before implementation

## Import Organization

**Order:**
1. React and third-party libraries: `import { useState } from 'react'`
2. Router/navigation: `import { Link, useNavigate } from 'react-router-dom'`
3. Context/providers: `import { AuthProvider } from '@/context/AuthContext'`
4. Components: `import Button from '@/components/Button/Button'`
5. Hooks: `import { useAuth } from '@/context/AuthContext'`
6. Utilities: `import { calcMilestonePoints } from '@/utils/gameCalculations'`
7. Constants: `import { Expansion, type Milestone } from '@/constants/enums'`
8. Types: `import type { GameFormState } from '@/pages/GameForm/GameForm.types'`
9. Styles: `import styles from './Component.module.css'`

**Path Aliases:**
- `@/` resolves to `src/` (configured in `vite.config.ts`)
- Used consistently throughout for cleaner imports
- Example: `import Button from '@/components/Button/Button'`

## Error Handling

**Patterns:**
- Validation functions return array of error strings: `validateStepGameSetup()` → `string[]`
- Errors accumulated and checked before proceeding: `if (errors.length > 0) { /* show errors */ }`
- Context usage throws on invalid state: `throw new Error('useAuth must be used within AuthProvider')` in `AuthContext.tsx`
- Error state in components: `const [error, setError] = useState<string>('')`

**Example pattern from `AuthContext.tsx`:**
```typescript
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

## Logging

**Framework:** `console` (no dedicated logging library)

**Patterns:**
- Minimal logging - business logic and utilities do not log
- Validation errors are passed as data structures to UI, not logged
- No console.log in production code observed

## Comments

**When to Comment:**
- JSDoc for exported functions with non-obvious behavior
- Inline comments sparse - code is self-documenting through clear naming
- Section comments for logical grouping (e.g., `// ── Step 1: Game setup ──` in E2E tests)

**JSDoc/TSDoc:**
- Not extensively used in source files
- Types are TypeScript-enforced, documentation less critical
- Comments in E2E tests document test purpose: `/**\n * E2E: Full flow test\n */`

## Function Design

**Size:**
- Target under 20 lines per function (project directive in CLAUDE.md)
- Validation functions: 10-15 lines with early returns
- Component functions: 30-50 lines including JSX
- Utility functions: 5-10 lines for calculations

**Parameters:**
- Use object parameter destructuring for functions with multiple params:
  ```typescript
  export function calcRunningTotal(scores: PartialScores): number
  ```
- React component props use interface extension:
  ```typescript
  interface InputProps extends InputHTMLAttributes<HTMLInputElement>
  ```

**Return Values:**
- Validation functions return error arrays or void
- Calculation functions return primitives or objects
- Hooks return object or array from context
- Components return JSX.Element
- Explicit return types for all exported functions

## Module Design

**Exports:**
- One main export per file (typically the component/function)
- Default export for components: `export default function Button(...)`
- Named exports for utility functions: `export function calcMilestonePoints(...)`
- Type exports with `export type` or `export interface`

**Barrel Files:**
- Not used - imports use full paths to source: `import Button from '@/components/Button/Button'`
- Each component in dedicated directory with colocated styles
- Central types collected in `@/types/index.ts` for DTOs

## CSS Class Naming

**Pattern:**
- CSS Modules with `.module.css` suffix: `Button.module.css`
- camelCase class names: `.wrapper`, `.label`, `.input`, `.errorText`
- Semantic naming reflecting purpose: `.required`, `.error`, `.errorText`, `.disabled`

**CSS Variables (Design Tokens):**
- Defined in `src/index.css`:
  - Colors: `--color-primary`, `--color-error`, `--color-text`
  - Spacing: `--spacing-xs` through `--spacing-2xl`
  - Typography: `--font-size-*`, `--font-weight-*`
  - Shadows and borders: `--shadow-md`, `--border-radius`
  - Transitions: `--transition: 0.2s ease`
- Used throughout component styles for consistency

## Type Usage

**Approach:**
- Strict TypeScript with inference where possible
- Explicit types for:
  - Function parameters and return types
  - React component props interfaces
  - DTOs and API responses
  - State in useState hooks

**Example:**
```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
}
```

## Async/Await Patterns

**Not prevalent:**
- E2E tests use Playwright async patterns
- API calls likely in hooks (not examined in detail)
- Validation is synchronous

---

*Convention analysis: 2026-03-19*
