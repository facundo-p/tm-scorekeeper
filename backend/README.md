# Backend

API FastAPI (Python 3.12, SQLAlchemy 2, Alembic) sobre PostgreSQL. Guarda partidas y jugadores. Todo lo demás se deriva del historial (D-04):
- ELO y ELO de mesa;
- récords;
- logros;
- temporadas;
- estadísticas.

## Base de datos

La app lee `DATABASE_URL`. En local conviene el `docker-compose.yml` de la raíz:

```bash
docker compose up -d   # levanta PostgreSQL
export DATABASE_URL="postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper"
```

Si `DATABASE_URL` no está definida, `db/session.py` usa ese mismo valor. Para bajar todo y borrar los datos: `docker compose down -v`.

## API

Todo exige `Authorization: Bearer` salvo `/health` y `/auth/login`. Los endpoints que aceptan `?player_count=2..5` muestran la vista «mesa»: se calcula sobre ese subconjunto y nunca se guarda.

| Recurso | Endpoints |
|---|---|
| Sesión | `POST /auth/login`, `GET /auth/me`, `GET /health` |
| Partidas | `GET /games/`, `POST /games/`, `PUT /games/{id}`, `DELETE /games/{id}`, `GET /games/summaries` (archivo con subconjunto), `GET /games/{id}/report` (informe) |
| Jugadores | `GET /players/`, `POST /players/`, `PATCH /players/{id}`, `GET /players/{id}/insights` (ficha), `GET /players/{id}/achievements` |
| Grupo | `GET /ranking`, `GET /stats/head-to-head`, `GET /stats/summary`, `GET /elo/history` |
| Récords y logros | `GET /records/`, `GET /records/{code}/history`, `GET /achievements/catalog` |
| Temporadas | `GET /seasons`, `GET /seasons/current`, `GET /seasons/{n}`, `GET /feed` (bitácora) |
| Administración | `POST /admin/recompute` (con `X-Admin-Secret`) |

La lista completa con sus schemas está en `/docs` (OpenAPI) del servidor. Los cambios de contrato de cada fase de v2.0 están más abajo.

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
- Fase 22: `GET /records` devuelve los 16 récords oficiales y acepta el subconjunto `?player_count=2..5&map=&expansion=` (fuera de rango → 422). Cada ítem conserva `code`, `title` y `description` (`emoji` y `record` se retiraron en 35.2) y suma `scope`, `unit`, `lower_is_better`, `value`, `holders` (todos los poseedores) e `history` (`set`/`broken`/`tied`, D-05 y D-18). Nuevo `GET /records/{code}/history` (404 si el código no existe). `value` puede ser decimal (`points_per_generation`).
- Fase 23: los logros se derivan del historial (D-04): son 18, se recalculan en cada alta, edición o borrado de partida dentro de la misma transacción, después del ELO, y un nivel puede perderse. `POST /games/{id}/achievements` ya no evalúa (se retiró en 35.2: lo que desbloqueó una partida está en su informe). `GET /players/{id}/achievements` y `GET /achievements/catalog` aceptan `?player_count=2..5` (vista «mesa», nunca se guarda) y suman `view`, `kind`, `glyph`, `flavor`, `value` y `unlocks` (nivel, fecha y partida). El progreso aparece en todo logro que no sea de un solo nivel (`flag`). `POST /admin/recompute` recalcula ELO y logros. La tabla `player_achievements` se reemplaza por `achievement_unlocks`.
- Fase 24: `GET /players/` suma `color` (uno de 10, único entre activos) y `since` (fecha de la primera partida); `POST /players/` y `PATCH /players/{id}` aceptan `color` (409 si lo tiene otro activo). Nuevos `GET /games/summaries` (filas del archivo, con el subconjunto) y `GET /games/{id}/report` (posiciones, margen, desempate por M€, ELO, récords rotos, igualados y cerca, logros de la partida y recompensas robadas). Crear y editar una partida devuelven el informe (`report`); editar conserva `message`. **Antes de migrar**: la migración `f2a3b4c5d6e7` asigna colores y aborta si hay más de 10 jugadores activos (no alcanzan los colores); en ese caso, desactivar jugadores antes de desplegar.
- Fase 25-A: nuevo `GET /players/{id}/insights?player_count=` (ficha del jugador frente al grupo: partidas, victorias, tasas, promedios, mejor partida, hitos y recompensas favoritos, composición del puntaje y arquetipo, corporaciones y mapas, racha y forma, némesis y víctima, récords que posee, puesto en el ranking, equidad, desglose por mesa y ELO —de mesa con el filtro—).
- Fase 25-B: `GET /ranking?player_count=&from=` (activos con partidas, por ELO, con equidad, forma, arquetipo y serie de ELO —`from` recorta solo la serie— y los cambios de líder), `GET /stats/head-to-head?player_count=` (matriz y némesis/víctima de cada jugador) y `GET /stats/summary?player_count=` (totales del grupo, corporaciones y mapas).
- Fase 32: `players.joined_on` (fecha de alta, D-78): `since` en `GET /players/` es esa fecha (las altas nuevas toman la del día; la migración `b4c5d6e7f8a9` completa las existentes con su primera partida) y, si falta, la de la primera partida.
- Fase 33: `GET /players/{id}/insights` suma `elo_series` (partidas en orden con el ELO después y el cambio) e `history` (de la más nueva a la más vieja: mapa, fecha, posición, mesa, puntos, corporación y cambio de ELO); con `?player_count=` los dos son del ELO de mesa (D-79).
- Fase 25-C: `GET /seasons` (temporadas del grupo con su Marte, carrera y campeón, e historial de campeones), `GET /seasons/current` y `GET /seasons/{n}` (`?category=total|<categoría>&player_count=` para la carrera, D-15) y `GET /feed?player_count=&limit=` (bitácora: partidas, récords rotos, logros y temporadas completas).
- **Fase 35.2 (cambio que rompe, D-82):** se retira la API que solo usaba el frontend previo a v2.0.
  - `GET /games/{id}/results`, `GET /games/{id}/elo`, `GET /games/{id}/records` y `POST /games/{id}/achievements`: lo trae `GET /games/{id}/report`.
  - `GET /players/{id}/profile` y `GET /players/{id}/elo-summary`: los reemplaza `GET /players/{id}/insights`.
  - `POST /achievements/reconcile`: lo reemplaza `POST /admin/recompute`.
  - `GET /records` deja `emoji` y `record`; los logros dejan `icon` y `fallback_icon` (queda `glyph`).
  - Se borra el motor de récords v1 (`services/record_calculators/`).

## Estadísticas y récords (v2.0)

- `models/game_subset.py` y `routes/dependencies.py::game_subset`: el filtro único de subconjunto. Filtrar nunca escribe.
- `services/stats/context.py`: `StatsContext` lee las partidas una vez, en orden canónico, con posiciones, ganadores y margen.
- `services/stats/elo_replay.py`: ELO reproducido sobre el subconjunto, desde 1000 (ELO de mesa). Sin filtro coincide con el historial guardado.
- `services/achievement_evaluators/`: logros derivados (definiciones, métricas por partida, bucle de niveles único). `services/derived_service.py` recalcula ELO y logros juntos; al arrancar compara `app_meta.derived_version` con `DERIVED_VERSION` y recalcula todo si quedó atrás (D-13). Para agregar un logro: skill `new-achievement`.
- `services/stats/{insights,group,seasons,feed}.py`: ficha del jugador, ranking y resumen, temporadas y bitácora (espejo de `derive.js`; sumas de izquierda a derecha, D-67).
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
