.PHONY: dev down migrate logs test-backend test-frontend

dev:
	docker compose up --build

down:
	docker compose down

migrate:
	docker compose exec backend alembic upgrade head

logs:
	docker compose logs -f

test-backend:
	docker compose exec backend python -m pytest tests -q

test-frontend:
	docker compose exec frontend npm test -- --run
