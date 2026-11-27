# v2.0 «Archivo de Terraformación» — SPEC

> Plan de acción autosuficiente del milestone v2.0. Fuente de verdad junto con `LEDGER.md`.
> Si algo de este documento contradice al mockup, gana este documento; si contradice al código, gana este documento.
> Semántica fina de cada cálculo: `docs/redesign/SEMANTICS.md` (se escribe en F17).

## 0. Alcance y referencias

- **Objetivo:** llevar la app real (backend FastAPI en `backend/`, frontend React/TS en `frontend/`) a verse y funcionar como el mockup `docs/redesign/mockup/`, con datos reales, más las funciones nuevas de §2.
- **Referencias obligatorias:** `docs/redesign/README.md` (diseño), `docs/redesign/REVIEW.md` (S1–S6, P2–P5), `docs/redesign/screens/` (capturas), `docs/redesign/mockup/js/data/derive.js` (implementación de referencia de todas las métricas).
- **Rama:** `claude/amazing-thompson-p5ole5`, siempre reseteada a `origin/staging` después de cada merge. Un PR por fase (o sub-fase `NN.1`, `NN.2` si supera 3k líneas) hacia `staging`.
- **Base de partida:** `origin/staging` en `1b37ec2` (merge del PR #69). Baseline: 193 tests de backend, 243 de frontend, `tsc -b` limpio.

## 1. Decisiones del dueño (cerradas)

1. **Login real** con la cuenta compartida; toda la API exige token salvo `/health` y `/auth/login`.
2. **Récords y logros nuevos oficiales.** Desaparece la sección «Propuesto».
   - Récords: `biggest_margin`, `closest_win` (menor es mejor), `points_per_generation`, `fastest_win` (menor es mejor), `highest_elo`, `longest_streak`, `richest_finish`.
   - Logros: `corp_collector` 5/10/20/30 · `photo_finish` ganar por ≤ 2 · `blitz` ganar en ≤ 9 generaciones · `giant_killer` 1/3/6 · `full_table` ganar con 5 jugadores · `city_planner` 10/15/20/25.
3. **Hitos y recompensas en castellano** en toda la UI. Una tabla única `frontend/src/domain/labels.ts`, basada en el PR #66 y completada con Utopia, Cimmeria y Venus. La API devuelve las claves del enum. Nombres no verificables: marca `revisar`.
4. **Temporadas:** temperatura +0,8 pasos por partida (tope 19 pasos de 2 °C desde −30); O₂ += Σ vegetación de la partida / 52 (tope 14); océanos +0,375 (tope 9). La temporada cierra en la partida en que los tres llegan al tope. Carrera ordenada por **promedio** de puntos por partida (total o categoría: TR, hitos, recompensas, cartas, recursos de cartas, vegetación, ciudades, Turmoil — esta última solo sobre partidas con Turmoil), con filtro de mesa. Mínimo 3 partidas para clasificar; el resto aparece aparte con «le faltan N partidas».
5. **Filtro de mesa** `Todas · 2 · 3 · 4 · 5`, independiente por pantalla y en la URL (`?mesa=N`): Inicio (carrera), Partidas, Ranking, Perfil (todas las pestañas), Récords (más mapa y expansión, #37) y Logros. Aviso «Solo partidas de N jugadores · Quitar». Con filtro: «ELO de mesa N» recalculado al vuelo; logros como vista calculada y rotulada; nunca se escribe en la base. Sin filtro en Informe, Registrar, Ceremonia y Acceso.
6. **Equidad** (columnas extra en Ranking y Perfil, con tooltip, adaptadas al filtro): «Victorias vs. esperado» = victorias − Σ(1/n) y victorias ÷ Σ(1/n) en %; «Posición relativa» = promedio de (n − pos)/(n − 1) en %.
7. **Desglose «Por tamaño de mesa»** en Perfil y Ranking: filas 2, 3, 4, 5 con partidas, victorias, % vs. esperado, promedio de puntos y posición relativa.
8. **Editar y eliminar desde el informe.** «Editar» abre Registrar precargado; «Eliminar» confirma. ELO, récords y logros se recalculan en cascada (#44).
9. **PRs absorbidos:** #65 (orden del archivo por fecha, ganador, mapa o jugadores; si no es por fecha, no se agrupa por mes) y #66 (hito y recompensa más reclamados en el Perfil). Quedan resueltos #33, #35, #37, #38 y #44.
10. **Revisión de cada PR** por subagente nuevo (`pr-reviewer`, `model: sonnet`, `effort: medium`). Con aprobación y CI verde, merge a `staging`.
11. **Reanudación** con rutina horaria; sin notificaciones push.

## 2. Decisiones técnicas

Ver `DECISIONS.md` (D-01 a D-15 y las que surjan). Resumen operativo:

| ID | Regla |
|---|---|
| D-01 | Una rama y un PR por fase; GSD `branching_strategy: none` |
| D-02 | Rutas en castellano: `/acceso`, `/`, `/partidas`, `/partidas/:id`, `/partidas/:id/ceremonia`, `/partidas/:id/editar`, `/registrar`, `/ranking`, `/jugadores/:id?tab=`, `/records`, `/logros`; las viejas redirigen |
| D-03 | Auth: `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` (PBKDF2 stdlib), `AUTH_SECRET`; JWT HS256 (PyJWT) de 30 días (`AUTH_TOKEN_TTL_DAYS`) como Bearer; localStorage; 401 cierra sesión; 5 fallos/IP → 30 s de bloqueo; fail-closed |
| D-04 | Logros derivados del historial, un registro por nivel fechado con su partida |
| D-05 | Récords: cambian de dueño solo si se superan; igualar → co-poseedor; la primera partida establece y no rompe; ≤ 1 quiebre por récord y partida; valor 0 sin dueño |
| D-06 | Redondeo half-even en todos lados (mockup incluido) |
| D-07 | Gana quien queda 1.º; co-ganadores cuentan todos; helper único `winners()` |
| D-08 | `giant_killer`: ganar con ELO previo estrictamente menor que el máximo ELO previo de la mesa |
| D-09 | Sin estilos inline salvo custom properties vía `cssVars()`; ESLint lo controla |
| D-10 | TanStack Query en hooks `useX`; el filtro va en las claves de cache |
| D-11 | `prefers-reduced-motion` congela planeta, ticker, contadores, inclinaciones, confeti, meteoros y ceremonia |
| D-12 | Tipografías OFL (Chakra Petch, Saira variable, Crimson Pro itálica) en el repo |
| D-13 | `app_meta.derived_version`: al arrancar, si quedó atrás, recálculo de ELO y logros bajo advisory lock |
| D-14 | Cambios de API aditivos hasta F35 |
| D-15 | Campeón: primer clasificado por promedio total al cierre; desempate por más partidas y luego mejor puntaje |

## 3. Semántica de referencia (resumen; detalle en `docs/redesign/SEMANTICS.md`)

- **Total** = TR + hitos + recompensas + cartas + recursos de cartas + vegetación + ciudades + Turmoil (null = 0). M€ no suma.
- **Posiciones:** orden por (total desc, M€ desc); empate real si coinciden ambos (misma posición, saltando la siguiente: 1, 1, 3). `tied` vale true para **todos** los miembros de un grupo empatado (corrige el bug de `results[0].tied`).
- **Ganadores** (`winners()`): todas las filas con posición 1. **Margen** = total del primero − total de la primera fila con posición > 1 (0 si no hay). **Decidida por M€** = hay ≥ 2 filas y las dos primeras empatan en total.
- **Orden canónico de partidas:** (`date`, `created_at`, `id`) desde F21; antes (`date`, `id`).
- **ELO:** por pares, K = 32, inicial 1000, delta = round_half_even(32 × Σ(s − e)).
- **Subconjunto de mesa N:** partidas con exactamente N resultados. **ELO de mesa N:** reproducción del ELO desde 1000 solo sobre ese subconjunto.
- **Récords por partida** (`scope: game`), métricas por partida: total, TR, cartas, recursos de cartas, vegetación, ciudades, Turmoil (solo valores > 0), `biggest_margin` y `closest_win` (solo con ganador único; valor = margen), `points_per_generation` (total / generaciones, 1 decimal half-even), `fastest_win` (generaciones de cada ganador), `richest_finish` (M€ final).
- **Récords de carrera** (`scope: career`): `most_games_played`, `most_games_won`, `highest_elo` (pico de ELO), `longest_streak` (mejor racha de victorias consecutivas). Poseedores: todos los que tienen el máximo, si es > 0.
- **Logros:** métricas acumuladas por jugador en orden canónico; cada nivel se fecha con la primera partida en que la métrica alcanzó el umbral.
- **Temporadas:** §1.4; la carrera y el campeón usan promedios (D-15).
- **Equidad y por mesa:** §1.6 y §1.7.

## 4. Requisitos (IDs nuevos de v2.0)

Prefijos: `INFRA` (ejecución), `PAR` (comparación y golden), `MOCK` (mockup), `VIS` (base visual), `SEC` (seguridad y validación), `TXN` (transacciones, orden, rendimiento, corrección), `STAT` (estadísticas), `SEAS` (temporadas), `SHELL` (shell y datos), `FX` (efectos e instrumentos), `SCR` (pantallas), `CLOSE` (cierre). La tabla de trazabilidad vive en `.planning/REQUIREMENTS.md`.

## 5. Épicas y fases

| Épica | Fases |
|---|---|
| E1 Ejecución y verificación | F15, F16 |
| E2 Especificación: el mockup alineado | F17, F18 |
| E3 Backend: seguridad, integridad y rendimiento | F20, F21 |
| E4 Backend: estadísticas, mesa y temporadas | F22–F25 |
| E5 Frontend: sistema visual, shell y planeta | F19, F26, F27 |
| E6 Pantallas | F28–F34 |
| E7 Cierre | F35, F36 |

Orden: 15 → 16 → … → 36. Cada fase: `NN-CONTEXT.md`, `NN-MM-PLAN.md`, `NN-MM-SUMMARY.md`, `NN-VERIFICATION.md` en `.planning/phases/NN-slug/`.

---

### F15 · Specs, infra y guardas — `phases/15-specs-infra-guardas`
- **Épica:** E1 · **Depende de:** — · **Requisitos:** INFRA-01..05
- **15.1 Paso 1** (INFRA-01): `SPEC.md`, `RUNBOOK.md`, `LEDGER.md`, `DECISIONS.md`; GSD (`PROJECT`, `REQUIREMENTS`, `ROADMAP`, `STATE`, `config.json` con `branching_strategy: none`); `.claude/agents/{pr-reviewer,visual-judge}.md`; tablero en GitHub.
  - *Aceptación:* los archivos existen; el tablero tiene paraguas, 7 épicas y un issue por ítem `NN.x`.
- **15.2 Scripts de desarrollo** (INFRA-02):
  - `scripts/dev/bootstrap.sh`: idempotente; levanta PG16 (`pg_ctlcluster 16 main start`), crea rol `tm_user` y bases `tm_scorekeeper_test`, `tm_parity`, `tm_migrations_test`; crea `backend/.venv` e instala `requirements-dev.txt`; `npm ci` en `frontend` solo si cambió el hash de `package-lock.json` (sello en `frontend/node_modules/.lock-hash`); ídem para `tools/parity` cuando exista; chequea chromium en `/opt/pw-browsers` (o `PARITY_CHROMIUM`); escribe `.env.agent` (ignorado por git) con `DATABASE_URL`, `PLAYWRIGHT_BROWSERS_PATH`, `PARITY_CHROMIUM`.
  - `scripts/dev/gates.sh <alcance>` con alcances `backend|frontend|parity|all|quick`: pytest (+ golden si existe), alembic sobre base vacía si cambiaron `backend/db/migrations/` respecto de `origin/staging`, lint (cuando exista), typecheck, vitest, build, e2e (cuando exista), comparación (cuando exista) y `pr-size.sh`. Sale con el primer código no cero y un resumen de una línea por gate.
  - `scripts/dev/pr-size.sh`: líneas cambiadas contra `origin/staging`, sin contar `fixtures/`, `**/fonts/**`, lockfiles, `*shaders*`, `docs/redesign/screens/`, `*.png|*.jpg|*.woff2`; máximo 3000.
  - *Aceptación:* correr `bootstrap.sh` dos veces seguidas no da errores; `gates.sh quick` pasa.
- **15.3 Guarda de la base de tests** (INFRA-03, S4): `backend/tests/conftest.py` llama a `pytest.exit(..., returncode=2)` si el nombre de la base de `DATABASE_URL` no termina en `_test`; CI usa `tm_scorekeeper_test`; skill `test-backend` documenta la alternativa sin Docker (`scripts/dev/bootstrap.sh` + `.venv`).
  - *Casos borde:* URL con query string (`?sslmode=`), URL sin base, `DATABASE_URL` ausente (el default apunta a `tm_scorekeeper` → sale con 2).
  - *Aceptación:* `DATABASE_URL=…/tm_scorekeeper pytest` sale con código 2 y no toca la base.
- **15.4 Dependencias** (INFRA-04, INFRA-05): `backend/requirements.txt` con versiones fijas (`==`) de lo que resuelve hoy, salvo `sqlalchemy>=2.0,<2.1` con comentario (2.1 usa psycopg 3 por defecto y rompía CI, PR #70); `backend/requirements-dev.txt` (`-r requirements.txt`, pytest, httpx, requests); CI instala dev; `.planning/codebase/STACK.md` e `INTEGRATIONS.md` actualizados; issue de seguimiento «Migrar a psycopg 3» (`postgresql+psycopg://`, `prepare_threshold=None` por el pooler de Supabase).
- **Verificación:** `scripts/dev/gates.sh backend`; `DATABASE_URL=postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper backend/.venv/bin/python -m pytest backend/tests -q; test $? -eq 2`; `bash scripts/dev/bootstrap.sh && bash scripts/dev/bootstrap.sh`.
- **Listo cuando:** guarda con código 2, bootstrap idempotente y merge a `staging` funcionando (si la protección lo impide → BLOQUEO).

### F16 · Arnés de comparación, fixtures y golden — `phases/16-arnes-comparacion`
- **Épica:** E1 · **Depende de:** F15 · **Requisitos:** PAR-01..05
- **16.1 Arnés** `tools/parity/` (PAR-01), según §8.1 del prompt original, resumido en §7 de este SPEC.
  - `package.json` con versiones fijas: `playwright@1.56.1`, `pixelmatch`, `pngjs`, `yaml`, `@axe-core/playwright`, `preact@10.27.2`, `htm@3.1.1`.
  - `serve/reference.mjs` (mockup estático; jsdelivr → `node_modules`; Google Fonts → tipografías locales; `fonts.gstatic.com` bloqueado; oculta los controles del prototipo; `--ref mockup@<sha>` vía `git worktree`).
  - `serve/candidate.mjs` (recrea `tm_parity`, `alembic upgrade head`, carga `fixtures/seed.json`, uvicorn con credenciales de prueba, `vite build --mode parity` + `vite preview`, token inyectado). Hasta F26 la candidata no existe: el arnés corre en modo `--self` (mockup contra mockup).
  - `lib/{browser,freeze,ready,capture,compare,a11y,styles,report}.mjs`, `run.mjs`, `scenarios/*.yaml`, `JUDGE_RUBRIC.md`.
- **16.2 Exportador** `tools/fixtures/export.mjs` (PAR-02): primero alinea `derive.js` a half-even (D-06) con un helper `roundHalfEven` en `js/lib.js`; importa los módulos de datos del mockup en Node y escribe `fixtures/seed.json` y `fixtures/golden.json` (sin filtro y por mesa 2..5). `--check` regenera en memoria y compara (CI).
- **16.3 Cargador** `backend/scripts/load_fixture.py` (PAR-03): solo bases que terminan en `_test` o `_parity`; conserva ids; una inserción en bloque y un único `recompute_all()`; < 30 s para 63 partidas.
- **16.4 Golden** `backend/tests/golden/` (PAR-04, PAR-05): `conftest.py` (carga la semilla una vez por sesión en la base `_test`), `adapters.py` (DTO ↔ golden), `enabled.yaml` (claves activas por fase), `test_golden.py`. En F16 se activan `positions` y `elo`.
- **Verificación:** `node tools/parity/run.mjs --self --phase 16` (≤ 0,01 %); `node tools/fixtures/export.mjs --check`; `pytest backend/tests/golden -q`; tiempo de carga.

### F17 · Mockup I: contenido, semántica y ganchos — `phases/17-mockup-contenido`
- **Épica:** E2 · **Depende de:** F16 · **Requisitos:** MOCK-01..03
- **17.1 Contenido** (MOCK-01): récords y logros nuevos oficiales (sin `proposed`, sin sección «Propuesto» en `screens/records.js` y `screens/achievements.js`); nombres en castellano vía `js/data/labels.js` (espejo de `frontend/src/domain/labels.ts`) y Spacefarer; orden del archivo (#65) en `screens/games.js`; favoritos en el Perfil (#66); filtros de récords por mapa y expansión (#37); error de login real, página 404 y «Salir» en el móvil. Correcciones de la revisión del PR #69: `REVIEW.md` (`conftest.py` 12-17, `player_records_service.py:11`, `game_records_service.py` 10-28) y `README.md` del rediseño (el color de cubo necesita `players.color`).
- **17.2 Semántica** (MOCK-02): `docs/redesign/SEMANTICS.md` (D-04..D-08, D-15, filtros, equidad, temporadas); `derive.js` sin quiebres falsos en la primera partida, sin dobles quiebres por partida, co-poseedores en empates, `giant_killer` según D-08, `tied` para todo el grupo, `winners()` único.
- **17.3 Ganchos** (MOCK-03): `data-scroll-root`, `data-planet-slot`, `window.__TM_PLANET__.drawRect()`; reduced-motion extendido a planeta y ticker; `?demo=loading|error`; reloj inyectable (`js/clock.js`, `?now=`), sin fechas fijas; navegación con `<a href>` reales; pantalla `#galeria` con átomos e instrumentos.
- **Verificación:** `run.mjs --self --ref mockup@<sha-previo> --screens <no tocadas>` idénticas; golden regenerado (`export.mjs`).

### F18 · Mockup II: mesa, equidad, temporadas y corrección — `phases/18-mockup-mesa`
- **Épica:** E2 · **Depende de:** F17 · **Requisitos:** MOCK-04..07
- **18.1** (MOCK-04) filtro de mesa por pantalla con aviso; ELO de mesa y logros por mesa; paneles «Por tamaño de mesa»; columnas de equidad con tooltip. `derive.js` gana `buildModel({ playerCount })` memoizado.
- **18.2** (MOCK-05) temporada por promedio: selector de categoría, filtro de mesa, mínimo 3, no clasificados aparte, campeón D-15, reglas actualizadas.
- **18.3** (MOCK-06) «Editar» (`#editar-<id>`, registro precargado), «Eliminar» con confirmación, «Repetir ceremonia».
- **18.4** (MOCK-07) golden regenerado; capturas y README del rediseño actualizados; artifact republicado en https://claude.ai/artifact/Mmov1ofG8XcAMN9tKA5Zf6.

### F19 · Base visual del frontend — `phases/19-base-visual`
- **Épica:** E5 · **Depende de:** F16 · **Requisitos:** VIS-01..04
- **19.1** (VIS-01) ESLint 9 flat (`frontend/eslint.config.js`): typescript-eslint, react-hooks, jsx-a11y, regla D-09 (`no-restricted-syntax` sobre `style` salvo `style={cssVars(...)}`); `npm run lint` en CI; arreglo del tsconfig de #65.
- **19.2** (VIS-02) `frontend/src/styles/{tokens,base,fonts}.css` portados de `mockup/css/{tokens,base}.css`; tipografías en `frontend/public/fonts/` (D-12); íconos en `frontend/src/ui/icons/` (de `mockup/js/ui/icons.js`).
- **19.3** (VIS-03) átomos con CSS Modules en `frontend/src/ui/atoms/`: Plate, Button, Cube, PlayerTag, CorpEmblem, MapBadge, Chip, NewBadge, Tabs (flechas, Home/End), Delta, Readout, TierPips, Medal, CountUp, Empty, campos (`Field`, `NumberField`, `SelectField`); `Sheet` (portal, foco atrapado, Escape); `states/{Loading,ErrorState,EmptyState}`.
- **19.4** (VIS-04) `frontend/src/domain/{catalog,labels,format,cssVars}.ts`; página `/__galeria` solo con `--mode parity`.
- Tokens `--color-*` viejos conviven hasta F35. **Comparación:** `gal-atoms`.

### F20 · Autenticación y validación — `phases/20-auth-validacion`
- **Épica:** E3 · **Depende de:** F15 · **Requisitos:** SEC-01..04
- **20.1** (SEC-01) `backend/routes/auth_routes.py` (`POST /auth/login`, `GET /auth/me`), `GET /health` en `main.py`; `backend/services/auth_service.py` (PBKDF2, JWT, limitador en memoria por IP); `backend/routes/dependencies.py::require_auth` en `include_router(..., dependencies=[Depends(require_auth)])`; `backend/scripts/hash_password.py`; `render.yaml` y `backend/.env.example`; CORS con `Authorization`; tests 401/200/429.
  - *Casos borde:* variables ausentes → 503/401 fail-closed; token vencido; firma inválida; header mal formado; 6.º intento en < 30 s → 429.
- **20.2** (SEC-02) frontend actual: `api/client.ts` con Bearer, `AuthContext` contra `/auth/login`, 401 → logout; se borra `constants/auth.ts`.
- **20.3** (SEC-03) `GamesService._validate_game()` compartido por crear y editar; hitos y recompensas válidos para el mapa y las expansiones; migración con `UNIQUE(game_id, player_id)` en `player_results` que aborta si encuentra duplicados; `IntegrityError` → 409.
- **20.4** (SEC-04) `POST /admin/recompute` autenticado + header `X-Admin-Secret` comparado con `secrets.compare_digest`; se retira `GET /elo/admin/recompute`.
- **Listo cuando:** todo salvo login y health da 401 sin token y el frontend viejo sigue andando.

### F21 · Transacciones, orden, rendimiento y empates — `phases/21-transacciones`
- **Épica:** E3 · **Depende de:** F20 · **Requisitos:** TXN-01..04
- **21.1** (TXN-01) `backend/db/uow.py` (unidad de trabajo con sesión única); repositorios aceptan `session` opcional; `pg_advisory_xact_lock` en escrituras de partidas y recálculos; `UNIQUE(player_id, game_id)` en `player_elo_history`; test de concurrencia (dos hilos creando partidas).
- **21.2** (TXN-02) `games.created_at` con backfill que respeta (fecha, id).
- **21.3** (TXN-03) `selectinload`; índices `player_results.game_id`, `player_results.player_id`, `awards.game_id`, `player_elo_history.recorded_at`; `GET /games/` ≤ 3 queries (contador con `event.listen`).
- **21.4** (TXN-04) `services/helpers/results.py::winners()` y `tied` para todo el grupo; récords con todos los poseedores; Spacefarer vía `rename_enum_value` aceptando el nombre viejo en la entrada; 404 en partidas y jugadores inexistentes; job de CI con migraciones sobre base vacía.

### F22 · Subconjuntos, ELO de mesa y récords v2 — `phases/22-subconjuntos-records`
- **Épica:** E4 · **Depende de:** F21 · **Requisitos:** STAT-01..03
- **22.1** (STAT-01) `backend/models/game_subset.py` (`player_count` 2–5, `map`, `expansion`); `backend/services/stats/context.py` (`StatsContext`: carga partidas una vez en orden canónico con posiciones y ganadores); `backend/routes/dependencies.py::game_subset` (`?player_count=&map=&expansion=`, 422 fuera de rango).
- **22.2** (STAT-02) `backend/services/stats/elo_replay.py` reutiliza `calculate_elo_changes`; test: reproducir todo = historial guardado.
- **22.3** (STAT-03) 7 récords nuevos en `services/record_calculators/`, atributos `lower_is_better`, `scope`, `unit`; todos los poseedores e historial (D-05); contexto «roto» y «cerca» (≤ 3, máximo 3 por partida); campos aditivos en `GET /records` y nuevo `GET /records/{code}/history`; skill `new-record` actualizado. **Golden:** `records` sin filtro y por mesa.

### F23 · Logros derivados, nuevos y vista por mesa — `phases/23-logros-derivados`
- **Épica:** E4 · **Depende de:** F22 · **Requisitos:** STAT-04..07
- **23.1** (STAT-04) tabla `achievement_unlocks(player_id, code, tier, game_id, unlocked_on, UNIQUE(player_id, code, tier))`; bucle de niveles único (`services/achievement_evaluators/tiers.py`).
- **23.2** (STAT-05) recálculo en crear, editar y borrar dentro de la misma transacción, después del ELO (#44); `POST /games/{id}/achievements` = lectura repetible; D-13 con `app_meta(key, value)` y `derived_version`.
- **23.3** (STAT-06) 6 logros nuevos con íconos; skill `new-achievement` actualizado.
- **23.4** (STAT-07) `?player_count=` en `GET /players/{id}/achievements` y `GET /achievements/catalog` → `view: "mesa"`, sin escritura. **Listo cuando:** idempotente; editar/borrar actualiza desbloqueos; la vista por mesa no escribe.

### F24 · Jugadores, partidas e informe — `phases/24-jugadores-informe`
- **Épica:** E4 · **Depende de:** F23 · **Requisitos:** STAT-08..10
- **24.1** (STAT-08) `players.color` (enum de 10: rojo, verde, azul, amarillo, negro, naranja, violeta, rosa, blanco, gris), único entre activos, backfill determinístico; `since` (fecha de la primera partida); PATCH acepta color (409 si está tomado).
- **24.2** (STAT-09) `GET /games/summaries` (fecha, mapa, mesa, ganadores, margen, desempate por M€, puntajes para la pista) con filtros de subconjunto.
- **24.3** (STAT-10) `GET /games/{id}/report` (posiciones y empates, margen, ELO por jugador, récords rotos y cerca, logros de la partida, recompensas robadas) siempre sobre todas las partidas; crear y editar devuelven el informe; `DELETE` recalcula todo. **Golden:** informe de las 63 partidas.

### F25 · Métricas del grupo, equidad y temporadas — `phases/25-metricas-temporadas`
- **Épica:** E4 · **Depende de:** F24 · **Requisitos:** STAT-11..12, SEAS-01
- **25.1** (STAT-11) `GET /players/{id}/insights?player_count=`: ELO (o de mesa), pico, rango; partidas, victorias, promedio, mejor partida, posición media; equidad; ADN y arquetipo frente al grupo; mapas y corporaciones; forma (8) y rachas; promedios de hitos y recompensas (#38); más reclamados (#35, #66); desglose por mesa.
- **25.2** (STAT-12) `GET /ranking?player_count=&from=` con equidad; `GET /stats/head-to-head?player_count=` y rivalidades; `GET /feed?player_count=&limit=`; `GET /stats/summary?player_count=`.
- **25.3** (SEAS-01) `GET /seasons` y `GET /seasons/current?player_count=&category=`, §1.4 y D-15, historial de campeones.
- **Listo cuando:** golden sin filtro y por mesa; p95 < 300 ms en local.

### F26 · Shell, rutas, datos y filtro de mesa — `phases/26-shell`
- **Épica:** E5 · **Depende de:** F19, F25 · **Requisitos:** SHELL-01..04
- **26.1** (SHELL-01) `frontend/src/shell/`: escenario, cielo, overlays, grano, scroller (`data-scroll-root`); barra superior (marca, ticker, chip de temporada); rail (escritorio) y dock con FAB (móvil); `@container app` a 560/760/1080/1180.
- **26.2** (SHELL-02) `frontend/src/routes.tsx` con D-02, redirecciones, `React.lazy`, 404 y `ErrorBoundary`.
- **26.3** (SHELL-03) `frontend/src/api/http.ts` (Bearer, timeout 15 s, `AbortController`, `ApiError` tipado); `@tanstack/react-query`; hooks `frontend/src/data/useX.ts`.
- **26.4** (SHELL-04) `frontend/src/ui/MesaFilter/`, `useMesaParam()`, `MesaNotice`. **Comparación:** `shell`, `404`, `state-loading`, `state-error`.

### F27 · Efectos e instrumentos — `phases/27-efectos-instrumentos`
- **Épica:** E5 · **Depende de:** F26 · **Requisitos:** FX-01..02
- **27.1** (FX-01) `frontend/src/fx/planet/` (WebGL2 en TS; `PlanetStage` contexto + `PlanetSlot`; chunk aparte; respaldo CSS; test de deriva de shaders contra `mockup/js/fx/planet-shaders.js`); `fx/stars.ts`, `fx/confetti.ts`.
- **27.2** (FX-02) `frontend/src/ui/instruments/`: Thermometer, OxygenArc, Oceans, ScoreTrack, Legend, ScoreBars (+ tabla), Composition, Sparkline, Form, EloChart (+ tabla), HeadToHead, TrTrack, EloDelta. Reemplazan recharts. **Comparación:** `gal-instruments`, `planet-parked`.

### F28–F34 · Pantallas
Cada pantalla se porta de `docs/redesign/mockup/js/screens/<x>.js` a `frontend/src/screens/<X>/`, con test por componente y comparación con variantes de filtro.

| Fase | Issues | Cierra | Comparación exigida |
|---|---|---|---|
| F28 `28-acceso-inicio` (SCR-01..02) | 28.1 Acceso · 28.2 Inicio (héroe de temporada, carrera por promedio con categoría y mesa, consejo, bitácora, reglas) | — | `login`, `login-invalid`, `home`, `home-race-mesa3`, `home-race-cat`, `season-rules` |
| F29 `29-partidas-informe` (SCR-03..04) | 29.1 Partidas (filtros, orden, calendario, vacío) · 29.2 Informe (editar, eliminar) | #65 | `games*`, `games-sort-*`, `games-empty`, `report-g063`, `report-turmoil`, `report-tie`, `report-delete` |
| F30 `30-registrar` (SCR-05..06) | 30.1 Asistente de 5 pasos con borrador en sessionStorage · 30.2 Teclado y modo edición (PUT) | #33 | `register-1..5`, `register-errors`, `register-edit` |
| F31 `31-ceremonia` (SCR-07) | 31.1 Ceremonia (secuencia, saltar, repetir) | — | `ceremony-g063` + funcional `ceremony-skip` |
| F32 `32-ranking` (SCR-08..09) | 32.1 Ranking (filtros, ELO de mesa, equidad, cara a cara, por mesa) · 32.2 Alta y edición de jugadores con color | — | `ranking*`, `ranking-mesa5`, `player-new`, `player-edit` |
| F33 `33-perfil` (SCR-10..11) | 33.1 Perfil: resumen, cubo, lecturas, favoritos · 33.2 Pestañas, filtro, por mesa, equidad | #66, #35, #38 | `profile-{facu,juli,pato}-*`, `profile-facu-mesa3` |
| F34 `34-records-logros` (SCR-12..13) | 34.1 Récords (historia, filtros) · 34.2 Logros (vista por mesa, escalera) | #37, #44 | `records*`, `achievements*`, `achievement-sheet` |

### F35 · Limpieza y presupuestos — `phases/35-limpieza`
- **Épica:** E7 · **Requisitos:** CLOSE-01..03
- **35.1** (CLOSE-01) se borran `frontend/src/pages/**`, componentes y CSS viejos, recharts, lucide, tokens `--color-*`, código muerto (REVIEW P5).
- **35.2** (CLOSE-02) se retira la API deprecada (`POST /games/{id}/achievements` de escritura, `GET /games/{id}/records` viejo, etc.). Única fase con cambios que rompen.
- **35.3** (CLOSE-03) axe sin serios/críticos; JS inicial ≤ 100 kB gzip; planeta en chunk aparte; `tools/budgets/check-bundle.mjs` en CI. **Comparación:** catálogo completo.

### F36 · Documentación, entrega y cierre — `phases/36-cierre`
- **Épica:** E7 · **Requisitos:** CLOSE-04..06
- **36.1** (CLOSE-04) READMEs (raíz, `frontend/`, `backend/`), skills afectados, CLAUDE.md (aclaración D-09).
- **36.2** (CLOSE-05) `docs/deploy/v2.0-checklist.md` (backup de Supabase, variables de auth en Render, promoción a `main` por el dueño, migraciones y recálculo D-13, humo).
- **36.3** (CLOSE-06) milestone en `.planning` (MILESTONES y auditoría); cerrar issues, PRs #65/#66 y épicas; reporte de comparación como artifact; borrar la rutina; informe final.

## 6. Escenarios de comparación (catálogo)

`tools/parity/scenarios/<pantalla>.yaml`. Cada escenario: `id`, `screen`, `ref.hash`, `ref.search`, `cand.path`, `viewports` (`desktop` 1440×900, `mobile` 390×844), `fresh`, `storage`, `actions` (`click|fill|press|scroll` por rol accesible), `frames`, `masks`, `probes`, `gateFromPhase`, `thresholds` (con `reason`).

| Pantalla | Escenarios | Exigido desde |
|---|---|---|
| galería | `gal-atoms`, `gal-instruments`, `planet-parked` | F19 / F27 |
| shell | `shell`, `404`, `state-loading`, `state-error` | F26 |
| acceso | `login`, `login-invalid` | F28 |
| inicio | `home`, `home-race-mesa3`, `home-race-cat`, `season-rules` | F28 |
| partidas | `games`, `games-mesa3`, `games-filter-map`, `games-sort-winner`, `games-sort-map`, `games-sort-players`, `games-calendar`, `games-empty` | F29 |
| informe | `report-g063`, `report-turmoil`, `report-tie`, `report-delete` | F29 |
| registrar | `register-1`…`register-5`, `register-errors`, `register-edit` | F30 |
| ceremonia | `ceremony-g063` | F31 |
| ranking | `ranking`, `ranking-mesa5`, `ranking-h2h`, `ranking-by-table`, `player-new`, `player-edit` | F32 |
| perfil | `profile-facu-summary`, `profile-facu-games`, `profile-facu-records`, `profile-facu-achievements`, `profile-juli-summary`, `profile-pato-summary`, `profile-facu-mesa3` | F33 |
| récords | `records`, `records-mesa4`, `records-map`, `records-history` | F34 |
| logros | `achievements`, `achievements-mesa3`, `achievements-player`, `achievement-sheet` | F34 |

Total ≈ 75 contando ambos viewports por escenario como uno.

## 7. Verificación (resumen operativo de §8 del prompt)

- **Arnés:** chromium de `/opt/pw-browsers` (o `PARITY_CHROMIUM`), flags `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --force-color-profile=srgb --font-render-hinting=none` (+ `--disable-gpu-rasterization`, D-28); `reducedMotion: 'reduce'`, `es-AR`, `America/Argentina/Buenos_Aires`, `page.clock.setFixedTime('2026-09-27T21:00:00-03:00')`, mouse quieto, `animations: 'disabled'`, `caret: 'hide'`. Listo = `document.fonts.ready` + `html[data-planet]` ∈ {ready, fallback} + red en reposo + 2 frames + sin `aria-busy`.
- **Umbrales por frame:** píxeles fuera del planeta ≤ 0,30 % escritorio / ≤ 0,50 % móvil (pixelmatch 0,1, sin AA, planeta enmascarado con `drawRect()`); planeta ≤ 2 % y presente en ambos; alto ±4 px y misma cantidad de frames; árbol de accesibilidad idéntico (main, nav, diálogo); estilos computados de `probes` iguales ±0,5 px; 0 errores de consola/página, 0 desbordes horizontales, 0 axe serios/críticos; mockup contra sí mismo ≤ 0,01 %.
- **Salidas:** `tools/parity/out/<run>/{report.html,summary.json,judge/*.png}` (ignorado).
- **Juez visual:** `visual-judge` con `tools/parity/JUDGE_RUBRIC.md`; 8 áreas × 0..2; aprueba con ≥ 14/16 y ningún 0; no puede aprobar lo que una métrica marcó como fallido.
- **Golden:** `backend/tests/golden/` contra `fixtures/golden.json`, sin filtro y por mesa 2..5. Invariantes: filtrar nunca escribe; reproducir ELO = historial guardado; pedir logros dos veces da lo mismo.
- **Funcional:** Playwright en `frontend/e2e/` (login válido e inválido, navegación, registrar solo con teclado en 390 y 1440, editar, eliminar, ceremonia y saltar, filtros por pantalla, ficha de jugador); vitest por componente; pytest por endpoint y servicio con casos borde (empates, desempate por M€, 2 jugadores, sin Turmoil, filtros sin partidas).
- **Revisión:** subagente `pr-reviewer` → JSON `{verdict, findings[]}` publicado como revisión COMMENT; frenan solo blocker/major; hasta 3 rondas.

## 8. Comandos de verificación por fase

| Fase | Comando |
|---|---|
| todas | `bash scripts/dev/gates.sh all` (desde F15) |
| F15 | `bash scripts/dev/gates.sh backend && bash scripts/dev/bootstrap.sh` |
| F16 | `node tools/parity/run.mjs --self --phase 16 && node tools/fixtures/export.mjs --check && bash scripts/dev/gates.sh backend` |
| F17–F18 | `node tools/parity/run.mjs --self --phase NN` + `export.mjs --check` |
| F19, F26–F35 | `bash scripts/dev/gates.sh all && node tools/parity/run.mjs --phase NN` |
| F20–F25 | `bash scripts/dev/gates.sh backend` (golden incluido) |
| F36 | todo lo anterior + presupuestos |
