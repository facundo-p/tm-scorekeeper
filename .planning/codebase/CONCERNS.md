# Codebase Concerns

**Analysis Date:** 2026-03-19

## Security Issues

**Hardcoded Mock Credentials:**
- Issue: Mock username and password are hardcoded directly in source code and committed to repository
- Files: `frontend/src/constants/auth.ts` (lines 1-2)
- Impact: Credentials exposed in git history and codebase; if this application grows, these will be easy to discover and could serve as a starting point for unauthorized access
- Fix approach: Move credentials to environment variables (even for mock auth), use proper authentication provider for production, never commit secrets

**CORS Configuration Open to All Methods:**
- Issue: Backend allows all HTTP methods and headers via wildcard CORS configuration
- Files: `backend/main.py` (lines 12-18)
- Impact: No protection against CORS-based attacks; frontend can be bypassed from any origin; potential for CSRF attacks if credentials are added
- Fix approach: Explicitly whitelist allowed methods (`GET`, `POST`, `PUT`, `DELETE`), restrict headers to necessary ones only, validate origin against expected frontend URL

**Database Credentials in Session Code:**
- Issue: Default PostgreSQL credentials are visible in code comment
- Files: `backend/db/session.py` (line 9)
- Impact: Development credentials exposed; if this code is used as template for production, credentials may be accidentally committed
- Fix approach: Remove default credentials entirely, require DATABASE_URL env var to be set, document required format separately

**Silent Error Swallowing in Frontend:**
- Issue: Multiple places catch errors and silently return null or generic messages without logging
- Files: `frontend/src/hooks/useGames.ts` (lines 77-79), `frontend/src/api/client.ts` (lines 26-27)
- Impact: Errors in production are invisible; hard to debug issues in the field; API failures go unnoticed
- Fix approach: Implement proper error logging/monitoring, log errors before swallowing, provide developer-friendly error context

## Tech Debt

**Duplicated Method in PlayerRepository:**
- Issue: The `get()` method is defined twice (lines 33-42 and 62-71)
- Files: `backend/repositories/player_repository.py`
- Impact: Code duplication; confusing which version is used; maintenance nightmare if one needs updating
- Fix approach: Remove one instance immediately, consolidate into single method

**Brittle GameForm Component - String-based Step Labels:**
- Issue: Step navigation logic duplicates step labels as strings in switch statement, creating tight coupling
- Files: `frontend/src/pages/GameForm/GameForm.tsx` (lines 125-146)
- Impact: Adding/removing steps requires changes in multiple places; easy to make mistakes; labels can fall out of sync with `steps` array definition
- Fix approach: Use step index to render components from a configuration object, not string matching

**Mixed Validation Responsibility:**
- Issue: Validation logic split between frontend (`validation.ts`) and backend (`game_service.py`), with partial overlap
- Files: `frontend/src/utils/validation.ts` vs `backend/services/game_service.py`
- Impact: Inconsistencies between client and server validation; business rules enforced in two places makes them hard to maintain; frontend validation can be bypassed
- Fix approach: Move all business rule validation to backend only, use frontend validation only for UX (required fields, field formatting)

**Hardcoded Score Field Steps:**
- Issue: Game form has hardcoded sequential score entry steps (Cartas-R, Cartas, Vegetación, Ciudades, Turmoil)
- Files: `frontend/src/pages/GameForm/GameForm.tsx` (lines 39-44)
- Impact: If scoring system changes, form steps are brittle; expansion logic for Turmoil is scattered; hard to add new score types
- Fix approach: Extract step definitions to configuration, make dynamic based on expansion selection

**Manual Result Calculation in Multiple Places:**
- Issue: Total points calculation is done both in frontend (`GameForm.tsx` summary) and backend (`results.py`)
- Files: `frontend/src/pages/GameForm/GameForm.tsx` (lines 103-123), `backend/services/helpers/results.py` (lines 6-17)
- Impact: Calculations can drift between client preview and actual results; DRY violation; harder to change scoring logic
- Fix approach: Implement result calculation only in backend, fetch computed results from API for display

## Missing Error Handling

**API Request Errors Without Context:**
- Issue: API client catches and rethrows errors with generic message, losing original error details
- Files: `frontend/src/hooks/useGames.ts` (line 66)
- Impact: Stack traces lost; hard to debug API failures; user sees generic message even for specific errors
- Fix approach: Store full error details in state, expose them to error reporting system, provide more specific user messages

**No Validation Error Differentiation:**
- Issue: Backend throws all validation errors as `ValueError` with HTTP 400, no error code or type field
- Files: `backend/routes/games_routes.py` (lines 30-31)
- Impact: Frontend cannot distinguish between different validation failures; hard to provide targeted error messages
- Fix approach: Create custom exception types for different validation scenarios, return structured error responses with error codes

**Repository Methods Throw KeyError Instead of Specific Exception:**
- Issue: Repository uses Python's built-in `KeyError` for "not found" cases
- Files: `backend/repositories/player_repository.py` (lines 37, 48, 66)
- Impact: Generic exception hard to catch; unclear to callers what exception to expect; inconsistent with ValueError used elsewhere
- Fix approach: Create custom `PlayerNotFound` exception, handle specifically in routes

## Performance Concerns

**No Pagination on Game Lists:**
- Issue: `list_games()` endpoint returns all games without pagination
- Files: `backend/routes/games_routes.py` (lines 35-38), `backend/services/game_service.py` (lines 160-162)
- Impact: As game count grows, loading all games becomes slow; frontend loads entire history every time; no limits on data transfer
- Fix approach: Add limit/offset pagination parameters, implement cursor-based pagination for large datasets, add default limit

**N+1 Query Risk in Game Repository:**
- Issue: Game repository fetches game, then iterates through player_results relationships, potentially triggering separate queries
- Files: `backend/repositories/game_repository.py` (lines 31-51)
- Impact: For each game fetched, N queries may be triggered (one per player result); with many games and players, performance degrades
- Fix approach: Use SQLAlchemy eager loading (joinedload), verify with query counting in tests

**Frontend Refetches Player List on Every Game Form Render:**
- Issue: `usePlayers()` hook always calls `fetchPlayers()` in useEffect on component mount
- Files: `frontend/src/hooks/usePlayers.ts` (lines 27-28), `frontend/src/pages/GameForm/GameForm.tsx` (line 67)
- Impact: Unnecessary network requests every time form is rendered; if form is re-mounted, re-fetches all players
- Fix approach: Add caching, implement stale-while-revalidate pattern, or move player fetching to parent component with memoization

## Fragile Areas

**AuthContext with Minimal Security:**
- Issue: Authentication is mock-based with hardcoded credentials and localStorage flag
- Files: `frontend/src/context/AuthContext.tsx`
- Impact: Not production-ready; localStorage is vulnerable to XSS; no token refresh; no server-side session validation
- Workaround: For development, keep as is; must replace before production deployment
- Safe modification: Add comments marking this as development-only, create feature branch for real auth implementation
- Test coverage: Login tests exist but only for mock auth scenario

**Game Service Validation Methods - 15+ Private Validators:**
- Issue: `GamesService` has 15+ private validation methods (`_validate_*`), each throwing ValueError with slightly different messages
- Files: `backend/services/game_service.py` (lines 20-156)
- Impact: Hard to maintain; each validation rule is separate method; difficult to test in isolation; error messages not consistent
- Safe modification: Can add validators without breaking existing ones; refactoring should collect errors and return list instead of throwing
- Test coverage: Only `test_game_service.py` tests this; partial coverage of validation rules

**GameForm State Management - Complex Nested Structure:**
- Issue: `GameFormState` holds nested arrays of objects with complex relationships
- Files: `frontend/src/pages/GameForm/GameForm.tsx`, `frontend/src/pages/GameForm/GameForm.types.ts`
- Impact: State mutations harder to reason about; easy to create inconsistent state; refactoring increases risk of bugs
- Safe modification: Add validation helpers that verify state consistency before operations, use immutable patterns
- Test coverage: Form component has limited tests; mostly integration testing via e2e

**Database Migrations Manual Approach:**
- Issue: Alembic migrations exist but enum handling requires manual helpers file
- Files: `backend/db/migrations/helpers.py`, multiple migration files with enum updates
- Impact: Enum changes require careful migration logic; easy to create mismatches; future changes may not follow same pattern
- Safe modification: Must follow existing migration pattern for new enums; test migrations with real database
- Test coverage: No automated tests for migrations; must verify manually against test database

## Test Coverage Gaps

**Untested API Error Cases:**
- What's not tested: HTTP error responses for 400, 404, 500 cases
- Files: `backend/routes/games_routes.py` (all endpoints)
- Risk: Error paths not validated; changes to error handling may break client-side error display logic
- Priority: High

**Missing Frontend Integration Tests:**
- What's not tested: Form submission flow from start to finish; state transitions through all steps
- Files: `frontend/src/pages/GameForm/GameForm.tsx` (complex logic)
- Risk: Refactoring form logic or state management could break user flows without being caught
- Priority: High

**Incomplete Validation Test Coverage:**
- What's not tested: Edge cases in validation (boundary values, empty arrays, null values)
- Files: `frontend/src/utils/validation.ts` (72 lines with many branches)
- Risk: Validation rules may have holes; frontend may accept data backend rejects or vice versa
- Priority: Medium

**No Tests for Player Repository Duplicate Method:**
- What's not tested: Both versions of `get()` method are untested for differentiation
- Files: `backend/repositories/player_repository.py`
- Risk: Hidden bug; unclear which method is used; wrong method could be called unexpectedly
- Priority: Medium

**Missing Error Logging Tests:**
- What's not tested: Error logging and monitoring integration
- Files: Frontend error handling throughout, backend exception flows
- Risk: Production errors may not be logged; hard to debug issues
- Priority: Medium

## Dependencies at Risk

**No Explicit Version Pinning in Backend:**
- Risk: `requirements.txt` uses `>=` constraints only; `fastapi>=0.112.0` could pull major versions with breaking changes
- Impact: Deployment inconsistency; local version may differ from production; reproducibility issues
- Migration plan: Migrate to `pip-tools` or `Poetry` with pinned versions, use constraint files for flexibility

**Outdated or Unspecified Python Version:**
- Risk: No `.python-version` file; unclear if Python 3.9 (from venv folder) is enforced
- Impact: Team members may use different Python versions; potential compatibility issues
- Migration plan: Create `.python-version` file with `3.9`, use `pyenv` for enforcement, document in README

## Known Issues

**Game Result Calculation Comment Suggests Workaround:**
- Symptoms: Line 79 in `results.py` uses `getattr(game, "id", "")` with defensive fallback
- Files: `backend/services/helpers/results.py` (line 79)
- Trigger: Occurs when game object doesn't have `id` attribute set
- Root cause: Unclear; suggests either model is missing id or repository doesn't set it
- Workaround: Fallback to empty string (masks issue)
- Fix: Verify Game model always has id before returning; add assertion or explicit check

## Missing Critical Features

**No Undo/Rollback for Game Creation:**
- Problem: Once a game is created and recorded, there's no way to correct data entry errors
- Blocks: Users cannot fix mistakes after clicking confirm; quality of statistics depends on data accuracy
- Workaround: Delete and re-enter game (if user remembers all data), use admin endpoint
- Impact: Data quality risk; users frustrated by irreversible decisions

---

*Concerns audit: 2026-03-19*
