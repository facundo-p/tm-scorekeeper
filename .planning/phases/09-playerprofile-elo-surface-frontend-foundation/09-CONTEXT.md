# Phase 9: PlayerProfile ELO surface + frontend foundation - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Hacer visible el sistema ELO ya existente en backend dentro del **PlayerProfile**, y sentar las bases tipadas (`api/elo.ts`, DTOs sincronizados) que consumirán las phases 10–12. El usuario ve en el perfil de cada jugador: ELO actual, delta de la última partida, peak rating histórico y rank entre jugadores activos.

**Incluye:**
- Backend: nuevo endpoint `GET /players/{player_id}/elo-summary` (route + service + mapper + tests)
- Frontend types: sincronizar `PlayerResponseDTO.elo` y `PlayerProfileDTO.elo` con backend (drift fix); agregar `EloChangeDTO` (mirror) y `PlayerEloSummaryDTO` (nuevo)
- Frontend api: nuevo `src/api/elo.ts` con `getEloSummary(playerId)`
- Frontend componente: nuevo `EloSummaryCard` reusable
- Frontend page: integrar `EloSummaryCard` en el Stats tab del `PlayerProfile`

**No incluye (explícitamente fuera de scope):**
- `getEloChanges(gameId)` wrapper → Phase 10
- `PlayerEloHistoryDTO` / `EloHistoryPointDTO` / `getEloHistory()` → Phase 11 (usa el endpoint que define Phase 8)
- Mini-sparkline en el card → diferido (PROF-FUT-01)
- Tier names / chess.com-style chrome → out of scope a nivel proyecto

</domain>

<decisions>
## Implementation Decisions

### Entrega de datos backend

- **D-01:** Endpoint dedicado **`GET /players/{player_id}/elo-summary`**, NO se extiende `PlayerProfileDTO`. Mantiene el contrato del profile actual intacto y permite reuso futuro (Phase 12 leaderboard puede consumirlo).
- **D-02:** Shape de respuesta:
  ```json
  {
    "current_elo": 1523,
    "peak_elo": 1612,
    "last_delta": -23,
    "rank": { "position": 3, "total": 8 }
  }
  ```
- **D-03:** Peak se calcula **on-the-fly** desde la tabla `EloChange`: `max(elo_after) WHERE player_id = X`. Sin migración, sin riesgo de drift, recalcula automáticamente tras `_recompute_elo_from`.
- **D-04:** Rank scope = **solo jugadores activos** (`is_active = true`). `position` = índice 1-based del player en la lista de activos ordenada por `players.elo DESC`. `total` = count de activos.
- **D-05:** Empty shape (jugador con 0 partidas): endpoint siempre devuelve **200**, payload con `current_elo: 1000` (seed), `peak_elo: null`, `last_delta: null`, `rank: null`. Sin 404, frontend ramifica solo por `null`.
- **D-06:** Tie-breaking de rank cuando dos players empatan en ELO: orden estable por `player_id` (determinístico, no dense rank). Documentar en docstring del service.
- **D-07:** Endpoint vive en `backend/routes/players_routes.py` (no se crea `elo_routes.py` nuevo aún) porque está scoped a un player. El `EloService` agrega un método `get_summary_for_player(player_id)`.

### Jerarquía visual ELO

- **D-08:** Layout = **hero card separada** ARRIBA del `statsCard` existente. ELO grande + delta inline en línea principal; peak y rank en sub-línea secundaria. El grid de 3 tiles (Partidas / Ganadas / Win rate) queda intacto debajo.
- **D-09:** Color tokens = **reusar existentes**. Verde positivo = token verde existente (revisar `index.css`; si no hay, agregar `--color-success` derivado del verde de `recordItem`). Negativo = `--color-error`. Cero/muted = `--color-text-muted`. Sin `--color-elo-*` dedicados.
- **D-10:** Componente reusable = **`EloSummaryCard`** en `src/components/EloSummaryCard/EloSummaryCard.tsx` + `.module.css`. Props: `{ summary: PlayerEloSummaryDTO }`. Maneja internamente todos los nullables.
- **D-11:** Sintaxis del delta = **solo número con signo** (`+23` / `-12` / `±0`), sin texto auxiliar visible. PERO se mantiene `aria-label="Cambio de ELO en la última partida: +23"` en el span del delta como baseline a11y.

### Alcance de la foundation

- **D-12:** Foundation **parcial pragmática**. Phase 9 entrega:
  - `frontend/src/types/index.ts`:
    - Agregar `elo: number` a `PlayerResponseDTO` (drift fix backend)
    - Agregar `elo: number` a `PlayerProfileDTO` (drift fix backend)
    - Agregar `EloChangeDTO` (mirror exacto del backend `schemas/elo.py`)
    - Agregar `PlayerEloSummaryDTO` (nuevo, con campos nullable)
  - `frontend/src/api/elo.ts` (nuevo): solo `getEloSummary(playerId)`
- **D-13:** Phase 10 será dueño de `getEloChanges(gameId)`. Phase 11 será dueño de `PlayerEloHistoryDTO`/`EloHistoryPointDTO`/`getEloHistory()`. No se especulan contratos en Phase 9.
- **D-14:** Fetch en `PlayerProfile.tsx` = **inline en useEffect**, extendiendo el `Promise.all([getPlayerProfile, getPlayers])` existente a 3 calls (`getEloSummary` agregado). Catch separado para que un fallo en el summary no rompa el render del profile completo. Sin hook nuevo (`useEloSummary` no se crea).
- **D-15:** No correr `/sync-enums` skill al final del phase — Phase 9 toca DTOs, no enums.

### Edge cases

- **D-16:** `peak_elo == current_elo` → mostrar `Pico: 1612 · actual` (sufijo "actual" como reconocimiento positivo). Si `peak_elo == null` (0 partidas) → ocultar línea de peak.
- **D-17:** `last_delta == 0` → mostrar `±0` con `--color-text-muted`. Si `last_delta == null` (0 partidas) → ocultar span del delta.
- **D-18:** Rank = mostrar siempre que `rank != null` (incluido caso `#1 de 1` cuando solo hay 1 activo). Jugador inactivo viendo su perfil → backend devuelve `rank: null` porque scope = activos → frontend oculta.
- **D-19:** Refresh strategy post-edición = **on-mount-refetch** (sin cache, sin localStorage). Mantiene la disciplina arquitectónica de la app (PITFALLS.md Pitfall 1). Phase 9 NO introduce React Query / SWR / cache layer alguno.
- **D-20:** Scope estricto: nada de mini-sparkline, tier names, o cualquier otra extra dentro del card. Lo que no esté en PROF-01..PROF-04 queda diferido.

### Claude's Discretion

- Naming de subarchivos/funciones del backend (`get_summary_for_player` vs `compute_elo_summary` etc.).
- Tamaños de tipografía exactos del card hero (usar tokens `--font-size-xl/2xl`).
- Estructura HTML interna del card (qué es `<h2>`, `<span>`, etc.) siempre que cumpla a11y.
- Tests específicos a escribir (cubrir los nullables, peak==current, delta=0, rank null).

### Folded Todos

Ninguno — `gsd-tools todo match-phase 9` devolvió 0 matches.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificaciones del milestone

- `.planning/PROJECT.md` — sección "Current Milestone: v1.1 Visualización de ELO en Frontend"
- `.planning/REQUIREMENTS.md` — PROF-01, PROF-02, PROF-03, PROF-04 (los 4 que cierra Phase 9)
- `.planning/ROADMAP.md` — Phase 9 success criteria #1–#5

### Research v1.1

- `.planning/research/SUMMARY.md` — sección "Phase A — Type contracts and API wrapper" + "Phase B — PlayerProfile current-ELO badge" (research base de este phase)
- `.planning/research/PITFALLS.md` — Pitfall 1 (no-cache discipline, load-bearing para D-19) y Pitfall 6 case 1 (0-games player muestra `—`, no `1000`)
- `.planning/research/ARCHITECTURE.md` — convención `api → hooks → pages/components → types` y patrón de fetching

### Backend (existente)

- `backend/schemas/elo.py` — `EloChangeDTO` ya definido; mirror exacto en frontend types
- `backend/schemas/player.py` — `PlayerResponseDTO.elo: int` y `PlayerCreatedResponseDTO`
- `backend/schemas/player_profile.py` — `PlayerProfileDTO.elo: int`, `PlayerStatsDTO`, `PlayerGameSummaryDTO`
- `backend/services/elo_service.py` — `_recompute_elo_from` (basis de Pitfall 1, contexto del recompute cascade)
- `backend/repositories/elo_repository.py` — patrón existente de queries sobre `EloChange`
- `backend/routes/players_routes.py` — donde aterriza el nuevo endpoint `GET /players/{id}/elo-summary`
- `backend/services/container.py` — patrón de DI para registrar nuevos métodos del service

### Frontend (existente)

- `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` — page que se modifica; el `Promise.all` del `useEffect` se extiende
- `frontend/src/pages/PlayerProfile/PlayerProfile.module.css` — design tokens y patrón de `.statsCard` / `.statsGrid`
- `frontend/src/types/index.ts` — DTOs (drift fix + nuevos contratos)
- `frontend/src/api/players.ts` — convención de wrappers (`getPlayerProfile`, `getPlayers`)
- `frontend/src/api/client.ts` — `api.get/post/...` HTTP wrappers
- `frontend/src/index.css` — design tokens (`--color-error`, `--color-text-muted`, spacing, font-size, border-radius)
- `frontend/src/hooks/useGames.ts:83-96` — patrón retry-once que NO se aplica acá pero referenciar para entender el silent-catch idiom

### Codebase intel

- `.planning/codebase/CONVENTIONS.md` — naming (PascalCase componentes, camelCase utils, DTO suffix)
- `.planning/codebase/STRUCTURE.md` — dónde van archivos nuevos (`src/components/EloSummaryCard/`, `src/api/elo.ts`)

### Restricciones de proyecto

- `.claude/CLAUDE.md` — reglas de trabajo (planning obligatorio, función >20 líneas → refactor, sin inline styling, mobile-first)
- `CLAUDE.md` (root del repo si existe) — testing protocol; NUNCA correr pytest en host (memory `feedback_never_run_pytest_locally`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`Promise.all` en `PlayerProfile.tsx:27`** — patrón existente para fetches paralelos al mount; extender a 3 calls.
- **`statsCard` / `statsGrid` CSS pattern** — design tokens probados con border-radius, color-surface, gap; el `EloSummaryCard` los hereda visualmente.
- **`api/client.ts`** — `api.get<T>(path)` ya tipado con genéricos; `getEloSummary` lo usa directo.
- **`backend/schemas/elo.py:EloChangeDTO`** — ya definido; el frontend lo refleja sin redefinirlo en backend.
- **`PlayersRepository` y `EloRepository`** — repos existentes; el nuevo método del service compone sobre ellos sin agregar repo nuevo.
- **`ALL_EVALUATORS` / `services/container.py` pattern** — `EloService` se obtiene desde container; el nuevo método del service se invoca igual desde el route.

### Established Patterns

- **No client cache** — confirmar en code review que ningún cambio introduce React Query / SWR / `localStorage` para ELO. Pitfall 1 es load-bearing.
- **CSS Modules + design tokens** — sin inline styles, sin colores hardcoded, todo via `--color-*` y `--spacing-*`.
- **DTO mirror back-to-front** — los frontend types reflejan exactamente los backend Pydantic schemas; cuando hay drift se considera bug.
- **Service singleton via container** — `EloService` ya está en `services/container.py`; el método nuevo se agrega ahí, no se crea otro container.
- **Mapper layer** — entre service (domain) y route (DTO) existe un mapper; agregar `elo_summary_mapper.py` si la transformación es no-trivial, o inline si es 1:1.
- **`tests/integration/`** vs `tests/e2e/` — el endpoint nuevo va con tests de integración, no e2e.

### Integration Points

- **Frontend route** — `PlayerProfile` ya está montado en `App.tsx` bajo `/players/:playerId`; nada que tocar de routing.
- **Backend route registry** — `players_routes.py` se importa en `main.py`; agregar el endpoint ahí no requiere cambio de wiring.
- **EloService** — ya está registrado en `services/container.py`; el método nuevo `get_summary_for_player` se expone desde la misma instancia.
- **Stats tab del profile** — `EloSummaryCard` se inserta como `<section>` ANTES del `<section className={styles.statsCard}>` actual.

</code_context>

<specifics>
## Specific Ideas

- Usuario quiere visual prominente para el ELO (eligió hero card en vez de tile compacto) — refleja que el ELO es un "first-class citizen" del perfil, no un dato secundario.
- Estilo minimalista en el delta (`+23` sin texto auxiliar) — se valora la limpieza por sobre la explicación verbosa. Mantener el card aireado.
- "Pico: 1612 · actual" cuando peak == current → hay apetito de celebrar logros del jugador (consistente con la cultura de logros del v1.0).
- Foundation pragmática (no foundation completa upfront) → el usuario prefiere evitar contratos especulativos; cada phase trae sus propios DTOs cuando los necesita.
- Tie-breaking por `player_id` no es decisión explícita del usuario sino claudal — debe documentarse para que no sorprenda.

</specifics>

<deferred>
## Deferred Ideas

- **Mini-sparkline del ELO en el card** (PROF-FUT-01) — requeriría history endpoint (Phase 8) + recharts (Phase 12). Acoplaría Phase 9 a otras phases. Diferir a v1.2.
- **Banda de incertidumbre Glicko-2** (PROF-FUT-02) — requiere migrar el sistema de rating; out of charter del milestone.
- **Tier names visuales (Bronze/Silver/Gold)** — anti-feature ya documentada en REQUIREMENTS.md "Out of Scope".
- **Tooltip/hover en el delta** explicando "vs partida anterior" — el usuario eligió el camino minimalista; reconsiderar en v1.2 si hay feedback de ambigüedad.
- **`useEloSummary` hook** — el patrón inline se considera suficiente; promover a hook si Phase 12 necesita reusar el fetch en el leaderboard.
- **Persistir `players.peak_elo`** como columna — descartado por el riesgo de drift; reconsiderar solo si el cómputo on-the-fly muestra problemas de performance (improbable a este N).
- **Endpoint `/elo/leaderboard` global** — no necesario para Phase 9 (rank se computa en el summary del player). Útil potencialmente para Phase 12 si la performance del repeat-call no escala.

### Reviewed Todos (not folded)

Ninguno — `todo match-phase 9` devolvió 0 matches.

</deferred>

---

*Phase: 09-playerprofile-elo-surface-frontend-foundation*
*Context gathered: 2026-04-29*
