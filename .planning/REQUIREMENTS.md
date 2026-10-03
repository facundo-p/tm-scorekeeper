# Requirements: Terraforming Mars Stats — v2.0 «Archivo de Terraformación»

**Defined:** 2026-10-03
**Core Value:** La app real se ve y funciona como el mockup del rediseño, con datos reales y estadísticas que sirven al grupo.

Plan completo: `.planning/v2.0/SPEC.md`. Los requisitos de v1.1 quedan archivados en `.planning/milestones/v1.1-REQUIREMENTS.md`.

## v2.0 Requirements

### Ejecución y verificación

- [ ] **INFRA-01**: El plan v2.0 (SPEC, RUNBOOK, LEDGER, DECISIONS), GSD y el tablero de GitHub existen y son la fuente de verdad
- [ ] **INFRA-02**: `scripts/dev/bootstrap.sh`, `gates.sh` y `pr-size.sh` preparan el entorno de forma idempotente y corren los gates
- [ ] **INFRA-03**: pytest aborta con código 2 si la base de `DATABASE_URL` no termina en `_test`; CI usa `tm_scorekeeper_test`
- [ ] **INFRA-04**: `requirements.txt` con versiones fijas y `sqlalchemy>=2.0,<2.1` documentado
- [ ] **INFRA-05**: `requirements-dev.txt` (pytest, httpx, requests) instalado por CI
- [ ] **PAR-01**: Arnés `tools/parity/` compara mockup y app (píxeles, alto, a11y, estilos, consola, axe) con umbrales por frame
- [ ] **PAR-02**: `tools/fixtures/export.mjs` genera `fixtures/seed.json` y `fixtures/golden.json` desde el mockup; `--check` en CI
- [ ] **PAR-03**: `backend/scripts/load_fixture.py` carga la semilla con ids en bases `_test`/`_parity` en menos de 30 s
- [ ] **PAR-04**: Tests golden en `backend/tests/golden/` comparan endpoints contra `golden.json` sin filtro y por mesa
- [ ] **PAR-05**: Manifiesto `enabled.yaml` habilita claves golden por fase; posiciones y ELO desde F16

### Especificación (mockup)

- [ ] **MOCK-01**: El mockup refleja las decisiones de contenido: récords/logros oficiales, castellano, Spacefarer, orden del archivo, favoritos, filtros de récords, error de login, 404, salir en móvil
- [ ] **MOCK-02**: `docs/redesign/SEMANTICS.md` documenta D-04..D-08, D-15, filtros, equidad y temporadas; `derive.js` lo implementa
- [ ] **MOCK-03**: El mockup expone ganchos de comparación: `data-scroll-root`, `data-planet-slot`, `__TM_PLANET__.drawRect()`, reduced-motion, `?demo=`, reloj inyectable, links reales, `#galeria`
- [ ] **MOCK-04**: El mockup tiene filtro de mesa por pantalla, ELO de mesa, logros por mesa, paneles por tamaño de mesa y equidad
- [ ] **MOCK-05**: La temporada del mockup ordena por promedio con categoría, mesa, mínimo de 3 y campeón D-15
- [ ] **MOCK-06**: El mockup permite editar, eliminar y repetir la ceremonia desde el informe
- [ ] **MOCK-07**: Golden, capturas, README del rediseño y artifact actualizados

### Base visual, shell y efectos

- [ ] **VIS-01**: ESLint (typescript-eslint, react-hooks, jsx-a11y, regla D-09) corre en CI
- [ ] **VIS-02**: Tokens, base y tipografías locales del mockup portados a `frontend/src/styles/`; íconos en `src/ui/icons`
- [ ] **VIS-03**: Átomos con CSS Modules, Sheet accesible y estados de carga/error/vacío con tests
- [ ] **VIS-04**: Dominio `src/domain/{catalog,labels,format,cssVars}.ts` y galería de comparación
- [ ] **SHELL-01**: Shell con escenario, cielo, barra superior, rail en escritorio y dock con FAB en móvil, con container queries
- [ ] **SHELL-02**: Rutas D-02 con redirecciones, carga diferida, 404 y error boundary
- [ ] **SHELL-03**: Cliente HTTP con Bearer, timeout, abort y errores tipados; TanStack Query en hooks
- [ ] **SHELL-04**: `MesaFilter`, `useMesaParam()` y aviso reutilizables
- [ ] **FX-01**: Planeta WebGL2 en TS (`PlanetStage` + `PlanetSlot`) en chunk aparte con respaldo CSS; estrellas y confeti
- [ ] **FX-02**: Instrumentos SVG que reemplazan a recharts

### Seguridad, integridad y rendimiento

- [ ] **SEC-01**: Login real (JWT) y toda la API protegida salvo `/health` y `/auth/login`; límite de intentos
- [ ] **SEC-02**: El frontend actual se autentica contra la API y cierra sesión ante un 401
- [ ] **SEC-03**: Validación compartida de partidas en crear/editar, UNIQUE(game_id, player_id) y 409
- [ ] **SEC-04**: `POST /admin/recompute` autenticado con `compare_digest`; se retira el GET
- [ ] **TXN-01**: Unidad de trabajo y advisory lock en escrituras y recálculos; UNIQUE en historial de ELO
- [ ] **TXN-02**: `games.created_at` con backfill que respeta el orden actual
- [ ] **TXN-03**: `selectinload` e índices; `/games/` en ≤ 3 queries
- [ ] **TXN-04**: `winners()` único, récords con todos los poseedores, Spacefarer, 404 coherentes y migraciones probadas en CI

### Estadísticas, mesa y temporadas

- [ ] **STAT-01**: Filtro único de subconjunto (`GameSubset`, `StatsContext`, dependencia `game_subset`)
- [ ] **STAT-02**: ELO de mesa por reproducción; reproducir todo da el historial guardado
- [ ] **STAT-03**: Récords v2: 7 nuevos, co-poseedores, historial, contexto roto/cerca, `GET /records/{code}/history`
- [ ] **STAT-04**: Desbloqueos de logros por nivel en `achievement_unlocks`
- [ ] **STAT-05**: Recálculo de logros dentro de crear/editar/borrar; lectura repetible; D-13
- [ ] **STAT-06**: 6 logros nuevos con íconos
- [ ] **STAT-07**: Vista de logros por mesa que nunca escribe
- [ ] **STAT-08**: Color de cubo y fecha de alta de jugadores
- [ ] **STAT-09**: `GET /games/summaries` con filtros
- [ ] **STAT-10**: `GET /games/{id}/report`; crear/editar devuelven el informe; DELETE recalcula
- [ ] **STAT-11**: `GET /players/{id}/insights` con equidad, ADN, mapas, corporaciones, forma, favoritos y por mesa
- [ ] **STAT-12**: Ranking con equidad, cara a cara, bitácora y resumen del grupo
- [ ] **SEAS-01**: Temporadas por promedio con categoría, mesa, mínimo 3 y campeones

### Pantallas

- [ ] **SCR-01**: Acceso con error real y horizonte de Marte
- [ ] **SCR-02**: Inicio con héroe de temporada, carrera por promedio, consejo, bitácora y reglas
- [ ] **SCR-03**: Partidas con filtros, orden (#65), calendario y vacío
- [ ] **SCR-04**: Informe de partida con editar y eliminar
- [ ] **SCR-05**: Registrar en 5 pasos con borrador
- [ ] **SCR-06**: Registrar operable con teclado y modo edición (PUT)
- [ ] **SCR-07**: Ceremonia con secuencia, saltar y repetir
- [ ] **SCR-08**: Ranking con filtros, ELO de mesa, equidad, cara a cara y por mesa
- [ ] **SCR-09**: Alta y edición de jugadores con color de cubo
- [ ] **SCR-10**: Perfil: cabecera, lecturas y favoritos (#66, #35, #38)
- [ ] **SCR-11**: Perfil: pestañas con filtro, por mesa y equidad
- [ ] **SCR-12**: Récords con historia y filtros de mesa, mapa y expansión (#37)
- [ ] **SCR-13**: Logros con vista por mesa y escalera de niveles

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
| INFRA-01 | Phase 15 | Pending |
| INFRA-02 | Phase 15 | Pending |
| INFRA-03 | Phase 15 | Pending |
| INFRA-04 | Phase 15 | Pending |
| INFRA-05 | Phase 15 | Pending |
| PAR-01 | Phase 16 | Pending |
| PAR-02 | Phase 16 | Pending |
| PAR-03 | Phase 16 | Pending |
| PAR-04 | Phase 16 | Pending |
| PAR-05 | Phase 16 | Pending |
| MOCK-01 | Phase 17 | Pending |
| MOCK-02 | Phase 17 | Pending |
| MOCK-03 | Phase 17 | Pending |
| MOCK-04 | Phase 18 | Pending |
| MOCK-05 | Phase 18 | Pending |
| MOCK-06 | Phase 18 | Pending |
| MOCK-07 | Phase 18 | Pending |
| VIS-01 | Phase 19 | Pending |
| VIS-02 | Phase 19 | Pending |
| VIS-03 | Phase 19 | Pending |
| VIS-04 | Phase 19 | Pending |
| SHELL-01 | Phase 26 | Pending |
| SHELL-02 | Phase 26 | Pending |
| SHELL-03 | Phase 26 | Pending |
| SHELL-04 | Phase 26 | Pending |
| FX-01 | Phase 27 | Pending |
| FX-02 | Phase 27 | Pending |
| SEC-01 | Phase 20 | Pending |
| SEC-02 | Phase 20 | Pending |
| SEC-03 | Phase 20 | Pending |
| SEC-04 | Phase 20 | Pending |
| TXN-01 | Phase 21 | Pending |
| TXN-02 | Phase 21 | Pending |
| TXN-03 | Phase 21 | Pending |
| TXN-04 | Phase 21 | Pending |
| STAT-01 | Phase 22 | Pending |
| STAT-02 | Phase 22 | Pending |
| STAT-03 | Phase 22 | Pending |
| STAT-04 | Phase 23 | Pending |
| STAT-05 | Phase 23 | Pending |
| STAT-06 | Phase 23 | Pending |
| STAT-07 | Phase 23 | Pending |
| STAT-08 | Phase 24 | Pending |
| STAT-09 | Phase 24 | Pending |
| STAT-10 | Phase 24 | Pending |
| STAT-11 | Phase 25 | Pending |
| STAT-12 | Phase 25 | Pending |
| SEAS-01 | Phase 25 | Pending |
| SCR-01 | Phase 28 | Pending |
| SCR-02 | Phase 28 | Pending |
| SCR-03 | Phase 29 | Pending |
| SCR-04 | Phase 29 | Pending |
| SCR-05 | Phase 30 | Pending |
| SCR-06 | Phase 30 | Pending |
| SCR-07 | Phase 31 | Pending |
| SCR-08 | Phase 32 | Pending |
| SCR-09 | Phase 32 | Pending |
| SCR-10 | Phase 33 | Pending |
| SCR-11 | Phase 33 | Pending |
| SCR-12 | Phase 34 | Pending |
| SCR-13 | Phase 34 | Pending |
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
