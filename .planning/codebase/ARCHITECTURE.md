# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Layered three-tier architecture with separation between frontend (React SPA) and backend (FastAPI REST API), following clean architecture principles with domain models, services, repositories, and mappers.

**Key Characteristics:**
- Clear separation of concerns: UI layer, API client layer, service layer, repository layer, and domain models
- Frontend-backend communication via REST API with typed request/response objects
- Repository pattern for data access abstraction
- Mapper pattern for translating between DTOs and domain models
- Context-based state management for authentication
- Custom hooks for API interactions

## Layers

**Frontend Application Layer:**
- Purpose: React components that render the UI and handle user interactions
- Location: `frontend/src/pages/*`, `frontend/src/components/*`
- Contains: Page components, reusable UI components, form components
- Depends on: Hooks, Context, API client
- Used by: React router, user browser

**Frontend Data Access Layer:**
- Purpose: Encapsulates API communication and HTTP requests
- Location: `frontend/src/api/*.ts`
- Contains: `client.ts` (base HTTP client), `games.ts`, `players.ts`, `records.ts` (API endpoints)
- Depends on: Vite environment variables for API URL
- Used by: Custom hooks (useGames, usePlayers)

**Frontend State Management Layer:**
- Purpose: Manages authentication state and provides context to components
- Location: `frontend/src/context/AuthContext.tsx`
- Contains: AuthProvider with login/logout/isAuthenticated state
- Depends on: localStorage for session persistence
- Used by: App.tsx (wraps entire router), ProtectedRoute component

**Frontend Logic/Hooks Layer:**
- Purpose: Encapsulates business logic and data fetching for pages
- Location: `frontend/src/hooks/*.ts`
- Contains: useGames, usePlayers hooks with state management and error handling
- Depends on: API client, types
- Used by: Page components

**Backend API Layer:**
- Purpose: Exposes REST endpoints and handles HTTP requests/responses
- Location: `backend/routes/*.py`
- Contains: games_routes.py, players_routes.py, records_routes.py with endpoint definitions
- Depends on: Services, schemas, FastAPI framework
- Used by: Frontend HTTP client

**Backend Service Layer:**
- Purpose: Contains business logic, validation, and orchestration
- Location: `backend/services/*.py`
- Contains: GamesService, PlayerService, GameRecordsService, etc.
- Depends on: Repositories, models, mappers, helpers
- Used by: Routes

**Backend Repository Layer:**
- Purpose: Data access abstraction; translates between ORM and domain models
- Location: `backend/repositories/*.py`
- Contains: GamesRepository, PlayersRepository with query methods
- Depends on: SQLAlchemy ORM, database session
- Used by: Services

**Backend Domain Model Layer:**
- Purpose: Pure business logic objects representing core concepts
- Location: `backend/models/*.py`
- Contains: Game, Player, PlayerResult, PlayerScore, AwardResult, enums
- Depends on: Python standard library
- Used by: Services, repositories, mappers

**Backend Data Transfer Layer:**
- Purpose: Defines request/response shapes for API contracts
- Location: `backend/schemas/*.py`
- Contains: GameDTO, PlayerDTO, GameResultDTO, etc. (Pydantic models)
- Depends on: Pydantic, enums
- Used by: Routes, mappers

**Backend Persistence Layer:**
- Purpose: ORM models and database configuration
- Location: `backend/db/models.py`, `backend/db/session.py`
- Contains: SQLAlchemy declarative models (Player, Game, PlayerResult, Award)
- Depends on: SQLAlchemy, PostgreSQL
- Used by: Repositories

## Data Flow

**Create Game Flow:**

1. Frontend: User fills GameForm (GameForm.tsx component)
2. Frontend: Form component collects state in GameFormState object
3. Frontend: useGames.submitGame() transforms form state → GameDTO
4. Frontend: api.post('/games/', gameDTO) sends HTTP POST request
5. Backend: games_routes.create_game() receives GameDTO from request body
6. Backend: GamesService.create_game(GameDTO) transforms DTO → domain model Game
7. Backend: GamesService validates game (players, corporations, milestones, etc.)
8. Backend: GamesRepository.create(game) persists Game model via ORM
9. Backend: ORM translates domain model to SQL INSERT statements
10. Backend: Response returns GameCreatedResponseDTO with id
11. Frontend: useGames hook receives response.id and returns success
12. Frontend: Navigate to game detail page

**Retrieve Game Results Flow:**

1. Frontend: useGames.fetchRecords(gameId)
2. Frontend: api.get('/games/:gameId/records') sends HTTP GET request
3. Backend: games_routes.get_game_records(game_id)
4. Backend: GameRecordsService queries and transforms records
5. Backend: Returns RecordComparisonDTO[] (list of record entries)
6. Frontend: Hook receives response and stores in component state
7. Frontend: Component renders RecordsSection with record data

**Fetch Game with Results Flow:**

1. Frontend: Page component mounts
2. Frontend: useGames hook triggered or direct api.get('/games/{gameId}/results')
3. Backend: games_routes.get_game_results(game_id)
4. Backend: GamesService.get_game_results(game_id)
5. Backend: Retrieves Game from repository
6. Backend: calculate_results(game) helper computes GameResultDTO with rankings
7. Backend: Returns GameResultDTO with player results sorted by points
8. Frontend: Component receives and displays results

**State Management:**

- Frontend authentication: LocalStorage persists session flag, AuthContext provides isAuthenticated state
- Frontend page/form state: React useState hooks in page components or custom hooks
- Backend state: Stateless; each request is independent
- Database: PostgreSQL is the single source of truth for games, players, results

## Key Abstractions

**Game (Domain Model):**
- Purpose: Core business entity representing a Terraforming Mars game session
- Examples: `backend/models/game.py`
- Pattern: Plain Python class with typed attributes (game_id, date, map_name, expansions, draft, generations, player_results, awards)

**GameDTO (Data Transfer Object):**
- Purpose: API contract for game data in requests/responses
- Examples: `backend/schemas/game.py`
- Pattern: Pydantic model defining JSON serializable structure

**Repository (Repository Pattern):**
- Purpose: Encapsulate data access and provide domain-centric interface
- Examples: `backend/repositories/game_repository.py`, `backend/repositories/player_repository.py`
- Pattern: Class with methods for CRUD operations; translates ORM ↔ domain models internally

**Mapper (Mapper Pattern):**
- Purpose: Transform between different representations (ORM ↔ domain, domain ↔ DTO)
- Examples: `backend/mappers/game_mapper.py`, `backend/mappers/player_result_mapper.py`
- Pattern: Functions with dto_to_model and model_to_dto naming convention

**Service (Service Pattern):**
- Purpose: Orchestrate business logic across repositories and models
- Examples: `backend/services/game_service.py`, `backend/services/game_records_service.py`
- Pattern: Class receiving dependencies (repositories) in __init__, public methods for use cases

**Enums (Domain Language):**
- Purpose: Type-safe representation of fixed value sets (MapName, Expansion, Corporation, Milestone, Award)
- Examples: `backend/models/enums.py`, `frontend/src/constants/enums.ts`
- Pattern: Python Enum on backend, TypeScript enum on frontend; values synchronized exactly

## Entry Points

**Frontend Entry:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser loads application
- Responsibilities: Render root React component into DOM, initialize StrictMode

**Frontend App Router:**
- Location: `frontend/src/App.tsx`
- Triggers: After React mounts
- Responsibilities: Define all routes, wrap with AuthProvider, apply ProtectedRoute guards

**Backend Entry:**
- Location: `backend/main.py`
- Triggers: Server startup (uvicorn or entrypoint.sh)
- Responsibilities: Create FastAPI app, register CORS middleware, include route routers (games, players, records)

**Database Session:**
- Location: `backend/db/session.py`
- Triggers: Each service request needs database access
- Responsibilities: Create and return SQLAlchemy sessions via SessionLocal factory

## Error Handling

**Strategy:** Exceptions bubble up with meaningful error messages; route layer catches and converts to HTTP status codes.

**Patterns:**

- **Frontend:** ApiError class (client.ts) wraps HTTP errors with status code and message; hooks catch and return null or error state
- **Backend Routes:** Try/except blocks catch ValueError (validation) and raise HTTPException(400 or 404)
- **Backend Services:** Raise ValueError for business logic violations; let exceptions propagate to routes
- **Database:** SQLAlchemy errors propagate unless explicitly caught; not currently wrapped
- **Validation:** GamesService._validate_* methods raise ValueError with descriptive messages (e.g., "A game must have between 2 and 5 players")

## Cross-Cutting Concerns

**Logging:** Not yet implemented; consider adding structured logging in services and routes for debugging

**Validation:**
- Frontend: Validation utilities in `frontend/src/utils/validation.ts` validate form state before submission
- Backend: Service layer validates business rules (game dates, player counts, duplicate corporations)

**Authentication:**
- Frontend: Mock-based (username/password in memory, no backend auth yet)
- Backend: No authentication enforced; CORS allows frontend URL
- Future: Add JWT tokens or session-based auth in backend routes

**Type Safety:**
- Frontend: TypeScript with strict typing for components, hooks, and API contracts
- Backend: Python with type hints on function signatures and class attributes

---

*Architecture analysis: 2026-03-19*
