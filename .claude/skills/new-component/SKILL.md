---
name: new-component
description: Scaffold a React component with TypeScript, CSS Module, and test file following project conventions
argument-hint: [ComponentName]
---

# New React Component Scaffold

Generate a complete React component for `$ARGUMENTS`.

## Pre-flight

1. Ask the user for:
   - **Component name** (if not provided): PascalCase (e.g. `PlayerCard`)
   - **Location**: `ui/<grupo>/` (reusable: `atoms`, `sheet`, `states`, `instruments`…) or `screens/<Pantalla>/` (a piece of one screen)
   - **Props**: name and type for each prop
   - **State needs**: what local state it manages
   - **Behavior**: what it does on interaction

2. Confirm the plan before generating.

## Files to generate

### 1. Component — `frontend/src/{location}/{Name}/{Name}.tsx`

```
- Functional component with hooks
- Interface `{Name}Props` extending native HTML props if applicable
- Variant/size union types for styling when relevant
- CSS Modules import: `import styles from './{Name}.module.css'`, keys are the mockup's BEM names (`styles['btn--primary']`, D-44)
- className composition: `cx()` from `@/ui/cx`
- Pure logic (formatting, sorting, derived values) goes in the screen's `model.ts`, not in the component
- Error/loading states via useState
- Async handlers with try/catch/finally pattern
- Spread remaining props on root element
```

Reference patterns:
- Reusable component: `frontend/src/ui/atoms/Button.tsx`
- Screen piece: `frontend/src/screens/Games/GameRow.tsx` (data from `@/data/hooks`, logic in `model.ts`)

### 2. CSS Module — `frontend/src/{location}/{Name}/{Name}.module.css`

```
- Mobile-first styles
- Use CSS variables from the project's design system
- No inline styles (project rule)
- Semantic class names matching component structure
- Use flexbox/grid for layout
- Responsive breakpoints if needed
```

Reference: `frontend/src/ui/atoms/Button.module.css` (port the rules from the mockup's CSS, `docs/redesign/mockup/css/`)

### 3. Test — `frontend/src/test/ui/{Name}.test.tsx` or `frontend/src/test/screens/{Pantalla}.test.tsx`

```
- Vitest + React Testing Library
- `renderComponent()` helper wrapping providers (MemoryRouter, AuthProvider) as needed
- `beforeEach` for state cleanup
- Query by role/label (accessibility-first)
- Test: renders correctly, handles user interaction, shows errors, loading states
```

Reference: `frontend/src/test/screens/Login.test.tsx`; pure logic in `frontend/src/test/screens/<pantalla>Model.test.ts`

## Conventions

- Export default for the component
- Named exports for sub-components if any
- Props interface defined above the component
- `useState` for local state, custom hooks for data fetching
- Error pattern: `err instanceof Error ? err.message : 'Error'`
- Loading pattern: `disabled={loading}` on interactive elements
- No emojis unless explicitly requested
- Spanish for user-facing text (this is a Spanish-language app)
