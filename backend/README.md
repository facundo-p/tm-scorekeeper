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

## Autenticación

Un solo usuario del grupo (D-03). `POST /auth/login` con `{"username", "password"}` devuelve un JWT
(`access_token`, 30 días por defecto) que se manda como `Authorization: Bearer <token>`. Públicos:
`/health` y `/auth/login`; todo lo demás responde 401 sin token. Cinco fallos seguidos desde una IP
la bloquean 30 s (429); la IP sale de la derecha de `X-Forwarded-For` según `TRUSTED_PROXY_HOPS` (D-54). En el primer despliegue conviene comprobar que dos clientes distintos no comparten el bloqueo (un login fallido desde cada uno): si Render agregara más de una entrada, todos caerían en la misma IP y habría que subir `TRUSTED_PROXY_HOPS`.

El recálculo administrativo es `POST /admin/recompute` con token y header `X-Admin-Secret`; el viejo `GET /elo/admin/recompute?secret=` ya no existe.

Variables: `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` (`python -m scripts.hash_password`), `AUTH_SECRET`
y opcional `AUTH_TOKEN_TTL_DAYS`; ver `.env.example`. Sin ellas el login responde 503 (fail-closed).
En los tests `require_auth` se reemplaza por un usuario fijo; los de login usan el fixture `real_auth`.

## Transacciones y orden

Crear, editar o borrar una partida y recalcular el ELO ocurren en una sola transacción
(`db/uow.py::unit_of_work`) con `pg_advisory_xact_lock`, así que dos escrituras simultáneas
quedan en serie. Los repositorios usan la sesión de la unidad de trabajo activa si existe; si
no, confirman solos. El orden canónico de las partidas es (fecha, `created_at`, id) en todo el
backend (`services/helpers/order.py`). Ganadores: todos los de la posición 1 (`winners()`);
`tied` vale `true` para todo el grupo empatado.

## Cambios de contrato en v2.0

- Fase 20: toda la API salvo `/health` y `/auth/login` exige `Authorization: Bearer`; `GET /elo/admin/recompute` pasó a `POST /admin/recompute`.
- Fase 21: `tied` vale `true` para todo el grupo empatado; partidas o jugadores inexistentes responden 404 también en `/games/{id}/records`, `/games/{id}/elo`, `POST /games/{id}/achievements` y `/players/{id}/achievements` (antes, 200 con datos vacíos); el hito Spacecrafter se llama Spacefarer (la entrada acepta los dos).
- Fase 22: `GET /records` devuelve los 16 récords oficiales y acepta el subconjunto `?player_count=2..5&map=&expansion=` (fuera de rango → 422). Cada ítem conserva `code`, `title`, `description`, `emoji` y `record` (primer poseedor y fecha, para el frontend previo) y suma `scope`, `unit`, `lower_is_better`, `value`, `holders` (todos los poseedores) e `history` (`set`/`broken`/`tied`, D-05 y D-18). Nuevo `GET /records/{code}/history` (404 si el código no existe). `RecordResultDTO.value` puede ser decimal (`points_per_generation`).
- Fase 23: los logros se derivan del historial (D-04): son 18, se recalculan en cada alta, edición o borrado de partida dentro de la misma transacción, después del ELO, y un nivel puede perderse. `POST /games/{id}/achievements` ya no evalúa: devuelve, siempre igual, lo que esa partida desbloqueó. `GET /players/{id}/achievements` y `GET /achievements/catalog` aceptan `?player_count=2..5` (vista «mesa», nunca se guarda) y suman `view`, `kind`, `glyph`, `flavor`, `value` y `unlocks` (nivel, fecha y partida). El progreso aparece en todo logro que no sea de un solo nivel (`flag`). `POST /admin/recompute` recalcula ELO y logros. La tabla `player_achievements` se reemplaza por `achievement_unlocks`.
- Fase 24: `GET /players/` suma `color` (uno de 10, único entre activos) y `since` (fecha de la primera partida); `POST /players/` y `PATCH /players/{id}` aceptan `color` (409 si lo tiene otro activo). Nuevos `GET /games/summaries` (filas del archivo, con el subconjunto) y `GET /games/{id}/report` (posiciones, margen, desempate por M€, ELO, récords rotos, igualados y cerca, logros de la partida y recompensas robadas). Crear y editar una partida devuelven el informe (`report`); editar conserva `message`.

## Estadísticas y récords (v2.0)

- `models/game_subset.py` y `routes/dependencies.py::game_subset`: el filtro único de subconjunto. Filtrar nunca escribe.
- `services/stats/context.py`: `StatsContext` lee las partidas una vez, en orden canónico, con posiciones, ganadores y margen.
- `services/stats/elo_replay.py`: ELO reproducido sobre el subconjunto, desde 1000 (ELO de mesa). Sin filtro coincide con el historial guardado.
- `services/achievement_evaluators/`: logros derivados (definiciones, métricas por partida, bucle de niveles único). `services/derived_service.py` recalcula ELO y logros juntos; al arrancar compara `app_meta.derived_version` con `DERIVED_VERSION` y recalcula todo si quedó atrás (D-13). Para agregar un logro: skill `new-achievement`.
- `services/records/`: motor de récords v2 (definiciones, métricas por partida, seguimiento D-05, carrera D-18, contexto «roto/cerca» por partida). Para agregar un récord: skill `new-record`.

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
