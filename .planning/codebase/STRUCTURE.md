# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
tm-scorekeeper/
├── frontend/                    # React SPA - TypeScript + Vite
│   ├── src/
│   │   ├── api/                 # API client functions
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React context (auth)
│   │   ├── constants/           # Constants (enums, auth)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Page components
│   │   ├── test/                # Test fixtures and setup
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx              # Root router component
│   │   ├── main.tsx             # React DOM entry point
│   │   └── index.css            # Global styles
│   ├── vite.config.ts           # Vite build config, API proxy
│   ├── tsconfig.json            # TypeScript config
│   ├── package.json             # Dependencies (React, Router, Vite, Vitest, Playwright)
│   └── playwright.config.ts     # E2E test config
├── backend/                     # FastAPI REST API - Python
│   ├── models/                  # Domain models (Game, Player, etc.)
│   ├── schemas/                 # Pydantic DTOs for API contracts
│   ├── repositories/            # Data access layer (GamesRepository, PlayersRepository)
│   ├── services/                # Business logic layer
│   │   └── helpers/             # Helper functions for services
│   ├── mappers/                 # DTO ↔ domain model transformations
│   ├── routes/                  # API endpoint definitions
│   ├── db/                      # Database models and session config
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── session.py           # Database connection config
│   │   └── migrations/          # Alembic database migrations
│   ├── tests/                   # Test suites (integration, e2e)
│   ├── scripts/                 # Utility scripts
│   ├── main.py                  # FastAPI app entry point
│   ├── conftest.py              # Pytest fixtures
│   ├── requirements.txt         # Python dependencies
│   ├── alembic.ini              # Alembic migration config
│   └── entrypoint.sh            # Docker entrypoint
├── docs/                        # Documentation files
├── .planning/                   # GSD planning documents (this location)
├── .claude/                     # Claude project instructions (CLAUDE.md)
└── .github/                     # GitHub workflows/config
```

## Directory Purposes

**frontend/src/api/:**
- Purpose: Centralized HTTP client and API endpoint functions
- Contains: `client.ts` (base HTTP client with fetch wrapper), `games.ts`, `players.ts`, `records.ts` (endpoint-specific functions)
- Key files: `client.ts` (defines api object with get/post/patch/put/delete methods)

**frontend/src/components/:**
- Purpose: Reusable, single-responsibility UI components
- Contains: Button, Input, Select, Modal, MultiSelect, Spinner, and domain-specific components (RecordsSection, PlayerScoreSummary, RecordStandingCard, etc.)
- Key files: Each component is a subdirectory with .tsx file and optional .module.css

**frontend/src/context/:**
- Purpose: React context providers for cross-cutting state (authentication)
- Contains: AuthContext.tsx with AuthProvider and useAuth hook
- Key files: `AuthContext.tsx` (single provider for auth state)

**frontend/src/constants/:**
- Purpose: Application-wide constants and enums
- Contains: `enums.ts` (MapName, Expansion, Milestone, Award, Corporation), `auth.ts` (MOCK_USERNAME, MOCK_PASSWORD)
- Key files: `enums.ts` (must match backend enums exactly)

**frontend/src/hooks/:**
- Purpose: Custom React hooks for API interactions and business logic
- Contains: `useGames.ts` (game submission, records fetching), `usePlayers.ts` (player operations)
- Key files: `useGames.ts` (handles form state transformation and game creation)

**frontend/src/pages/:**
- Purpose: Full page components (routes)
- Contains: Home, Login, Players, PlayerProfile, GameForm, GamesList, GameDetail, GameRecords, Records
- Key files: `GameForm/GameForm.tsx` (multi-step form with validation)

**frontend/src/test/:**
- Purpose: Shared test infrastructure and fixtures
- Contains: `setup.ts` (vitest setup), `unit/`, `components/`, `e2e/` (playwright tests)
- Key files: `setup.ts` (initializes testing library)

**frontend/src/types/:**
- Purpose: TypeScript type definitions for domain objects
- Contains: `index.ts` (GameDTO, PlayerDTO, RecordComparisonDTO, GameResultDTO, etc.)
- Key files: `index.ts` (all types centralized)

**frontend/src/utils/:**
- Purpose: Helper functions (not React-specific)
- Contains: `gameCalculations.ts` (calcMilestonePoints, calcAwardPoints), `validation.ts` (form validation functions), `formatDate.ts`
- Key files: `validation.ts` (step-by-step form validation), `gameCalculations.ts` (scoring logic)

**backend/models/:**
- Purpose: Domain model classes representing core business concepts
- Contains: Game, Player, PlayerResult, PlayerScore, AwardResult, RecordEntry, RecordComparison, enums
- Key files: `game.py`, `player.py`, `enums.py` (MapName, Expansion, Corporation, Milestone, Award)

**backend/schemas/:**
- Purpose: Pydantic models defining API request/response contracts
- Contains: GameDTO, PlayerDTO, GameResultDTO, PlayerProfileDTO, RecordsDTO, etc.
- Key files: `game.py` (GameDTO for create/list), `result.py` (GameResultDTO for rankings)

**backend/repositories/:**
- Purpose: Data access layer abstracting SQLAlchemy ORM
- Contains: GamesRepository, PlayersRepository with methods for querying and persisting
- Key files: `game_repository.py` (CRUD for games), `player_repository.py` (CRUD for players), `container.py` (dependency injection)

**backend/services/:**
- Purpose: Business logic orchestration and validation
- Contains: GamesService, PlayerService, GameRecordsService, PlayerRecordsService, PlayerProfileService
- Key files: `game_service.py` (validates and creates games), `game_records_service.py` (compares player records)

**backend/services/helpers/:**
- Purpose: Pure utility functions used by services
- Contains: `results.py` (calculate_results function), `records.py`
- Key files: `results.py` (computes GameResultDTO with rankings and tiebreaker logic)

**backend/mappers/:**
- Purpose: Transform between representations (ORM ↔ domain, domain ↔ DTO)
- Contains: game_mapper, player_result_mapper, player_score_mapper, award_mapper, etc.
- Key files: `game_mapper.py` (game_dto_to_model, game_model_to_dto)

**backend/routes/:**
- Purpose: FastAPI endpoint definitions
- Contains: games_routes, players_routes, records_routes
- Key files: `games_routes.py` (POST /games, GET /games, GET /games/:id/results, GET /games/:id/records)

**backend/db/:**
- Purpose: Database configuration and ORM models
- Contains: SQLAlchemy ORM models (Player, Game, PlayerResult, Award), session factory, migrations
- Key files: `models.py` (ORM table definitions), `session.py` (PostgreSQL connection setup)

**backend/tests/:**
- Purpose: Test suites
- Contains: `integration/` (tests requiring database), `e2e/` (end-to-end tests)
- Key files: `conftest.py` (shared fixtures), individual test_*.py files

## Key File Locations

**Entry Points:**

- `frontend/src/main.tsx`: Renders React app to DOM, wraps with StrictMode
- `frontend/src/App.tsx`: Defines all routes, wraps with AuthProvider and ProtectedRoute
- `backend/main.py`: Creates FastAPI app, registers CORS, includes routers

**Configuration:**

- `frontend/vite.config.ts`: Vite build config with '@' alias to src/, API proxy to /api, test config
- `frontend/tsconfig.json`: References tsconfig.app.json and tsconfig.node.json
- `backend/db/session.py`: PostgreSQL connection string from DATABASE_URL env var
- `backend/alembic.ini`: Database migration tool config

**Core Logic:**

- `frontend/src/hooks/useGames.ts`: Game submission and form state transformation
- `backend/services/game_service.py`: Game validation and business rules (2-5 players, unique corporations, etc.)
- `backend/services/helpers/results.py`: Ranking calculation with tiebreaker logic
- `frontend/src/utils/gameCalculations.ts`: Milestone and award point calculations
- `frontend/src/utils/validation.ts`: Step-by-step form validation for GameForm

**Testing:**

- `frontend/src/test/setup.ts`: Vitest + testing-library configuration
- `backend/conftest.py`: Pytest fixtures for database and models
- `frontend/playwright.config.ts`: E2E test configuration

## Naming Conventions

**Files:**

- Components: PascalCase in subdirectories with index file (e.g., `Button/Button.tsx`)
- Pages: PascalCase in pages/ subdirectories (e.g., `GameForm/GameForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useGames.ts`, `usePlayers.ts`)
- Utilities: camelCase (e.g., `gameCalculations.ts`, `formatDate.ts`)
- API functions: camelCase export functions (e.g., `createGame`, `listGames`)
- Services: PascalCase with `Service` suffix (e.g., `GamesService`, `PlayerService`)
- Repositories: PascalCase with `Repository` suffix (e.g., `GamesRepository`, `PlayersRepository`)
- Mappers: Named with `_to_` pattern (e.g., `game_dto_to_model`, `game_model_to_dto`)
- Routes files: snake_case with `_routes` suffix (e.g., `games_routes.py`)

**Directories:**

- Feature directories: kebab-case or PascalCase depending on context
- Backend subdirs: lowercase plural (models, services, repositories, schemas, routes)
- Frontend subdirs: lowercase plural (components, hooks, pages, utils)

## Where to Add New Code

**New Feature:**
- Primary code: Create feature-specific directory in `backend/services/` and corresponding route in `backend/routes/`
- DTO: Add Pydantic model to `backend/schemas/`
- Domain model: Add class to `backend/models/` if introducing new entity
- Tests: Create integration test in `backend/tests/integration/`
- Frontend: Create page component in `frontend/src/pages/`, hook in `frontend/src/hooks/`, API functions in `frontend/src/api/`

**New Component/Module:**
- UI Component: Create `frontend/src/components/ComponentName/` directory with ComponentName.tsx and ComponentName.module.css
- Page: Create `frontend/src/pages/PageName/` directory with PageName.tsx and optional sub-components
- Service: Create file in `backend/services/service_name.py` with dependency injection via __init__
- Repository: Add methods to existing `backend/repositories/game_repository.py` or `backend/repositories/player_repository.py`

**Utilities:**
- Frontend: Add to `frontend/src/utils/` (e.g., `utils/newCalculation.ts`)
- Backend: Add to `backend/services/helpers/` for pure functions, or as service methods for orchestration
- Shared helpers: Frontend has `gameCalculations.ts` and `validation.ts`; backend has `helpers/results.py` and `helpers/records.py`

**Tests:**
- Frontend unit/component: `frontend/src/test/unit/` or `frontend/src/test/components/`
- Frontend E2E: `frontend/src/test/e2e/`
- Backend integration: `backend/tests/integration/`
- Backend E2E: `backend/tests/e2e/`

## Special Directories

**frontend/dist/:**
- Purpose: Built artifacts from vite build
- Generated: Yes (built by vite build)
- Committed: No (.gitignore)

**frontend/.vite/:**
- Purpose: Vite development cache
- Generated: Yes
- Committed: No

**backend/db/migrations/versions/:**
- Purpose: Alembic-generated database migration files
- Generated: Yes (via alembic revision)
- Committed: Yes (tracked for reproducibility)

**backend/.pytest_cache/, frontend/node_modules/, venv/, .venv/:**
- Purpose: Build/dependency artifacts
- Generated: Yes
- Committed: No

**backend/__pycache__/, **/__pycache__/:**
- Purpose: Python bytecode cache
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-03-19*
