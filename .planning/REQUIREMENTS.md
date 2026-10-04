# Requirements: Terraforming Mars Stats — v2.0 «Archivo de Terraformación»

**Defined:** 2026-10-03
**Core Value:** La app real se ve y funciona como el mockup del rediseño, con datos reales y estadísticas que sirven al grupo.

Plan completo: `.planning/v2.0/SPEC.md`. Los requisitos de v1.1 quedan archivados en `.planning/milestones/v1.1-REQUIREMENTS.md`.

## v2.0 Requirements

### Ejecución y verificación

- [x] **INFRA-01**: El plan v2.0 (SPEC, RUNBOOK, LEDGER, DECISIONS), GSD y el tablero de GitHub existen y son la fuente de verdad
- [x] **INFRA-02**: `scripts/dev/bootstrap.sh`, `gates.sh` y `pr-size.sh` preparan el entorno de forma idempotente y corren los gates
- [x] **INFRA-03**: pytest aborta con código 2 si la base de `DATABASE_URL` no termina en `_test`; CI usa `tm_scorekeeper_test`
- [x] **INFRA-04**: `requirements.txt` con versiones fijas y `sqlalchemy>=2.0,<2.1` documentado
- [x] **INFRA-05**: `requirements-dev.txt` (pytest, httpx, requests) instalado por CI
- [x] **PAR-01**: Arnés `tools/parity/` compara mockup y app (píxeles, alto, a11y, estilos, consola, axe) con umbrales por frame
- [x] **PAR-02**: `tools/fixtures/export.mjs` genera `fixtures/seed.json` y `fixtures/golden.json` desde el mockup; `--check` en CI
- [x] **PAR-03**: `backend/scripts/load_fixture.py` carga la semilla con ids en bases `_test`/`_parity` en menos de 30 s
- [x] **PAR-04**: Tests golden en `backend/tests/golden/` comparan endpoints contra `golden.json` sin filtro y por mesa
- [x] **PAR-05**: Manifiesto `enabled.yaml` habilita claves golden por fase; posiciones y ELO desde F16

### Especificación (mockup)

- [x] **MOCK-01**: El mockup refleja las decisiones de contenido: récords/logros oficiales, castellano, Spacefarer, orden del archivo, favoritos, filtros de récords, error de login, 404, salir en móvil
- [x] **MOCK-02**: `docs/redesign/SEMANTICS.md` documenta D-04..D-08, D-15, filtros, equidad y temporadas; `derive.js` lo implementa
- [x] **MOCK-03**: El mockup expone ganchos de comparación: `data-scroll-root`, `data-planet-slot`, `__TM_PLANET__.drawRect()`, reduced-motion, `?demo=`, reloj inyectable, links reales, `#galeria`
- [x] **MOCK-04**: El mockup tiene filtro de mesa por pantalla, ELO de mesa, logros por mesa, paneles por tamaño de mesa y equidad
- [x] **MOCK-05**: La temporada del mockup ordena por promedio con categoría, mesa, mínimo de 3 y campeón D-15
- [x] **MOCK-06**: El mockup permite editar, eliminar y repetir la ceremonia desde el informe
- [x] **MOCK-07**: Golden, capturas, README del rediseño y artifact actualizados

### Base visual, shell y efectos

- [x] **VIS-01**: ESLint (typescript-eslint, react-hooks, jsx-a11y, regla D-09) corre en CI
- [x] **VIS-02**: Tokens, base y tipografías locales del mockup portados a `frontend/src/styles/`; íconos en `src/ui/icons`
- [x] **VIS-03**: Átomos con CSS Modules, Sheet accesible y estados de carga/error/vacío con tests
- [x] **VIS-04**: Dominio `src/domain/{catalog,labels,format,cssVars}.ts` y galería de comparación
- [x] **SHELL-01**: Shell con escenario, cielo, barra superior, rail en escritorio y dock con FAB en móvil, con container queries
- [x] **SHELL-02**: Rutas D-02 con redirecciones, carga diferida, 404 y error boundary
- [x] **SHELL-03**: Cliente HTTP con Bearer, timeout, abort y errores tipados; TanStack Query en hooks
- [x] **SHELL-04**: `MesaFilter`, `useMesaParam()` y aviso reutilizables
- [x] **FX-01**: Planeta WebGL2 en TS (`PlanetStage` + `PlanetSlot`) en chunk aparte con respaldo CSS; estrellas y confeti
- [x] **FX-02**: Instrumentos SVG que reemplazan a recharts

### Seguridad, integridad y rendimiento

- [x] **SEC-01**: Login real (JWT) y toda la API protegida salvo `/health` y `/auth/login`; límite de intentos
- [x] **SEC-02**: El frontend actual se autentica contra la API y cierra sesión ante un 401
- [x] **SEC-03**: Validación compartida de partidas en crear/editar, UNIQUE(game_id, player_id) y 409
- [x] **SEC-04**: `POST /admin/recompute` autenticado con `compare_digest`; se retira el GET
- [x] **TXN-01**: Unidad de trabajo y advisory lock en escrituras y recálculos; UNIQUE en historial de ELO
- [x] **TXN-02**: `games.created_at` con backfill que respeta el orden actual
- [x] **TXN-03**: `selectinload` e índices; `/games/` en ≤ 3 queries
- [x] **TXN-04**: `winners()` único, récords con todos los poseedores, Spacefarer, 404 coherentes y migraciones probadas en CI

### Estadísticas, mesa y temporadas

- [x] **STAT-01**: Filtro único de subconjunto (`GameSubset`, `StatsContext`, dependencia `game_subset`)
- [x] **STAT-02**: ELO de mesa por reproducción; reproducir todo da el historial guardado
- [x] **STAT-03**: Récords v2: 7 nuevos, co-poseedores, historial, contexto roto/cerca, `GET /records/{code}/history`
- [x] **STAT-04**: Desbloqueos de logros por nivel en `achievement_unlocks`
- [x] **STAT-05**: Recálculo de logros dentro de crear/editar/borrar; lectura repetible; D-13
- [x] **STAT-06**: 6 logros nuevos con íconos
- [x] **STAT-07**: Vista de logros por mesa que nunca escribe
- [x] **STAT-08**: Color de cubo y fecha de alta de jugadores
- [x] **STAT-09**: `GET /games/summaries` con filtros
- [x] **STAT-10**: `GET /games/{id}/report`; crear/editar devuelven el informe; DELETE recalcula
- [x] **STAT-11**: `GET /players/{id}/insights` con equidad, ADN, mapas, corporaciones, forma, favoritos y por mesa
- [x] **STAT-12**: Ranking con equidad, cara a cara, bitácora y resumen del grupo
- [x] **SEAS-01**: Temporadas por promedio con categoría, mesa, mínimo 3 y campeones

### Pantallas

- [x] **SCR-01**: Acceso con error real y horizonte de Marte
- [x] **SCR-02**: Inicio con héroe de temporada, carrera por promedio, consejo, bitácora y reglas
- [x] **SCR-03**: Partidas con filtros, orden (#65), calendario y vacío
- [x] **SCR-04**: Informe de partida con editar y eliminar
- [x] **SCR-05**: Registrar en 5 pasos con borrador
- [x] **SCR-06**: Registrar operable con teclado y modo edición (PUT)
- [x] **SCR-07**: Ceremonia con secuencia, saltar y repetir
- [x] **SCR-08**: Ranking con filtros, ELO de mesa, equidad, cara a cara y por mesa
- [x] **SCR-09**: Alta y edición de jugadores con color de cubo
- [x] **SCR-10**: Perfil: cabecera, lecturas y favoritos (#66, #35, #38)
- [x] **SCR-11**: Perfil: pestañas con filtro, por mesa y equidad
- [x] **SCR-12**: Récords con historia y filtros de mesa, mapa y expansión (#37)
- [x] **SCR-13**: Logros con vista por mesa y escalera de niveles

### Cierre

- [ ] **CLOSE-01**: Se borra el frontend viejo, recharts, lucide y tokens viejos
- [ ] **CLOSE-02**: Se retira la API deprecada
- [ ] **CLOSE-03**: Presupuestos: axe, JS inicial ≤ 100 kB gzip, chequeo en CI
- [ ] **CLOSE-04**: Documentación actualizada (READMEs, skills, CLAUDE.md)
- [ ] **CLOSE-05**: Checklist de despliegue v2.0
- [ ] **CLOSE-06**: Cierre del milestone, tablero y PRs absorbidos

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 15 | Complete |
| INFRA-02 | Phase 15 | Complete |
| INFRA-03 | Phase 15 | Complete |
| INFRA-04 | Phase 15 | Complete |
| INFRA-05 | Phase 15 | Complete |
| PAR-01 | Phase 16 | Complete |
| PAR-02 | Phase 16 | Complete |
| PAR-03 | Phase 16 | Complete |
| PAR-04 | Phase 16 | Complete |
| PAR-05 | Phase 16 | Complete |
| MOCK-01 | Phase 17 | Complete |
| MOCK-02 | Phase 17 | Complete |
| MOCK-03 | Phase 17 | Complete |
| MOCK-04 | Phase 18 | Complete |
| MOCK-05 | Phase 18 | Complete |
| MOCK-06 | Phase 18 | Complete |
| MOCK-07 | Phase 18 | Complete |
| VIS-01 | Phase 19 | Complete |
| VIS-02 | Phase 19 | Complete |
| VIS-03 | Phase 19 | Complete |
| VIS-04 | Phase 19 | Complete |
| SHELL-01 | Phase 26 | Complete |
| SHELL-02 | Phase 26 | Complete |
| SHELL-03 | Phase 26 | Complete |
| SHELL-04 | Phase 26 | Complete |
| FX-01 | Phase 27 | Complete |
| FX-02 | Phase 27 | Complete |
| SEC-01 | Phase 20 | Complete |
| SEC-02 | Phase 20 | Complete |
| SEC-03 | Phase 20 | Complete |
| SEC-04 | Phase 20 | Complete |
| TXN-01 | Phase 21 | Complete |
| TXN-02 | Phase 21 | Complete |
| TXN-03 | Phase 21 | Complete |
| TXN-04 | Phase 21 | Complete |
| STAT-01 | Phase 22 | Complete |
| STAT-02 | Phase 22 | Complete |
| STAT-03 | Phase 22 | Complete |
| STAT-04 | Phase 23 | Complete |
| STAT-05 | Phase 23 | Complete |
| STAT-06 | Phase 23 | Complete |
| STAT-07 | Phase 23 | Complete |
| STAT-08 | Phase 24 | Complete |
| STAT-09 | Phase 24 | Complete |
| STAT-10 | Phase 24 | Complete |
| STAT-11 | Phase 25 | Complete |
| STAT-12 | Phase 25 | Complete |
| SEAS-01 | Phase 25 | Complete |
| SCR-01 | Phase 28 | Complete |
| SCR-02 | Phase 28 | Complete |
| SCR-03 | Phase 29 | Complete |
| SCR-04 | Phase 29 | Complete |
| SCR-05 | Phase 30 | Complete |
| SCR-06 | Phase 30 | Complete |
| SCR-07 | Phase 31 | Complete |
| SCR-08 | Phase 32 | Complete |
| SCR-09 | Phase 32 | Complete |
| SCR-10 | Phase 33 | Complete |
| SCR-11 | Phase 33 | Complete |
| SCR-12 | Phase 34 | Complete |
| SCR-13 | Phase 34 | Complete |
| CLOSE-01 | Phase 35 | Pending |
| CLOSE-02 | Phase 35 | Pending |
| CLOSE-03 | Phase 35 | Pending |
| CLOSE-04 | Phase 36 | Pending |
| CLOSE-05 | Phase 36 | Pending |
| CLOSE-06 | Phase 36 | Pending |

**Coverage:**
- v2.0 requirements: 67 total
- Mapped to phases: 67 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-10-03*
