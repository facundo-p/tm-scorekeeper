# Phase 14: ELO evolution chart in player profile stats - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Agregar un chart de evolución de ELO al perfil del jugador. El chart muestra la historia completa del ELO del jugador (single-player, sin filtros) embebido dentro de la `EloSummaryCard` existente. También reordena el Stats tab para que las estadísticas generales aparezcan primero y el card de ELO segundo.

**Incluye:**
- Extender `getEloHistory()` en `src/api/elo.ts` con parámetros opcionales (`player_ids`)
- Agregar prop `showLegend` (default `true`) a `EloLineChart` para suprimir Legend en single-player
- Fetch del historial del jugador individual al montar el Stats tab
- Embeber `EloLineChart` dentro de `EloSummaryCard`, debajo del hero row (ELO + delta + peak/rank)
- Reordenar el Stats tab: statsCard (Partidas/Ganadas/Win rate + historial) primero, EloSummaryCard+chart segundo

**No incluye:**
- Filtro de fecha en el perfil
- Nuevo componente chart (se reutiliza EloLineChart)
- Nuevo tab "ELO"
- Mini-sparkline (se usa chart completo con ejes)

</domain>

<decisions>
## Implementation Decisions

### Scope del chart
- **D-01:** Chart completo con ejes X/Y (no mini-sparkline). El usuario ya conoce esta UI del Ranking. Recharts está instalado. El chart muestra el ELO del jugador a lo largo del tiempo con tooltip de click, mismo patrón que el Ranking.
- **D-02:** Sin Legend — en el contexto del perfil el jugador ya sabe de quién son los datos. Suprimir Legend libera espacio para el chart.

### Placement y orden en el Stats tab
- **D-03:** El Stats tab reordena su contenido: statsCard (Partidas/Ganadas/Win rate) + historial de partidas van **primero**. La EloSummaryCard (con chart embebido) va **segunda**. Cambio de posición en `PlayerProfile.tsx` — el `{eloSummary && ...}` se mueve a después de los stats existentes.
- **D-04:** El chart se embebe **dentro** de `EloSummaryCard`, debajo del `subRow` (peak/rank). El card expande para contener tanto el resumen numérico (hero row + sub-row) como el chart de evolución.
- **D-05:** Carga **eager** al montar el Stats tab — fetch del historial en el mismo `useEffect` del perfil (o un `useEffect` secundario). Dataset pequeño (un jugador), latencia mínima. No lazy loading.

### Reutilización de EloLineChart
- **D-06:** Reusar `EloLineChart` existente pasando `[{ player_id, player_name, points }]` (array de 1 elemento). No se crea un componente nuevo.
- **D-07:** Agregar prop `showLegend?: boolean` a `EloLineChart` (default `true` para backward compat con Ranking). `EloSummaryCard` pasa `showLegend={false}`.

### Fetch del historial
- **D-08:** Extender `getEloHistory()` en `src/api/elo.ts` para aceptar parámetros opcionales:
  ```ts
  export function getEloHistory(params?: { playerIds?: string[]; from?: string }): Promise<PlayerEloHistoryDTO[]>
  ```
  Cuando `playerIds` está presente, se pasan como query params `player_ids=id1,id2`. En `PlayerProfile` se llama con `getEloHistory({ playerIds: [playerId] })`. Backward compatible — `Ranking.tsx` llama `getEloHistory()` sin params (sin cambio).
- **D-09:** El fetch del historial en `PlayerProfile` es un catch-separado (igual que el EloSummary — D-14 de Phase 9): si falla, el chart se oculta pero el resto del perfil renderiza. State: `eloHistory: PlayerEloHistoryDTO[] | null`.

### Empty state del chart
- **D-10:** Si el jugador tiene 0 partidas (`eloHistory` devuelve array vacío o `eloHistory` es null), el chart se oculta por completo (no se renderiza el chart dentro de EloSummaryCard). `EloSummaryCard` ya maneja el caso 0-partidas mostrando `—` en el hero row.

### Claude's Discretion
- Altura del chart dentro de EloSummaryCard (sugerencia: 220px mobile, 280px desktop — más compacto que el Ranking que usa 280/400px).
- Si el fetch del historial se agrega al `Promise.all` existente o como un `useEffect` secundario separado. Recomendación: `useEffect` secundario (no bloquea el render del perfil si el historial tarda).
- Nombre exacto del state/setter en `PlayerProfile.tsx` (`eloHistory` / `setEloHistory`).
- Tests a escribir (vitest: verificar que `EloLineChart` no renderiza Legend cuando `showLegend={false}`; verificar que `getEloHistory` serializa `player_ids` correctamente como query param).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 14 scope
- `.planning/ROADMAP.md` §"Phase 14: ELO evolution chart in player profile stats"
- `.planning/PROJECT.md` §"Current Milestone: v1.1"

### Componentes y tipos existentes
- `frontend/src/components/EloLineChart/EloLineChart.tsx` — componente a reusar; agregar `showLegend` prop aquí
- `frontend/src/components/EloSummaryCard/EloSummaryCard.tsx` — card a extender con el chart
- `frontend/src/components/EloSummaryCard/EloSummaryCard.module.css` — CSS del card
- `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` — page a modificar (reorden + nuevo fetch)
- `frontend/src/api/elo.ts` — `getEloHistory()` a extender con params opcionales
- `frontend/src/types/index.ts` — `PlayerEloHistoryDTO`, `EloHistoryPointDTO`

### Patterns establecidos (Phase 12)
- `.planning/phases/12-ranking-line-chart-leaderboard/12-CONTEXT.md` — D-01 (recharts pinned), D-03 (playerColor), D-04 (tooltip click), D-05 (Y-axis domain), D-07 (alturas responsive)
- `frontend/src/index.css` — design tokens (`--color-surface`, `--color-text-muted`, spacing)
- `.planning/codebase/CONVENTIONS.md` — naming conventions

### Pattern de fetch aislado (Phase 9)
- `.planning/phases/09-playerprofile-elo-surface-frontend-foundation/09-CONTEXT.md` — D-14 (fetch inline con catch separado), D-19 (no cache)
- `frontend/src/api/elo.ts` — `getEloSummary()` como referencia de patrón de fetch silente

### Backend endpoint
- `backend/routes/elo_routes.py` — `GET /elo/history` con params `player_ids` (list) y `from` (date string)
- `backend/schemas/elo.py` — `PlayerEloHistoryDTO` shape

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`EloLineChart`** (`src/components/EloLineChart/EloLineChart.tsx`): componente recharts completo con tooltip click, paleta determinística, `playerColor()` exportado. Solo necesita prop `showLegend` opcional.
- **`EloSummaryCard`** (`src/components/EloSummaryCard/EloSummaryCard.tsx`): renderiza hero row + subRow. El chart se agrega bajo `subRow` dentro del mismo `<section>`.
- **`getEloHistory()`** (`src/api/elo.ts`): actualmente sin params. Extender con `params?: { playerIds?: string[] }`.
- **`playerColor(playerId)`**: exportado desde `EloLineChart.tsx` — se puede importar directamente si se necesita el color del jugador en el card.
- **`Promise.all` + catch separado** (`PlayerProfile.tsx:33-44`): patrón para agregar el nuevo fetch del historial.

### Established Patterns
- **No cache** — `getEloHistory()` se llama fresco en cada mount. El comentario en `api/elo.ts` explica el rationale (Pitfall 1).
- **CSS Modules + design tokens** — `EloSummaryCard.module.css` y `EloLineChart.module.css` son la referencia.
- **Catch silente** — fetch de historial aislado: si falla, `eloHistory` queda null y el chart no renderiza (como `eloSummary` en Phase 9).

### Integration Points
- **`PlayerProfile.tsx`**: reordenar `{eloSummary && <EloSummaryCard>}` al final del bloque `stats` (después de statsCard y gameList). Agregar state `eloHistory`. Pasar `eloHistory` a `EloSummaryCard` como prop opcional.
- **`EloSummaryCard`**: agregar prop `history?: PlayerEloHistoryDTO[]`. Cuando presente y no vacío, renderizar `<EloLineChart data={history} showLegend={false} />` al final del card.
- **`EloLineChart`**: agregar `showLegend?: boolean` (default `true`). Cuando `false`, omitir `<Legend />`.

</code_context>

<specifics>
## Specific Ideas

- El reordenamiento del Stats tab (stats primero, ELO después) es una decisión de UX del usuario — los stats generales son el "contexto base" y el ELO es un insight adicional.
- El chart embebido en la card mantiene cohesión visual: el usuario ve el ELO actual + contexto histórico en un solo card, sin saltar entre secciones.
- `showLegend` como prop (no `hideLegend`) es la convención booleana estándar de React.
- El fetch del historial con `player_ids=[playerId]` evita traer todos los jugadores — más eficiente y más correcto semánticamente para un perfil individual.

</specifics>

<deferred>
## Deferred Ideas

- **Filtro de fecha en el perfil** — No scope. Si el usuario quiere explorar un rango temporal, usa la página Ranking.
- **Nuevo componente PlayerEloChart** — Descartado en favor de reutilizar EloLineChart. Reconsiderar si el API de EloLineChart se vuelve muy compleja.
- **URL state para el chart del perfil** — No scope (no hay filtros que preservar).
- **IntersectionObserver / lazy load del chart** — Descartado. Dataset pequeño, no hay beneficio de performance.

</deferred>

---

*Phase: 14-elo-evolution-chart-in-player-profile-stats*
*Context gathered: 2026-05-02*
