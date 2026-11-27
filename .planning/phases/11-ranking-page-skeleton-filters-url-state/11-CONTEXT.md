# Phase 11: Ranking page skeleton + filters + URL state - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Crear la página `/ranking`, accesible desde una nueva tile en Home, que monta el shell con dos filtros (MultiSelect de jugadores + "Desde" como input nativo de fecha) y persiste el estado de filtros en URL search params. **El chart y la leaderboard NO se construyen en esta phase** (van en Phase 12); Phase 11 entrega el wiring completo (route + tile + filtros + fetch + URL sync + skeleton del chart + empty state) sobre el cual Phase 12 monta la visualización.

**Incluye:**
- Routing: nueva `<Route path="/ranking">` envuelta en `<ProtectedRoute>` en `App.tsx`
- Home: nueva tile "Ranking — Evolución de ELO" (📈) habilitada, después de "Logros"
- Frontend types: `EloHistoryPointDTO` y `PlayerEloHistoryDTO` (mirror del schema backend Phase 8)
- Frontend api: extender `src/api/elo.ts` con `getEloHistory()` (sin params; ver D-A3)
- Frontend lib: `src/lib/rankingFilters.ts` con `parseRankingParams` / `serializeRankingParams` (funciones puras, testables)
- Frontend hook: `useRankingFilters` que envuelve `useSearchParams` + parse/serialize + intersección con activos
- Frontend componente: `<RankingFilters>` (compone MultiSelect + input date + botón "Limpiar filtros")
- Frontend page: `src/pages/Ranking/Ranking.tsx` + CSS module — fetch al mount, filtrado client-side, skeleton del chart, empty state
- Tests: vitest verificando round-trip `YYYY-MM-DD` en TZ `America/Argentina/Buenos_Aires` (SC#5)

**No incluye (explícitamente fuera de scope):**
- Chart Recharts → Phase 12 (RANK-02)
- Leaderboard table → Phase 12 (RANK-05)
- Presets de rango temporal (Todo / 6m / 30d) → RANK-FUT-01 (v1.2)
- Tabla data-fallback a11y → RANK-FUT-02 (v1.2)
- Click-en-línea / focus mode → RANK-FUT-03 (v1.2)
- Eje X conmutable → RANK-FUT-04 (v1.2)

</domain>

<decisions>
## Implementation Decisions

### Arquitectura de filtros + URL sync (Área A)

- **D-A1:** Componente único **`<RankingFilters>`** en `src/components/RankingFilters/` que encapsula MultiSelect + input de fecha + botón "Limpiar filtros". Recibe props `{ players, fromDate, activePlayersOptions, onPlayersChange, onFromDateChange, onClear }` y dispara onChange combinados. Mantiene encapsulada la composición y permite reuso si una page futura necesitara los mismos filtros.

- **D-A2:** Lib auxiliar **`src/lib/rankingFilters.ts`** con dos funciones puras:
  - `parseRankingParams(search: URLSearchParams): { players: string[], from: string | null }`
  - `serializeRankingParams(state: { players: string[], from: string | null }): URLSearchParams`

  Estas funciones son testables aisladas (sin React, sin DOM). El test de SC#5 (round-trip `YYYY-MM-DD` en TZ Buenos Aires) ataca directamente estas funciones.

- **D-A3:** Hook **`useRankingFilters(activePlayerIds: string[])`** en `src/hooks/useRankingFilters.ts` que:
  1. Usa `useSearchParams()` de react-router-dom como fuente de verdad
  2. Llama `parseRankingParams` para hidratar el estado al mount y en cualquier cambio de URL
  3. Aplica intersección de `players` URL ∩ `activePlayerIds`; IDs desconocidos se descartan silenciosamente y, si hubo drop, **rewrite de la URL con la lista limpia** (SC#4)
  4. Si la intersección queda vacía → **fallback in-memory a `activePlayerIds`** sin escribir URL (SC#4 dice "default = all active" cuando empty; URL queda limpia, ver D-C1)
  5. Expone `{ players: string[], fromDate: string | null, setPlayers, setFromDate, clearAll }` — los setters serializan + escriben URL via `setSearchParams(..., { replace: true })`

- **D-A4:** **Filtros 100% client-side.** La page hace **un solo fetch** a `getEloHistory()` **sin params** al mount y guarda el dataset completo en state. MultiSelect (toggle players) y "Desde" filtran ese dataset **en memoria**. Cero re-fetch al cambiar filtros. Los params del backend (`from`, `player_ids` definidos en Phase 8) quedan **disponibles pero no consumidos** en este milestone — si tras Phase 12 vemos que nadie los usa, refactor cleanup en una phase posterior. Aceptable porque N de la app es chico (≤10 jugadores activos, partidas dispersas).

- **D-A5:** **URL = fuente de verdad** del estado de filtros (cumple RANK-06 / SC#3 / SC#4 / SC#6). Al mount, el hook lee URL → hidrata react state → se renderizan filtros y el dataset filtrado. Cualquier cambio de filtro escribe URL primero; el state se re-deriva en el siguiente render.

- **D-A6:** **`setSearchParams(..., { replace: true })`** en cada cambio de filtro: la URL se actualiza pero NO crea entrada en el historial del browser. El back-button vuelve a Home en lugar de pasear por estados intermedios de toggles.

- **D-A7:** **Players serializados como CSV ordenado**: `?players=id1,id2,id3` con sort estable por player_id (string compare). Coincide literal con SC#3 del ROADMAP. Determinístico: reordenar selección no cambia URL si el conjunto es el mismo. `serializeRankingParams` aplica el sort antes de joinear.

### Scope visual + fetch (Área B)

- **D-B1:** **Fetch ya en Phase 11.** `Ranking.tsx` invoca `getEloHistory()` (sin params) en `useEffect` al mount. El round-trip de fechas `YYYY-MM-DD` (SC#5) ya es verificable aquí; Phase 12 hereda data ya cargada y se enfoca en visualización pura.

- **D-B2:** **Fetch inline en `useEffect` con try/catch separado** (mismo idiom que `PlayerProfile` post-Phase 9 D-14). Sin `useEloHistory` hook propio. Catch dedicado: si falla `getEloHistory` la page muestra error sin que tire los filtros. UI muestra "No se pudo cargar el ranking" con botón "Reintentar" que dispara refetch (cambia un counter en state que está en el dep array del effect). Sin React Query / SWR / cache (Pitfall 1 sigue load-bearing).

- **D-B3:** **Fetch paralelo en `Promise.all`** análogo a `PlayerProfile`: `Promise.all([getEloHistory(), ...])`. La lista de jugadores activos viene del **`usePlayers` hook existente** (D-B4); el `Promise.all` solo necesita el history (usePlayers ya gestiona su propio fetch). Coordinación: la page espera ambos antes de calcular intersecciones.

- **D-B4:** **`usePlayers` hook existente** es la fuente de jugadores activos para el MultiSelect. Filtrar `is_active === true` en la page. Alternativa "derivar de `/elo/history`" descartada porque players activos con 0 partidas no aparecen en la response (RANK-03 dice "todos los activos", incluido 0 partidas → necesitan estar en el MultiSelect aunque no tengan línea).

- **D-B5:** Debajo de los filtros se renderiza un **skeleton del chart** — caja con altura fija (mobile-first, ej. `min-height: 280px`) y placeholder visual (líneas grises, animación `pulse` opcional o estático). Phase 12 reemplaza este bloque por el chart. El skeleton vive en `Ranking.module.css`; **no se crea un componente Skeleton genérico** (no hay reuso pendiente).

- **D-B6:** El skeleton se muestra en estado **"hay data filtrada (≥1 punto)"**. Si la data filtrada queda vacía → **empty state** (D-C5) en lugar del skeleton. Si está cargando → Spinner existente. Si error → bloque de error con "Reintentar".

### Defaults, "Limpiar filtros" y empty state (Área C)

- **D-C1:** **URL queda limpia cuando es default.** Entrar a `/ranking` sin params no rewritea la URL. El hook computa default in-memory (`players = todos los activos`, `fromDate = null`). El usuario solo ve params en la URL cuando él los puso. Coincide con SC#3: "default = all active players when URL is empty".

- **D-C2:** **0 players permitido.** Si el usuario destildea a todos, la URL queda `?players=` (key vacía) o sin la key (decisión: si players seleccionados es vacío explícito, escribir `?players=` sin valores para distinguir de "URL limpia"). El skeleton se reemplaza por empty state ("Selecciona al menos un jugador") con CTA "Limpiar filtros". **Comportamiento explícito y predecible**: nada de auto-revertir el último toggle ni caer al default mágicamente.

- **D-C3:** Distinción URL limpia vs URL con `?players=` vacío:
  - URL `/ranking` → `parseRankingParams` devuelve `{ players: [], from: null }` con flag interno "isDefault = true" → hook aplica default in-memory (todos los activos).
  - URL `/ranking?players=` → `{ players: [], from: null }` con `isDefault = false` → hook respeta la selección vacía explícita → empty state "Selecciona al menos un jugador".

  Implementación: `parseRankingParams` retorna `{ players, from, hasPlayersKey: search.has('players') }`. El hook decide entre default vs vacío explícito con `hasPlayersKey`.

- **D-C4:** **"Limpiar filtros" = reset total.** Borra ambos params (`players` y `from`); URL queda `/ranking` (limpia, vuelve a default in-memory de todos los activos). Botón se llama "Limpiar filtros" (plural). Cubre el empty state cualquiera sea su causa.

- **D-C5:** **Empty state implementado en Phase 11.** Como Phase 11 ya hace el fetch y filtra en memoria, ya sabemos cuándo no hay puntos en el rango. Se cierra SC#6. Empty state visual:
  - Mensaje: "Sin partidas en este rango" (cuando `from` excluye todo) o "Selecciona al menos un jugador" (cuando 0 players)
  - CTA: botón "Limpiar filtros" (D-C4)
  - Reusa estilo del empty state existente en otras pages si aplica; si no, layout simple con `--color-text-muted` + spacing tokens.

  La detección vive en la page: tras filtrar in-memory, si `filteredPoints.length === 0` o `selectedPlayers.length === 0` → empty state; de lo contrario → skeleton.

### Tile de Ranking en Home (Área D)

- **D-D1:** **Posición: después de "Logros"** en el array `navItems` de `Home.tsx`. Orden final: Jugadores → Cargar Partida → Partidas → Records → Logros → **Ranking**. Aparece como "lo último agregado", discoverable.

- **D-D2:** Tile config: `{ to: '/ranking', icon: '📈', title: 'Ranking', description: 'Evolución de ELO', disabled: false }`. Coincide con el wording del milestone ("Ranking — Evolución de ELO"); 📈 es preciso para line chart y no choca con 🏆 (Records) ni 🏅 (Logros).

- **D-D3:** **Habilitada ya en Phase 11.** SC#1 del ROADMAP exige que la tile navegue a `/ranking` en Phase 11. La page muestra filtros funcionando + skeleton del chart (o empty state). Cuando Phase 12 mergee, la misma URL pasa a mostrar chart + leaderboard sin tocar Home.

### Claude's Discretion

- Estilo visual del skeleton del chart (líneas grises, color exacto, si tiene animación `pulse` o es estático). Mobile-first, sin inline styling.
- Naming exacto de funciones internas del hook (`useRankingFilters` vs `useUrlRankingFilters`, etc.) y signatures finales.
- Decidir si `RankingFilters` recibe un único `onChange({ players, from })` combinado o handlers separados — depende de qué quede más limpio en `Ranking.tsx`.
- Estructura HTML interna del header de la page (`<h1>`, `<header>`, etc.) siempre que cumpla a11y básica.
- Si el botón "Reintentar" del estado de error vive dentro de la page o como helper extraído.
- Tests específicos a escribir: como mínimo cubrir `parseRankingParams`/`serializeRankingParams` round-trip (incluido test corriendo en TZ Buenos Aires forzado via `process.env.TZ` o `vi.setSystemTime`), intersección con drop de IDs desconocidos, fallback a default cuando intersección vacía, y "Limpiar filtros" reset total.
- Si la tile de Home reordena con un solo Edit o conviene refactor previo de `navItems` (por ejemplo extraer a constante con tipos).

### Folded Todos

Ninguno — no se ejecutó `gsd-tools todo match-phase 11` (skipped: bajo riesgo, scope acotado y bien delimitado por ROADMAP/REQUIREMENTS).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificaciones del milestone

- `.planning/PROJECT.md` — sección "Current Milestone: v1.1 Visualización de ELO en Frontend"
- `.planning/REQUIREMENTS.md` — RANK-01, RANK-03, RANK-04, RANK-06 (los 4 que cierra Phase 11)
- `.planning/ROADMAP.md` — Phase 11 success criteria #1–#6 (incluido el test de TZ Buenos Aires)
- `.planning/REQUIREMENTS.md` — sección "v2 / Future Requirements" (RANK-FUT-01..04 explícitamente diferidos)

### Research v1.1

- `.planning/research/SUMMARY.md` — research base del milestone
- `.planning/research/PITFALLS.md` — Pitfall 1 (no-cache discipline, load-bearing para D-A4 / D-B2)
- `.planning/research/ARCHITECTURE.md` — convención `api → hooks → pages/components → types` y patrón de fetching

### Backend (existente, definido por Phase 8)

- `backend/schemas/elo.py` — `EloHistoryPointDTO` y `PlayerEloHistoryDTO` (Phase 8 los crea); el frontend los refleja sin redefinir contratos
- `backend/routes/elo_routes.py` (o donde Phase 8 lo aterrice) — endpoint `GET /elo/history`; los params `from`/`player_ids` quedan disponibles aunque Phase 11 no los consuma
- `backend/services/elo_service.py` — `get_history` o equivalente

### Frontend (existente)

- `frontend/src/App.tsx` — agregar `<Route path="/ranking">` envuelto en `<ProtectedRoute>`
- `frontend/src/pages/Home/Home.tsx` — agregar tile en `navItems` (D-D1, D-D2)
- `frontend/src/pages/Home/Home.module.css` — design tokens del grid de tiles (referencia para layout consistente del header de Ranking)
- `frontend/src/components/MultiSelect/MultiSelect.tsx` — componente existente (reuso directo en `<RankingFilters>`)
- `frontend/src/components/MultiSelect/MultiSelect.module.css` — design tokens reusados
- `frontend/src/components/ProtectedRoute/ProtectedRoute.tsx` — wrapper de auth (reuso)
- `frontend/src/api/elo.ts` — donde se agrega `getEloHistory()` (Phase 9 dejó el archivo creado con `getEloSummary`)
- `frontend/src/api/client.ts` — `api.get/post/...` HTTP wrappers
- `frontend/src/types/index.ts` — donde se agregan `EloHistoryPointDTO` y `PlayerEloHistoryDTO` (Phase 9 D-13 explicitó que Phase 11 es el dueño de estos contratos)
- `frontend/src/hooks/usePlayers.ts` — fuente de jugadores activos (D-B4); revisar shape del retorno (`is_active` filter)
- `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` — patrón de fetch inline en `useEffect` con `Promise.all` y try/catch separado (D-14 Phase 9, idiom canónico)
- `frontend/src/index.css` — design tokens (`--color-error`, `--color-text-muted`, `--spacing-*`, `--font-size-*`, `--color-surface`)

### Phase anterior consumida

- `.planning/phases/09-playerprofile-elo-surface-frontend-foundation/09-CONTEXT.md` — D-13 (ownership de `PlayerEloHistoryDTO`/`EloHistoryPointDTO`/`getEloHistory()`), D-14 (fetch idiom inline + silent-catch), D-19 (no-cache discipline)
- `.planning/phases/08-backend-get-elo-history-endpoint/` — fuente del endpoint que Phase 11 consume (revisar PLAN/CONTEXT cuando estén disponibles)

### Codebase intel

- `.planning/codebase/CONVENTIONS.md` — naming (PascalCase componentes, camelCase utils, DTO suffix)
- `.planning/codebase/STRUCTURE.md` — dónde van archivos nuevos (`src/components/RankingFilters/`, `src/pages/Ranking/`, `src/lib/`, `src/hooks/`)

### Restricciones de proyecto

- `.claude/CLAUDE.md` — reglas de trabajo (planning obligatorio, función >20 líneas → refactor, sin inline styling, mobile-first, CSS Modules)
- Memory `feedback_never_run_pytest_locally` — Phase 11 es 100% frontend, pytest no aplica; tests con vitest

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`MultiSelect`** (`src/components/MultiSelect/`) — recibe `{ label, options: {value,label}[], value: string[], onChange }`. Encaja directamente con la API que `<RankingFilters>` necesita exponer hacia adentro.
- **`ProtectedRoute`** — wrapper de auth para envolver `/ranking` igual que el resto de pages autenticadas.
- **`usePlayers` hook** — ya gestiona fetch + cache de la lista de jugadores; filtrar `is_active === true` en la page (D-B4).
- **`api/elo.ts`** — archivo ya creado en Phase 9 con `getEloSummary`; `getEloHistory()` se agrega como segunda export (1 archivo, no 2).
- **`api/client.ts`** — `api.get<T>(path, params?)` ya tipado con genéricos; `getEloHistory()` lo invoca con `T = PlayerEloHistoryDTO[]`.
- **`Promise.all` idiom de `PlayerProfile`** (`useEffect` con fetch paralelo + try/catch separado, D-14 Phase 9) — patrón a replicar en `Ranking.tsx`.
- **`Home.tsx` `navItems` array** — agregar 1 entry; ya tiene `disabled` flag soportado (no aplica acá: tile habilitada).
- **`Spinner`** (`src/components/Spinner/`) — para loading state inicial.
- **Design tokens en `index.css`** — `--color-text-muted`, `--color-error`, `--color-surface`, spacing/radius/font-size — todo reusado en Ranking sin colors hardcoded.

### Established Patterns

- **No client cache** — Phase 11 NO introduce React Query / SWR / `localStorage`. Pitfall 1 es load-bearing. El refresh es siempre on-mount.
- **CSS Modules + design tokens** — sin inline styles, sin colores hardcoded; mobile-first.
- **DTO mirror back-to-front** — `EloHistoryPointDTO` y `PlayerEloHistoryDTO` reflejan exactamente los Pydantic schemas de Phase 8; cualquier drift se considera bug (igual que la corrección de Phase 9).
- **`api → hooks → pages/components → types`** — separación canónica de la app.
- **Fetch inline en `useEffect` con try/catch separado** — idiom canónico tras Phase 9 D-14; sin custom hooks por fetch.
- **Test naming** — `*.test.tsx` co-ubicado con el archivo bajo test; tests de lib puras en `src/lib/__tests__/` o co-ubicados.

### Integration Points

- **Routing** (`App.tsx`) — agregar `<Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />`. Sin cambios al wiring de auth.
- **Home navigation** (`Home.tsx`) — append a `navItems` array (D-D1). Sin cambios al CSS del grid (la tile hereda los estilos existentes).
- **Backend endpoint** — `GET /elo/history` definido por Phase 8; Phase 11 solo consume con request sin params.
- **Browser URL** — `useSearchParams` de `react-router-dom` (ya está en el árbol de providers vía `BrowserRouter` en `App.tsx`); no requiere setup adicional.

</code_context>

<specifics>
## Specific Ideas

- "Que el filtrado funcione todo en el front, sin hacer llamados al back; que quite y agregue cosas en el gráfico desde el front" — usuario priorizó UX latencia-cero por sobre eficiencia de payload. Backend params (`from`/`player_ids`) quedan disponibles pero no consumidos en este milestone (D-A4).
- "URL state sirve no para pedirle nada al back, sino como referencia misma del front, para que setee los filters en función a eso" — usuario internalizó la separación entre 'dónde vive el estado' (URL) y 'dónde corre el filtro' (cliente). La URL es shareable y sobrevive F5; el filtro es cliente.
- Skeleton del chart (no placeholder vacío con texto) sugiere apetito por ver progreso visual incluso antes de que Phase 12 mergee. Cuidar que el skeleton no parezca "roto" (mobile-first, altura razonable, líneas grises sutiles).
- 0 players permitido con empty state explícito en lugar de comportamiento mágico — usuario valora predictibilidad sobre "ayuda" automática.
- "Después refactorizamos si queda código sin usarse en el back" — usuario consciente de la deuda; cleanup explicitable como tarea futura.

</specifics>

<deferred>
## Deferred Ideas

- **Refactor cleanup de params backend (`from`, `player_ids` de `/elo/history`)** — si tras Phase 12 se confirma que ningún consumer los usa, eliminar los params del endpoint y del service. Phase nueva de cleanup en v1.2.
- **Skeleton component genérico** (`src/components/Skeleton/`) — descartado por YAGNI. Si Phase 12 u otra necesita skeletons en otros lados, promover el inline a componente reusable entonces.
- **`useEloHistory` hook** — descartado por D-B2 (idiom inline). Promover si Phase 12 u otra page necesita reusar el fetch.
- **Presets de rango temporal** (Todo / 6m / 30 días) — RANK-FUT-01, diferido a v1.2.
- **Tabla data-fallback accesible** para screen readers — RANK-FUT-02, diferido a v1.2 (Phase 12 puede sembrarla parcialmente con `<details><summary>` per ROADMAP Phase 12 SC#6).
- **Click-en-línea para resaltar jugador** (focus mode) — RANK-FUT-03, diferido a v1.2.
- **Eje X conmutable entre fecha y game-index** — RANK-FUT-04, diferido a v1.2.
- **Debounce de cambios de filtro** — descartado (D-A6 inmediato con `replace`); solo justificable si MultiSelect introduce typing-search en el futuro.
- **`?players=` con key repetida (`getAll`)** — descartado (D-A7); reconsiderar solo si SC#3 cambia.

### Reviewed Todos (not folded)

Ninguno revisado — `todo match-phase` no se ejecutó (scope chico y bien delimitado).

</deferred>

---

*Phase: 11-ranking-page-skeleton-filters-url-state*
*Context gathered: 2026-04-30*
