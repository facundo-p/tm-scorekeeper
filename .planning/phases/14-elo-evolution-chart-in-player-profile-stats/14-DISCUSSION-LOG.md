# Phase 14: ELO evolution chart in player profile stats - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 14-elo-evolution-chart-in-player-profile-stats
**Areas discussed:** Scope del chart, Placement y trigger, Reutilización de EloLineChart, Filtro de fecha

---

## Scope del chart

| Option | Description | Selected |
|--------|-------------|----------|
| Mini-sparkline (~80px, sin ejes) | Línea de tendencia compacta, sin etiquetas de ejes ni tooltip | |
| Chart completo con ejes | Like el de Ranking: ejes X/Y, tooltip de click, ~280px mobile | ✓ |
| Chart intermedio sin Legend | Chart completo con ejes pero sin leyenda | |

**User's choice:** Chart completo con ejes

| Option | Description | Selected |
|--------|-------------|----------|
| Sin Legend | Redundante en perfil single-player | ✓ |
| Con Legend | Consistencia con EloLineChart del Ranking | |

**User's choice:** Sin Legend — en el perfil ya sé qué jugador estoy viendo

---

## Placement y trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Sección separada debajo de EloSummaryCard | EloSummaryCard como resumen, chart como sección aparte | |
| Embebido dentro de EloSummaryCard | Chart dentro del card existente | ✓ (con reordenamiento) |
| Tab nuevo 'ELO' | Cuarto tab en el perfil | |

**User's choice:** Embebido dentro de EloSummaryCard. **Plus:** reordenar el Stats tab para que las stats generales (statsCard) vayan primero y el EloSummaryCard+chart vayan segundo.

| Option | Description | Selected |
|--------|-------------|----------|
| Chart al fondo del card | Resumen numérico arriba, chart abajo | ✓ |
| Chart arriba del card | Chart primero, stats numéricas abajo | |

**User's choice:** Chart al fondo del card — flujo natural: escanear primero los números, después el detalle visual

| Option | Description | Selected |
|--------|-------------|----------|
| Al montar el Stats tab (eager) | Fetch con el resto de datos del perfil | ✓ |
| Lazy al hacer scroll | IntersectionObserver | |

**User's choice:** Eager al montar el Stats tab

---

## Reutilización de EloLineChart

| Option | Description | Selected |
|--------|-------------|----------|
| Nuevo componente PlayerEloChart | Componente dedicado single-player | |
| Reusar EloLineChart con array de 1 elemento | Pasar [{player_id, player_name, points}] | ✓ |

**User's choice:** Reusar EloLineChart con array de 1 elemento

| Option | Description | Selected |
|--------|-------------|----------|
| Agregar prop showLegend | EloLineChart recibe `showLegend` (default true) | ✓ |
| Prop hideLegend o wrapper | Alternativa semántica | |

**User's choice:** Agregar prop `showLegend` — más idiomático en React

---

## Filtro de fecha

| Option | Description | Selected |
|--------|-------------|----------|
| No, muestra historia completa | Sin filtros en el perfil | ✓ |
| Sí, mismo input nativo type=date | Reutiliza patrón de DateFromFilter | |

**User's choice:** No hay filtro de fecha — historia completa del jugador

| Option | Description | Selected |
|--------|-------------|----------|
| Backend filter: getEloHistory({ playerIds }) | Trae solo datos del jugador | ✓ |
| Client-side: traer todo y filtrar | Consistente con Ranking pero ineficiente para un perfil | |

**User's choice:** Backend filter — extender `getEloHistory()` con params opcionales

---

## Claude's Discretion

- Altura del chart dentro del card (sugerencia: ~220px mobile, ~280px desktop)
- Si el historial se agrega al Promise.all existente o en useEffect separado
- Nombre exacto del state en PlayerProfile (eloHistory / setEloHistory)
- Tests específicos

## Deferred Ideas

- Filtro de fecha en el perfil — remitir al Ranking para exploración por rango
- Nuevo componente PlayerEloChart — descartado, reusar es suficiente
- Lazy load del chart — dataset pequeño, no hay beneficio
