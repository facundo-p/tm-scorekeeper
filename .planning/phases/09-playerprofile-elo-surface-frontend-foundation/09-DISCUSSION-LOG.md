# Phase 9: PlayerProfile ELO surface + frontend foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 09-playerprofile-elo-surface-frontend-foundation
**Areas discussed:** Entrega de datos backend, Jerarquía visual ELO, Alcance de la foundation, Edge cases peak/rank/delta

---

## Entrega de datos backend

### Q1: ¿Cómo entregamos peak rating, last delta y rank al PlayerProfile?

| Option | Description | Selected |
|--------|-------------|----------|
| Extender PlayerProfileDTO | Agregar campos peak_elo, last_delta, rank al PlayerProfileDTO. Una sola request. Acopla phase a backend changes en el profile. | |
| Endpoint dedicado /elo/summary | Crear GET /players/:id/elo-summary. Profile hace 2 requests en paralelo. Backend nuevo independiente, reusable. | ✓ |
| Derivar de Phase 8 + getPlayers | Esperar /elo/history (Phase 8) y derivar peak/last_delta en frontend. Rank desde getPlayers ordenado. Cero backend nuevo pero acopla a Phase 8. | |

**User's choice:** Endpoint dedicado /elo/summary
**Notes:** Mantiene contrato del profile actual intacto. Reusable por Phase 12 leaderboard.

### Q2: ¿Cómo calcula el backend el peak rating?

| Option | Description | Selected |
|--------|-------------|----------|
| On-the-fly desde EloChange | max(elo_after) sobre EloChange filtrando por player_id. Sin migración, sin drift. | ✓ |
| Persistido en players.peak_elo | Columna nueva, lectura O(1) pero acopla update al recompute cascade. | |

**User's choice:** On-the-fly desde EloChange
**Notes:** Recalcula automáticamente tras `_recompute_elo_from`.

### Q3: ¿Qué jugadores cuentan en el rank?

| Option | Description | Selected |
|--------|-------------|----------|
| Solo activos | Rank = posición entre players con is_active=true. Inactivos no aparecen en el rank. | ✓ |
| Todos los jugadores | Incluye inactivos en denominador y posición. Inactivo con ELO alto puede bloquear rank. | |

**User's choice:** Solo activos
**Notes:** Consistente con la convención de filtrar inactivos en otras vistas.

### Q4: ¿Qué devuelve el endpoint si el jugador tiene 0 partidas?

| Option | Description | Selected |
|--------|-------------|----------|
| Campos nullable | Endpoint 200, payload con current_elo: 1000, peak_elo/last_delta/rank: null. Frontend ramifica por null. | ✓ |
| 404 si no hay games | Sumar rama de error handling en frontend. Más semántico. | |
| Endpoint siempre con valores seed | Devuelve 1000/1000/0/{N,N}. Viola success criterion #4. | |

**User's choice:** Campos nullable
**Notes:** Contrato simple.

---

## Jerarquía visual ELO

### Q1: ¿Cómo presentamos ELO + delta + peak + rank en el Stats tab?

| Option | Description | Selected |
|--------|-------------|----------|
| Hero card separada | Card propia ARRIBA del statsCard existente. Stats tiles intactas debajo. | ✓ |
| ELO como 4to tile en grid | Agregar tile al grid actual. Pierde prominencia, satura el tile. | |
| Banda hero arriba del header | Banda full-width sin border. Rompe consistencia visual con resto de cards. | |

**User's choice:** Hero card separada
**Notes:** ELO es first-class citizen del perfil.

### Q2: ¿Tokens de color para el delta?

| Option | Description | Selected |
|--------|-------------|----------|
| Reusar tokens existentes | Verde existente / --color-error / --color-text-muted. | ✓ |
| Nuevos tokens dedicados ELO | --color-elo-up / --color-elo-down / --color-elo-neutral. | |

**User's choice:** Reusar tokens existentes
**Notes:** Mínima superficie nueva.

### Q3: ¿Reutilizamos el componente o queda inline?

| Option | Description | Selected |
|--------|-------------|----------|
| Componente EloBadge reusable (en pregunta de naming pasó a EloSummaryCard) | Crear componente reusable con props { current, delta, peak, rank }. | ✓ |
| Inline en PlayerProfile.tsx | Markup y CSS inline en la página. | |

**User's choice:** Componente reusable
**Notes:** Convención del codebase.

### Q4: ¿Cómo se comunica el contexto del delta?

| Option | Description | Selected |
|--------|-------------|----------|
| Texto auxiliar + a11y label | "desde última partida" como sub-línea + aria-label. | |
| Solo el número con signo | Minimalista estilo chess.com. Mantiene aria-label baseline a11y. | ✓ |
| Tooltip en hover/tap | Discoverable pero suma interactividad. | |

**User's choice:** Solo el número con signo
**Notes:** Apetito por minimalismo. aria-label se mantiene como baseline a11y aunque no fue elegido explícitamente.

---

## Alcance de la foundation

### Q1: ¿Cuánto de la suite de tipos/API skeletons aterriza en Phase 9?

| Option | Description | Selected |
|--------|-------------|----------|
| Foundation parcial pragmática | Sync DTOs existentes + agregar PlayerEloSummaryDTO + getEloSummary. Defiere history a Phase 11. | ✓ |
| Foundation completa upfront | Toda la suite de DTOs + 3 wrappers. Riesgo de especular el shape de history. | |
| Foundation mínima estricta | Solo PlayerEloSummaryDTO + getEloSummary. Drift de DTOs no se toca. | |

**User's choice:** Foundation parcial pragmática
**Notes:** Cero contratos especulativos.

### Q2: ¿Cómo se hace el fetch del elo-summary en el PlayerProfile?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline en useEffect | Promise.all extendido a 3 calls. Catch separado para no romper profile si summary falla. | ✓ |
| Nuevo hook useEloSummary | Reusable si Phase 12 quiere mostrar el badge. Suma archivo y abstracción. | |

**User's choice:** Inline en useEffect
**Notes:** Patrón existente del codebase.

### Q3: ¿Nombre del componente hero?

| Option | Description | Selected |
|--------|-------------|----------|
| EloSummaryCard | Refleja que es card con resumen completo. Consistente con AchievementCard. | ✓ |
| EloBadge | Nombre del research. "Badge" connota chip pequeño. | |
| EloHero | Literal con la decisión visual. Rompe patrón -Card. | |

**User's choice:** EloSummaryCard
**Notes:** Naming consistente con codebase.

### Q4: ¿Correr skill sync-enums al final del phase?

| Option | Description | Selected |
|--------|-------------|----------|
| No correr | Phase 9 toca DTOs no enums. No agrega valor. | ✓ |
| Correr como gate | Defensivo. | |

**User's choice:** No correr
**Notes:** No relevante.

---

## Edge cases peak / rank / delta

### Q1: peak_elo == current_elo → ¿qué muestra?

| Option | Description | Selected |
|--------|-------------|----------|
| Mostrar con badge 'actual' | "Pico: 1612 · actual". Reconocimiento positivo. | ✓ |
| Mostrar solo el número | "Pico: 1612" sin distinción. | |
| Ocultar peak cuando == current | Reduce ruido pero aparece/desaparece (jarring). | |

**User's choice:** Badge 'actual'
**Notes:** Cultura de celebrar logros (heredada de v1.0).

### Q2: last_delta == 0 → ¿qué muestra?

| Option | Description | Selected |
|--------|-------------|----------|
| Mostrar '±0' muted | --color-text-muted. Consistente con success criteria. | ✓ |
| Ocultar el delta cuando == 0 | Más limpio pero pierde info. | |

**User's choice:** ±0 muted

### Q3: Rank edge cases (1 activo, jugador inactivo)

| Option | Description | Selected |
|--------|-------------|----------|
| Mostrar siempre cuando games_played > 0 | "#1 de 1" si hay 1 activo. Inactivo viendo perfil → null → oculto. | ✓ |
| Ocultar rank cuando total < 2 | No tiene sentido un ranking de 1. Suma rama. | |
| Mostrar '—' como placeholder | Choca con success criterion #4. | |

**User's choice:** Mostrar siempre cuando rank != null

### Q4: ¿Mini-sparkline / extras opcionales?

| Option | Description | Selected |
|--------|-------------|----------|
| Estricto: solo PROF-01..PROF-04 | Mini-sparkline diferida. | ✓ |
| Incluir mini-sparkline ya | Acopla a Phase 8 + Phase 12. Rompe scope. | |

**User's choice:** Estricto

---

## Claude's Discretion

- Naming exacto de funciones backend (`get_summary_for_player`, `compute_elo_summary`, etc.)
- Tamaños de tipografía exactos del card hero (usar tokens existentes)
- Estructura HTML interna del card
- Tests específicos a escribir (cubrir todos los nullables)

## Deferred Ideas

- Mini-sparkline del ELO en el card → v1.2 (PROF-FUT-01)
- Banda de incertidumbre Glicko-2 → v1.2 (PROF-FUT-02)
- Tier names visuales → out of scope a nivel proyecto
- Tooltip/hover en el delta → reconsiderar en v1.2
- `useEloSummary` hook → promover si Phase 12 lo necesita
- Persistir `players.peak_elo` → solo si performance del cómputo on-the-fly falla
- Endpoint `/elo/leaderboard` global → potencial Phase 12
