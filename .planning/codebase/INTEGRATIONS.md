# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**None currently integrated.** The application does not depend on external APIs (Stripe, SendGrid, etc.). All functionality is self-contained within the application.

## Data Storage

**Databases:**
- PostgreSQL 15
  - Connection: `DATABASE_URL` environment variable
  - Format: `postgresql://tm_user:tm_pass@host:5432/tm_scorekeeper`
  - Client: SQLAlchemy 1.4+ with psycopg2-binary adapter
  - Dev Docker Compose: `postgres:15` service at `localhost:5432`
  - Prod: Supabase (inferred from docs) - connection string set manually in Render dashboard

**File Storage:**
- Local filesystem only - No cloud storage integration (S3, GCS, etc.)

**Caching:**
- None - No Redis or memcached integration

## Authentication & Identity

**Auth Provider:**
- Custom implementation (mock credentials)
  - Implementation: Local storage-based authentication with hardcoded credentials
  - Location: `frontend/src/context/AuthContext.tsx`
  - Credentials: Stored in `frontend/src/constants/auth` (mock username/password)
  - Note: Not a real OAuth/JWT implementation - suitable for development/hobby project only

## Frontend-Backend Communication

**API Client:**
- Custom fetch-based HTTP client at `frontend/src/api/client.ts`
  - Methods: GET, POST, PATCH, PUT, DELETE
  - Error handling: Custom `ApiError` class for HTTP errors
  - Base URL resolution:
    - Dev: `/api` (proxied by Vite to `http://localhost:8000`)
    - Prod: `VITE_API_URL` environment variable or `/api`
  - Content-Type: `application/json`

**CORS Configuration:**
- FastAPI middleware at `backend/main.py` line 12-18
  - Allow origins: `FRONTEND_URL` environment variable (dev: `http://localhost:5173`)
  - Allow methods: All (`*`)
  - Allow headers: All (`*`)
  - Allow credentials: True

## API Routes

**Backend endpoints** at `backend/routes/`:
- Games: `backend/routes/games_routes.py`
  - POST `/games` - Create new game
  - GET `/games` - List games with filters
  - GET `/games/{gameId}` - Get game details and results
  - GET `/games/{gameId}/records` - Get records for a specific game

- Players: `backend/routes/players_routes.py`
  - GET `/players` - List all players
  - POST `/players` - Create new player
  - GET `/players/{playerId}/profile` - Get player statistics and profile
  - PATCH `/players/{playerId}` - Update player information

- Records: `backend/routes/records_routes.py`
  - GET `/records` - Get global game records across all players

## Monitoring & Observability

**Error Tracking:**
- None - No Sentry, DataDog, or similar integration

**Logs:**
- Console output to stdout/stderr (captured by Docker/deployment platform)
- No centralized logging service

**Health Checks:**
- Database health check in Docker Compose: PostgreSQL readiness check (`pg_isready`)

## CI/CD & Deployment

**Hosting:**
- Backend: Render.com (ASGI Python application)
  - Runtime: Python 3.12
  - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Configuration: `render.yaml` at project root

- Frontend: Vercel (assumed from env var naming and docs reference)
  - Deployment target: Static site build output from Vite

**CI Pipeline:**
- GitHub Actions (`.github/workflows/deploy.yml`)
  - Trigger: Push to `main` or PR to `main`/`staging`
  - Jobs:
    1. `test-backend` - Runs pytest on PostgreSQL 15 (localhost:5432)
    2. `test-frontend` - Runs TypeScript type check and Vitest
    3. `migrate-and-deploy` - Runs Alembic migrations and triggers Render deploy hook (main branch only)
  - Database for tests: PostgreSQL 15 via GitHub Actions service

**Deployment Flow:**
1. Code pushed to `main`
2. GitHub Actions runs tests and migrations
3. Render deploy hook triggered via `secrets.RENDER_DEPLOY_HOOK`
4. Render redeploys backend with new code

## Environment Configuration

**Development:**
- Docker Compose manages all services and environment variables
- `.env` file for local overrides (not committed)
- `.env.example` shows structure and defaults

**Required env vars (Development):**
- `DATABASE_URL` - PostgreSQL connection string (default in docker-compose.yml)
- `FRONTEND_URL` - Frontend origin for CORS (default: `http://localhost:5173`)
- `BACKEND_URL` - Backend URL for Vite proxy (Docker Compose: `http://backend:8000`)

**Required env vars (Production - Render):**
- `DATABASE_URL` - Set manually in Render dashboard (Supabase connection string)
- `FRONTEND_URL` - Set manually in Render dashboard (Vercel frontend URL)
- `PYTHON_VERSION` - Python 3.12.0 (set in `render.yaml`)

**Secrets location:**
- GitHub Actions: `secrets.DATABASE_URL` and `secrets.RENDER_DEPLOY_HOOK`
- Render dashboard: Manual configuration (not synced from source)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- Render deploy hook (triggered by GitHub Actions on successful merge to main)

---

*Integration audit: 2026-03-19*
