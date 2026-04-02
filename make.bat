@echo off
if "%1"=="dev"           docker compose up --build
if "%1"=="down"          docker compose down
if "%1"=="migrate"       docker compose exec backend alembic upgrade head
if "%1"=="logs"          docker compose logs -f
if "%1"=="test-backend"  (docker compose -f docker-compose.test.yml down && docker compose -f docker-compose.test.yml run --rm --build backend_test && docker compose -f docker-compose.test.yml down)
if "%1"=="test-frontend" docker compose exec frontend npm test -- --run
if "%1"=="typechecks"    docker compose exec frontend npm run typecheck
