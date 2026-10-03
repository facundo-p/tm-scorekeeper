# Revisión técnica y plan de optimización

Revisión completa del repo (backend FastAPI + frontend React) hecha en octubre de 2026 como base del rediseño. No se modificó código de producción: este documento es el plan, para aprobar antes de implementar (regla 1 de `.claude/CLAUDE.md`).

Estado verificado al revisar: `tsc -b` limpio, 243 tests de frontend pasan (25 archivos, ~9 s). El build de producción genera un único JS de 618 kB (190 kB gzip), del cual recharts ocupa ~56 %.

## Resumen

1. **El login no protege nada.** El backend no tiene autenticación (`backend/main.py`) y el frontend compara contra `admin/admin` dentro del bundle (`frontend/src/constants/auth.ts`). Cualquiera con la URL de la API puede crear, editar o borrar partidas.
2. **Hay escrituras que pueden dejar datos inconsistentes.** `PUT /games/{id}` no valida nada y el recálculo de ELO hace varios commits separados sin lock.
3. **Los logros dependen de un POST que dispara la pantalla de resumen.** Si se recarga, se vuelve atrás o React ejecuta el efecto dos veces, el segundo llamado devuelve "sin logros".
4. **El wizard de carga no se puede completar con teclado** y pierde datos al volver de paso.
5. **Rendimiento:** N+1 en el repositorio de partidas, la tabla entera de partidas se carga en cada request de récords/perfil, no hay índices en las FK, y el frontend no hace code splitting ni cachea la lista de jugadores.

## Prioridad 1: seguridad e integridad de datos

| # | Problema | Dónde | Propuesta |
|---|---|---|---|
| S1 | API sin autenticación; credenciales mock en el bundle | `backend/main.py:14-26`, `frontend/src/constants/auth.ts`, `context/AuthContext.tsx` | Login real en el backend (token firmado, una cuenta admin compartida está bien para el grupo). Dependencia de auth en todas las rutas de escritura. Borrar las credenciales del frontend, `ProtectedRoute` como layout route y logout ante un 401. |
| S2 | `PUT /games/{id}` no valida (fechas futuras, jugadores duplicados o inexistentes, más de 3 hitos) | `services/game_service.py:184-194` | Un único `_validate_game()` compartido por POST y PUT. `UniqueConstraint(game_id, player_id)` y mapear `IntegrityError` a 409. |
| S3 | Escrituras no atómicas y recálculo de ELO con carrera posible | `repositories/elo_repository.py:21-33`, `player_repository.py:83-93` | Sesión por request, una sola transacción por operación y `pg_advisory_xact_lock` durante el recálculo. Unique `(player_id, game_id)` en el historial. |
| S4 | Los tests borran todas las tablas de la base apuntada por `DATABASE_URL`, que por defecto es la de desarrollo | `tests/conftest.py:12-17`, `db/session.py:7` | Abortar si el nombre de la base no termina en `_test`. Corregir el README, que sugiere SQLite. **Resuelto en v2.0, fase 15 (#81).** |
| S5 | Logros evaluados por un POST desde la pantalla de resumen; sólo devuelve los *nuevos* | `frontend/src/pages/GameRecords/GameRecords.tsx:51-53`, `backend/services/achievements_service.py:40-81` | Evaluar logros dentro de `POST /games` y devolverlos en la respuesta. La pantalla de resumen sólo lee. Usar la fecha de la partida como `unlocked_at`. |
| S6 | `GET /elo/admin/recompute?secret=` compara el secreto con `!=` y lo pasa por query string | `routes/elo_routes.py:25-31` | POST con header, `secrets.compare_digest`, documentar `ADMIN_SECRET`. **Resuelto en v2.0, fase 20 (`POST /admin/recompute`).** |

## Prioridad 2: rendimiento

**Backend**

- N+1 en `_orm_to_domain` (1 + 2N queries por listado) en `repositories/game_repository.py:31,53`. Usar `selectinload` para resultados y recompensas.
- La tabla completa de partidas se carga en `/games/`, `/records/`, récords por partida y cada perfil (`services/player_records_service.py:11`). Filtrar en SQL y cachear los récords globales invalidando al escribir.
- Faltan índices: `player_results(player_id)`, `player_results(game_id)`, `awards(game_id)`, `games(date)`, `player_elo_history(recorded_at)`. El docstring de `elo_repository.py:134` afirma que `recorded_at` está indexado y no lo está.
- La línea base del ELO recorre todo el historial (`elo_repository.py:70-90`) y `bulk_update_elo` hace un SELECT por jugador. Usar `DISTINCT ON` y un UPDATE masivo.
- Partidas del mismo día se ordenan por UUID aleatorio (`elo_service.py:105`). Agregar `games.created_at`.

**Frontend**

- Sin code splitting: todas las páginas y recharts se descargan en `/login` (`App.tsx:4-14`). Con `React.lazy` por página el primer JS baja a ~80 kB gzip. El rediseño propone además reemplazar recharts por SVG propio (los gráficos que usa la app son simples).
- La lista de jugadores se pide en 8 lugares sólo para mostrar nombres, y el wizard la pide dos veces a la vez. Adoptar TanStack Query y devolver nombres en las respuestas de la API.
- `api/client.ts:17` manda `Content-Type` también en los GET, lo que fuerza un preflight CORS en cada request de producción. Enviarlo sólo con body.
- Respuestas viejas pisan estado nuevo (`hooks/usePlayers.ts:14-27`, `PlayerProfile.tsx:29-46`). Cancelar con `AbortController` o usar `key={playerId}`.

## Prioridad 3: corrección

- **Empates en victorias.** `results[0].tied` siempre es `False` (el primero de un grupo empatado lleva `tied=False`, `services/helpers/results.py:44-55`). Por eso `most_games_won`, la racha de victorias y el registro de logros acreditan sólo al primer co-ganador, mientras el perfil cuenta a todos. Un helper `winners()` único y tests de empates.
- `GamesList` calcula el ganador por su cuenta e ignora el desempate por M€ (`GamesList.tsx:20-26`). Usar el resultado del backend.
- Récords empatados: sin `ORDER BY`, el poseedor es arbitrario; un récord de Turmoil con valor 0 igual tiene "dueño".
- `/games/{id_inexistente}/records` responde 200 con datos de todas las partidas (`game_records_service.py:10-28`).
- La fecha por defecto del formulario sale de UTC al cargar el módulo (`GameForm.types.ts:53`): después de las 21 h en Argentina propone el día siguiente.
- Campos numéricos: `parseInt(v) || 0` repone el 0 al borrar el campo, se aceptan negativos y falta `inputMode="numeric"`. Decisión pendiente: los PV de cartas pueden ser negativos en el juego real.
- Estados de carga eternos: si falla el request, `ResultsSection` y `AchievementsSection` muestran el spinner para siempre; `Records.tsx` muestra "no hay récords" ante un error. Falta un error boundary raíz.

## Prioridad 4: accesibilidad

- Las tarjetas de jugadores del wizard son `div` clickeables sin foco (`StepPlayerSelection.tsx:37-41`): **no se puede terminar la carga con teclado**. Lo mismo en `/players`.
- `Input` y `Select` generan el `id` desde el texto del label: los campos repetidos por jugador comparten id y todos los labels apuntan al primero. Usar `useId()` y un `fieldset` con `legend` por jugador.
- `Modal` sin `role="dialog"`, sin manejo de foco y con scroll del fondo. Migrar a `<dialog>` nativo.
- Contraste por debajo de AA: texto del botón primario 4.44:1, botón de peligro 3.12:1, texto de error 3.78:1, bordes de inputs 1.34:1. El outline de foco está anulado en `Input.module.css:31-34`.
- Los errores del wizard aparecen arriba mientras el usuario toca "Siguiente" abajo. Hacer scroll y foco al primer error.

## Prioridad 5: calidad de código (reglas de CLAUDE.md)

- Estilos inline en `GameForm.tsx:155,188` y `StepMilestones.tsx:79`.
- 57 funciones de frontend superan 20 líneas (`PlayerProfile` 195, `GameForm` 148, `GamesList` 135, `useGames` 104) y mezclan carga de datos con presentación. En el backend: `get_profile` 85, `calculate_results` 66, `reconcile_all` 59.
- Duplicaciones: el total por jugador existe 3 veces en el frontend, el loop de tiers 4 veces en los evaluadores de logros, `HighestSingleGameScore` copia `MaxScoreCalculator`.
- Código muerto: `GamesRepository.list()`, `GameListItemDTO`, `services/___init___.py`, `RecordResultDTO.emoji`.
- Sin ESLint (habría detectado los `div` clickeables y el `key` faltante en `StepReview.tsx:47-50`).
- Tests faltantes: wizard, 5 de 7 pasos, Players, GamesList, GameDetail, Records, Modal, auth, cliente de API; en backend, PUT, rutas de récords, CRUD de jugadores y empates. Playwright no corre en CI y `full-flow.spec.ts:90-99` está desactualizado.
- Documentación desactualizada: `frontend/README.md` dice 61 tests; `backend/README.md` sugiere SQLite.
- Ops: dependencias de Python sin versión fija; falta `requests` (lo usa `scripts/seed_games.py`); CI crea el esquema con `create_all`, así que las migraciones no se prueban.
- A confirmar: el hito de Vastitas Borealis figura como "Spacecrafter" en `backend/models/enums.py:44`, `frontend/src/constants/enums.ts:43`, los tests y una migración, pero las fichas comerciales del mapa lo llaman "Spacefarer". Corregirlo requiere una migración del enum en Postgres.
- A confirmar: `stolen_awards` se mide por partida aunque su descripción suena acumulativa, y las corporaciones "Terralabs Research" y "Terralabs Investigation" parecen duplicadas.

## Datos guardados que la UI no usa

El backend ya guarda todo lo necesario para las métricas nuevas del rediseño (ver `README.md` de esta carpeta, sección "Métricas nuevas"):

- Corporación y mapa por resultado: win rate y posición media por corporación y por mapa.
- Desglose de puntaje por categoría: "ADN de puntaje" de cada jugador y mejores marcas personales por categoría.
- Generaciones, draft y expansiones: puntos por generación, efecto de cada expansión.
- `opened_by` y `second_place` de recompensas: quién financia, cuánto rinde, recompensas robadas.
- Posiciones y márgenes: margen de victoria, partidas definidas por M€, resultados por tamaño de mesa.
- Historial de ELO: mayores subidas, sorpresas (ganarle a alguien con mucho más ELO), forma reciente.
- `avg_milestones` y `avg_awards` ya se calculan en el perfil y no se muestran.

## Plan propuesto por fases

Cada fase incluye su verificación, como pide la regla 2 de CLAUDE.md.

**Fase A, arreglos rápidos (1 a 2 días)**
- `useId()`, botones reales en lugar de `div`, foco y scroll a errores, fecha local, `inputMode`, bloquear doble Enter al crear jugador, error + reintento en lugar de spinners eternos, quitar estilos inline, `Content-Type` sólo con body, contraste y foco visibles, `React.lazy` por página, layout route y página 404, guardia de base `_test` en pytest, ESLint.
- *Verificación:* el wizard completo se termina sólo con teclado (test de Playwright); Lighthouse a11y ≥ 95; el JS inicial ≤ 100 kB gzip; `make test-backend` aborta contra la base de desarrollo.

**Fase B, integridad (2 a 3 días)**
- Auth en el backend, validación compartida POST/PUT, constraints únicos, transacción única con lock para el ELO, logros evaluados dentro de `POST /games`, helper `winners()` con tests de empates.
- *Verificación:* un PUT inválido devuelve 400/409; dos guardados concurrentes no corrompen el historial de ELO (test de integración); un empate en el primer puesto acredita la victoria a ambos en perfil, récords y logros.

**Fase C, rendimiento (1 a 2 días)**
- `selectinload`, índices por migración, caché de récords con invalidación, TanStack Query en el frontend, nombres de jugador en las respuestas.
- *Verificación:* `GET /games/` hace ≤ 3 queries para N partidas (test con contador de queries); el perfil no pide `/players`.

**Fase D, rediseño visual (por pantalla)**
- Implementar el sistema del mockup (`docs/redesign/mockup/`) pantalla por pantalla, empezando por tokens y componentes base, después Registrar partida y la ceremonia de fin de partida (el flujo más usado), y luego el resto. Detalle en `README.md`.
