.PHONY: dev down migrate logs test-backend test-frontend typechecks restore-prod

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

restore-prod:
ifndef FILE
	@echo "Usage: make restore-prod FILE=/path/to/backup.sql.gz"
	@echo "Download the latest backup from Cloudflare R2 (bucket: tm-scorekeeper-backups)."
	@exit 1
endif
	@test -f "$(FILE)" || { echo "ERROR: file not found: $(FILE)"; exit 1; }
	@gunzip -t "$(FILE)" 2>/dev/null || { echo "ERROR: not a valid gzip file: $(FILE)"; exit 1; }
	@gunzip -c "$(FILE)" | head -5 | grep -q "PostgreSQL database dump" || { echo "ERROR: file does not look like pg_dump output: $(FILE)"; exit 1; }
	@printf "This will WIPE your local DB and restore from:\n  $(FILE)\nContinue? [y/N] "; read ans; [ "$$ans" = "y" ] || { echo "Aborted."; exit 1; }
	docker compose down -v
	docker compose up -d db
	@echo "Waiting for db to be healthy..."
	@until docker exec tm-scorekeeper-db-1 pg_isready -U tm_user -d tm_scorekeeper >/dev/null 2>&1; do sleep 1; done
	docker exec tm-scorekeeper-db-1 psql -U tm_user -d tm_scorekeeper -v ON_ERROR_STOP=1 -c "DROP SCHEMA IF EXISTS public CASCADE;"
	gunzip -c "$(FILE)" | docker exec -i tm-scorekeeper-db-1 psql -U tm_user -d tm_scorekeeper -v ON_ERROR_STOP=1
	docker compose up -d
	@echo "Restore complete. Stack running at http://localhost:5173"
