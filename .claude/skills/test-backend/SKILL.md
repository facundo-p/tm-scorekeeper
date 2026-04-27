---
name: test-backend
description: Run backend pytest safely inside Docker (never on host — protects dev database)
allowed-tools: Bash
argument-hint: [optional: test path or -k filter]
---

# Run Backend Tests (Docker)

Run backend tests safely using `docker-compose.test.yml`. NEVER run pytest directly on the host machine — it uses the dev database and will wipe data.

## Execution

### No arguments — run all tests:

```bash
make test-backend
```

This runs:
1. `docker compose -f docker-compose.test.yml down` (clean state)
2. `docker compose -f docker-compose.test.yml run --rm --build backend_test` (migrations + pytest)
3. `docker compose -f docker-compose.test.yml down` (cleanup)

### With arguments — run specific tests:

If `$ARGUMENTS` is provided, run filtered tests:

```bash
docker compose -f docker-compose.test.yml down && \
docker compose -f docker-compose.test.yml run --rm --build backend_test sh -c "alembic upgrade head && python -m pytest $ARGUMENTS -q" && \
docker compose -f docker-compose.test.yml down
```

Examples:
- `/test-backend tests/test_player_service.py` — run one file
- `/test-backend -k test_create` — run by name pattern
- `/test-backend tests/ -v` — verbose output
- `/test-backend tests/ --tb=short` — short tracebacks

## CRITICAL SAFETY RULE

**NEVER** run any of these on the host:
- `pytest`
- `python -m pytest`
- Any direct test invocation outside Docker

The host's `DATABASE_URL` points to the dev database. Running pytest there **will delete all game data**.

## On failure

1. Show the failing test output
2. Identify the root cause
3. If it's a test environment issue (DB connection, migration), suggest rebuilding: `docker compose -f docker-compose.test.yml down -v` then retry
4. If it's a code issue, fix and re-run
