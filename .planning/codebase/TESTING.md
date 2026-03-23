# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vite.config.ts` (test section)

**Assertion Library:**
- Vitest built-in expect assertions
- Testing Library for React component testing (@testing-library/react)
- Playwright for E2E testing (@playwright/test)

**Run Commands:**
```bash
npm run test              # Run all unit and component tests (Vitest)
npm run test:ui          # Watch mode with UI dashboard
npm run test:e2e         # Run Playwright E2E tests
```

## Test File Organization

**Location:**
- Co-located in `src/test/` directory structure mirroring source
- Unit tests: `src/test/unit/`
- Component tests: `src/test/components/`
- E2E tests: `src/test/e2e/`
- Shared setup: `src/test/setup.ts`

**Naming:**
- `*.test.ts` for unit tests
- `*.test.tsx` for component tests
- `*.spec.ts` for E2E tests (Playwright convention)

**Structure:**
```
src/test/
├── setup.ts                      # Global test setup, localStorage mock
├── unit/
│   ├── gameCalculations.test.ts
│   ├── gameRules.test.ts
│   ├── validation.test.ts
│   └── enums.test.ts
├── components/
│   ├── StepMilestones.test.tsx
│   ├── StepAwards.test.tsx
│   └── Login.test.tsx
└── e2e/
    └── full-flow.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe('calcMilestonePoints', () => {
  it('returns 0 for no milestones', () => {
    expect(calcMilestonePoints([])).toBe(0)
  })

  it('returns 5 per milestone', () => {
    expect(calcMilestonePoints([Milestone.TERRAFORMER])).toBe(5)
  })
})
```

**Patterns:**

**Setup:**
- `beforeEach()` for test isolation (example from Login tests):
  ```typescript
  beforeEach(() => {
    localStorage.clear()
  })
  ```
- Shared test data factories (example from validation tests):
  ```typescript
  const makePlayer = (id: string, corp: Corporation | ''): PlayerFormData => ({
    player_id: id,
    name: id,
    corporation: corp,
    terraform_rating: 20,
    card_resource_points: 0,
    card_points: 0,
    greenery_points: 0,
    city_points: 0,
    turmoil_points: null,
  })
  ```

**Teardown:**
- Implicit - Jest/Vitest cleans up between tests
- localStorage explicitly cleared in component tests when needed

**Assertion Pattern:**
- Direct `.toBe()`, `.toHaveLength()`, `.toBeVisible()` assertions
- Array predicates: `.some((e) => e.includes(...))` for finding error messages
- Presence checks: `.not.toBeInTheDocument()`

## Mocking

**Framework:** Vitest mocks (not extensively used in current tests)

**localStorage Mock:**
Located in `src/test/setup.ts`:
```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })
```

**What to Mock:**
- localStorage (already mocked globally)
- API responses in component tests (done via test data setup)
- Provider wrappers for context (MemoryRouter, AuthProvider)

**What NOT to Mock:**
- Pure calculation functions (tested directly)
- Validation functions (tested with real data)
- Date/time functions (used as-is)

## Fixtures and Factories

**Test Data:**

Example factory pattern from `validation.test.ts`:
```typescript
const makePlayer = (id: string, corp: Corporation | ''): PlayerFormData => ({
  player_id: id,
  name: id,
  corporation: corp,
  terraform_rating: 20,
  card_resource_points: 0,
  card_points: 0,
  greenery_points: 0,
  city_points: 0,
  turmoil_points: null,
})

// Usage
const players = [makePlayer('p1', Corporation.CREDICOR), makePlayer('p2', Corporation.ECOLINE)]
```

Award fixture from `gameCalculations.test.ts`:
```typescript
const awards: AwardResultDTO[] = [
  { name: Award.CULTIVATOR, opened_by: 'p1', first_place: ['p1'], second_place: ['p2'] },
  { name: Award.MAGNATE, opened_by: 'p2', first_place: ['p2', 'p3'], second_place: [] },
]
```

**Location:**
- Inline in test files (no shared fixtures directory)
- Factories defined at top of test file for reuse across multiple test suites

## Coverage

**Requirements:** Not enforced (no coverage config detected)

**View Coverage:**
```bash
npm run test -- --coverage
```
*(Command not explicitly configured, but Vitest supports it)*

## Test Types

**Unit Tests:**
- Pure function testing with various inputs
- Scope: Business logic, calculations, validation
- Approach: Arrange-Act-Assert with direct function calls
- Example: `gameCalculations.test.ts` - testing point calculation functions

**Component Tests:**
- React Testing Library for user-centric testing
- Scope: Component rendering, user interaction, state changes
- Approach: Render component, simulate user events, assert UI state
- Example from `StepMilestones.test.tsx`:
  ```typescript
  it('can claim a milestone', () => {
    const onChange = (patch: Partial<GameFormState>) => {
      expect(patch.milestones).toBeDefined()
      const claimed = patch.milestones!.find((m) => m.milestone === Milestone.TERRAFORMER)
      expect(claimed?.claimed).toBe(true)
    }
    render(<StepMilestones state={stateWithTharsis} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('checkbox')[0])
  })
  ```

**E2E Tests:**
- Playwright for full workflow testing
- Scope: Login flow, navigation, game form wizard, form validation
- Approach: Browser automation with page interactions
- Config: `playwright.config.ts`
- Requires: Backend running on `localhost:8000`, frontend on `localhost:5173`

## Common Patterns

**Unit Test Pattern:**
```typescript
describe('functionName', () => {
  it('describes specific behavior', () => {
    // Arrange
    const input = [...data...]

    // Act
    const result = functionUnderTest(input)

    // Assert
    expect(result).toEqual(expectedValue)
  })
})
```

**Component Test Pattern - Props Callback:**
```typescript
it('calls onChange with updated state', () => {
  const onChange = (patch: Partial<GameFormState>) => {
    expect(patch.field).toEqual(expectedValue)
  }
  render(<Component state={state} onChange={onChange} />)
  fireEvent.click(screen.getByText(/action/i))
})
```

**Component Test Pattern - Rendering:**
```typescript
const renderLogin = () => {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    </AuthProvider>,
  )
}

it('renders fields', () => {
  renderLogin()
  expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument()
})
```

**E2E Test Pattern:**
```typescript
test('user flow description', async ({ page, request }) => {
  // Setup: Create test data via API
  await request.post('/api/players/', { data: { name: testName } })

  // Navigation
  await page.goto('/login')
  await page.fill('input[type="text"]', 'admin')

  // Assertions
  await expect(page).toHaveURL('/home')
  await expect(page.getByText('Title')).toBeVisible()
})
```

**Error Testing Pattern:**
From `validation.test.ts`:
```typescript
it('requires date', () => {
  const errors = validateStepGameSetup({ date: '', map: MapName.THARSIS, generations: 12 })
  expect(errors.some((e) => e.includes('fecha'))).toBe(true)
})
```

## Test Environment Configuration

**Vitest Config (in `vite.config.ts`):**
```typescript
test: {
  globals: true,              // describe, it, expect available globally
  environment: 'jsdom',       // DOM environment for React
  setupFiles: ['./src/test/setup.ts'],  // Global test setup
  exclude: ['**/node_modules/**', '**/e2e/**'],  // Exclude E2E from unit tests
}
```

**Playwright Config (in `playwright.config.ts`):**
```typescript
testDir: './src/test/e2e'      // E2E test location
fullyParallel: false           // Run tests sequentially
workers: 1                      // Single worker
baseURL: 'http://localhost:5173'
webServer: {
  command: 'npm run dev',       // Auto-start dev server
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI
}
```

## Test Data and Seeding

**E2E Test Data Creation:**
- Created via API calls before test runs
- Timestamp-based naming to avoid conflicts:
  ```typescript
  const ts = Date.now()
  const p1Name = `E2E EC1 ${ts}`
  ```
- localStorage cleared between tests:
  ```typescript
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
  })
  ```

---

*Testing analysis: 2026-03-19*
