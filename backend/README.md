# Backend

This folder contains the FastAPI application and logic.  Most of the work happens here.

## Database

The app expects a PostgreSQL instance configured via the `DATABASE_URL` environment
variable.  When running locally we recommend using the Docker compose file at the
project root:

```bash
# start the database container
docker compose up -d

# point the app/tests to it (the default value is shown below)
# Mac
export DATABASE_URL="postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper"
# Windows
$env:DATABASE_URL="postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper"
```

The `session.py` module will fall back to the above URL if `DATABASE_URL` is not set.

To stop and wipe data:

```bash
docker compose down -v
```

## Tests

Los tests **borran todas las tablas** de la base a la que apunten, así que
`backend/tests/conftest.py` aborta con código 2 si el nombre de la base de
`DATABASE_URL` no termina en `_test`. Solo PostgreSQL (los modelos usan `ARRAY` y enums nativos).

- Con Docker: `make test-backend` (levanta `docker-compose.test.yml` con `tm_scorekeeper_test`).
- Sin Docker (por ejemplo en el entorno cloud): `bash scripts/dev/bootstrap.sh` y después

```bash
DATABASE_URL=postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper_test \
  backend/.venv/bin/python -m pytest backend/tests -q
```

Dependencias: `requirements.txt` (producción) y `requirements-dev.txt` (tests).
Gates completos: `bash scripts/dev/gates.sh backend`.
