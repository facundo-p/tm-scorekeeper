.PHONY: dev down migrate logs test-backend test-frontend typechecks

dev:
	docker compose up --build

down:
	docker compose down

migrate:
	docker compose exec backend alembic upgrade head

logs:
	docker compose logs -f

test-backend:
	docker compose -f docker-compose.test.yml down
	docker compose -f docker-compose.test.yml run --rm --build backend_test
	docker compose -f docker-compose.test.yml down

test-frontend:
	docker compose exec frontend npm test -- --run

typechecks:
	docker compose exec frontend npm run typecheck
