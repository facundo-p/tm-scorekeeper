# Phase 10: End-of-game unified summary modal with ELO section - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactorizar `AchievementModal` en `EndOfGameSummaryModal` que se abre en **toda** partida terminada, con 4 secciones compuestas: Resultados, Records, Logros, ELO. La página `GameRecords` queda como cáscara mínima — solo header + botón Volver.

**Incluye:**
- Nuevo componente `EndOfGameSummaryModal` con 4 secciones: Resultados (posiciones + pts + MC), Records rotos, Logros desbloqueados, ELO por jugador (posición, elo_before → elo_after, delta con color)
- Nuevo API wrapper `getEloChanges(gameId)` en `src/api/elo.ts` (backend `GET /games/{id}/elo` ya existe)
- Refactor de `GameRecords.tsx`: sacar las secciones Resultados + Records del inline; queda solo header "¡Partida guardada!" + botón "Volver al inicio"
- Eliminación de `AchievementModal` (reemplazado por el modal unificado)

**No incluye (explícitamente fuera de scope):**
- `PlayerEloHistoryDTO` / `getEloHistory()` → Phase 11
- Ranking page → Phase 11–12
- Botón para reabrir el modal después de cerrarlo
- Rediseño del Modal base

</domain>

<decisions>
## Implementation Decisions

### Estructura del modal y GameRecords

- **D-01:** `GameRecords.tsx` post-refactor contiene solo el header "¡Partida guardada!" + botón "Volver al inicio". Toda la información de la partida vive en `EndOfGameSummaryModal`.
- **D-02:** `EndOfGameSummaryModal` tiene **4 secciones en orden**: Resultados, Records, Logros, ELO. `AchievementModal` se elimina completamente (no se mantiene como componente residual).
- **D-03:** El modal se abre **siempre** al cargar GameRecords (no condicionado a si hay achievements). Se cierra una sola vez; no hay botón de reabrir. Una vez cerrado, la página queda con solo el header + botón.

### Secciones vacías y errores

- **D-04:** Secciones con datos vacíos muestran un mensaje neutro:
  - Records sin ruptura → "Ningún record nuevo en esta partida."
  - Logros sin desbloqueo → "Ningún logro desbloqueado."
  - ELO: si `fetchEloChanges` falla 2 veces (retry-once, mirroring `fetchAchievements`), la sección ELO se **omite silenciosamente** + `console.warn`. Records y Logros siguen renderizándose. (Alineado con SC-4 del ROADMAP.)
- **D-05:** Las secciones Resultados y ELO siempre tienen datos (la partida tiene al menos 2 jugadores). Solo Records y Logros pueden estar vacíos → mostrar mensaje vacío.

### Sección ELO — visual

- **D-06:** Cada fila ELO muestra: posición (`#1`, `#2`, …) + nombre del jugador + `elo_before → elo_after` + delta con signo y color.
- **D-07:** Sintaxis delta: **solo número con signo** (`+23` / `-12` / `±0`) — igual que Phase 9 (D-11). Color: `--color-success` positivo, `--color-error` negativo, `--color-text-muted` cero.
- **D-08:** Posición viene de `GameResultDTO.results[].position` (ya disponible en GameRecords). Join por `player_id` con `EloChangeDTO` para armar cada fila.

### API — nuevo wrapper

- **D-09:** `getEloChanges(gameId): Promise<EloChangeDTO[]>` en `src/api/elo.ts`. Llama `GET /games/{game_id}/elo` (ya existe en backend). Sin cache, sin estado persistido (consistente con D-19 de Phase 9).
- **D-10:** Retry-once en el fetch de ELO: igual que `fetchAchievements` en `useGames.ts` (try/catch + retry + console.warn). Se encapsula en `fetchEloChanges` expuesto desde `useGames`.

### Claude's Discretion

- Nombre exacto de subcomponentes internos del modal (ej: `EloSection`, `RecordsSection`, `AchievementsSection`).
- Estructura HTML interna de cada fila ELO (qué es `<tr>` vs `<div>` vs `<li>`), siempre que cumpla mobile-first y CSS Modules.
- Tamaños de tipografía de posición, elo_before/after, delta dentro de la fila.
- Timing exacto de la apertura del modal: si espera al Promise.all de los 4 fetches o abre con skeleton/spinner mientras cargan.
- Nombre de clases CSS del modal unificado.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificaciones del milestone

- `.planning/REQUIREMENTS.md` — POST-01, POST-02, POST-03 (los 3 que cierra Phase 10)
- `.planning/ROADMAP.md` — Phase 10 success criteria SC-1 a SC-5
- `.planning/PROJECT.md` — sección "Current Milestone: v1.1 Visualización de ELO en Frontend"

### Contexto de phases anteriores

- `.planning/phases/09-playerprofile-elo-surface-frontend-foundation/09-CONTEXT.md` — D-09 (color tokens ELO), D-11 (sintaxis delta), D-13 (getEloChanges es Phase 10), D-19 (no client cache)

### Frontend (existente — se modifica)

- `frontend/src/pages/GameRecords/GameRecords.tsx` — página que se refactoriza; sacar Resultados + Records del inline
- `frontend/src/components/AchievementModal/AchievementModal.tsx` — se elimina y reemplaza por EndOfGameSummaryModal
- `frontend/src/components/Modal/Modal.tsx` — base reutilizable para el modal unificado
- `frontend/src/hooks/useGames.ts` — patrón `fetchAchievements` retry-once que se replica en `fetchEloChanges`
- `frontend/src/api/elo.ts` — donde se agrega `getEloChanges(gameId)`
- `frontend/src/types/index.ts` — `EloChangeDTO` ya definido; `GameResultDTO` ya definido con `.results[].position`
- `frontend/src/index.css` — tokens: `--color-success`, `--color-error`, `--color-text-muted`

### Backend (consume)

- `backend/routes/games_routes.py:94-100` — `GET /{game_id}/elo` endpoint que retorna `list[EloChangeDTO]` (ya existe)
- `backend/schemas/elo.py` — `EloChangeDTO` shape de referencia

### Research y codebase intel

- `.planning/research/PITFALLS.md` — Pitfall 1 (no-cache discipline, load-bearing para no introducir React Query)
- `.planning/codebase/CONVENTIONS.md` — naming (PascalCase componentes, DTO suffix)
- `.planning/codebase/STRUCTURE.md` — dónde van archivos nuevos (`src/components/EndOfGameSummaryModal/`)
- `.claude/CLAUDE.md` — reglas: planning obligatorio, función >20 líneas → refactor, sin inline styling, mobile-first, CSS Modules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`Modal` component** (`src/components/Modal/Modal.tsx`) — base con overlay, close button, Escape key handler. `EndOfGameSummaryModal` lo wrappea igual que `AchievementModal`.
- **`AchievementBadgeMini`** — ya renderiza badges por jugador; la sección Logros del nuevo modal lo reutiliza igual.
- **`RecordsSection`** (`src/components/RecordsSection/RecordsSection.tsx`) — ya renderiza records comparison; la sección Records del modal la importa directamente.
- **`useGames.fetchAchievements`** — patrón retry-once con console.warn; `fetchEloChanges` sigue exactamente este patrón.
- **`GameResultDTO.results[].position`** — ya disponible en el fetch de `getGameResults`; se pasa al modal para armar el join con EloChangeDTO.
- **`EloChangeDTO`** en `types/index.ts` — tiene `player_id, player_name, elo_before, elo_after, delta`; la posición se cruza con `GameResultDTO`.

### Established Patterns

- **CSS Modules + design tokens** — sin inline styles, colores vía `--color-*`, spacing vía `--spacing-*`.
- **No client cache** — todos los fetches son on-mount, sin React Query/SWR/localStorage.
- **Silent-catch idiom** — datos no críticos (achievements, ELO) usan try/catch silencioso para no bloquear el render principal.
- **Componentes pequeños** — si algún sub-componente supera 20 líneas, refactorizar como componente independiente.

### Integration Points

- **`GameRecords.tsx`** — ya tiene los estados `records`, `result`, `players`, `achievements`. Se agrega `eloChanges` como quinto estado. El Promise.all se extiende o se mantiene el patrón de fetches paralelos separados.
- **`AchievementModal` → delete** — borrar `src/components/AchievementModal/AchievementModal.tsx` + `.module.css` + tests.
- **`useGames`** — agregar `fetchEloChanges(gameId)` al hook expuesto. No crear hook nuevo separado.

</code_context>

<specifics>
## Specific Ideas

- El usuario eligió que la página GameRecords quede completamente limpia (solo header + botón), no un híbrido. Esto es una simplificación agresiva — el modal es la forma canónica de ver el resumen de la partida.
- Las 4 secciones están en orden fijo: Resultados → Records → Logros → ELO. No hay reordenamiento dinámico.
- La maqueta elegida para la sección ELO: `#1 Juan   1500 → 1523  +23` — formato lineal por jugador, con posición como primer elemento de cada fila.
- Secciones vacías muestran texto neutro en lugar de omitirse (salvo ELO en caso de error técnico, donde se omite silenciosamente).

</specifics>

<deferred>
## Deferred Ideas

- **Botón "Ver resumen" para reabrir el modal** — el usuario prefirió UX simple (no reabrir). Reconsiderar si hay feedback de frustración.
- **Scroll interno en el modal** — si el contenido es largo (muchos jugadores, muchos records), el Modal base necesitará overflow-y: auto. Claude puede decidir si hace falta.
- **Animación de aparición del modal** — diferido, no mencionado en requirements.
- **Gamification del resumen** (sonidos, confetti) — fuera de scope del proyecto.

### Reviewed Todos (not folded)

Ninguno — `todo match-phase 10` no retornó matches relevantes.

</deferred>

---

*Phase: 10-end-of-game-unified-summary-modal-with-elo-section*
*Context gathered: 2026-04-29*
