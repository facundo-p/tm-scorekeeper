# Phase 11: Ranking page skeleton + filters + URL state - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 11-ranking-page-skeleton-filters-url-state
**Areas discussed:** Arquitectura de filtros + URL sync, Scope visual + fetch, Defaults / Limpiar / empty state, Tile en Home

---

## Selección de áreas grises

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Arquitectura de filtros + URL sync | Componente único / hook custom / serialización URL | ✓ |
| Scope visual + fetch de Phase 11 | Skeleton vs placeholder; fetch ya o diferido | ✓ |
| Defaults, "Limpiar filtros" y empty state | URL limpia vs materializada; reset semantics; empty state ownership | ✓ |
| Tile de Ranking en Home | Posición, ícono, label, habilitado | ✓ |

**User's choice:** las 4 áreas (multi-select)

---

## Arquitectura de filtros + URL sync

### ¿Cómo organizamos los componentes de filtro?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Componente único `<RankingFilters>` | Un solo componente que compone MultiSelect + input fecha + Limpiar | ✓ |
| Filtros sueltos inline en page | Sin envolver, más boilerplate en page | |
| MultiSelect inline + DateFromFilter reusable | Mixto: solo encapsula la fecha | |

### ¿Cómo se gestiona el sync URL ↔ estado?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Hook custom useRankingFilters | Hook envuelve useSearchParams | |
| useSearchParams directo en page | Toda la lógica en la page | |
| Hook + lib auxiliar (parseRankingParams/serializeRankingParams) | Funciones puras testables + hook delgado | ✓ |

### ¿Cuándo se reescribe la URL al cambiar un filtro? (primer pase)

**User's choice:** "Podemos diseñar lo de los filtros para que funcione todo en el front, sin hacer nuevos llamados al back?" — reorientó la conversación hacia filtros 100% client-side.

### ¿Cómo se serializa la lista de players en la URL? (primer pase)

**User's choice:** "Quiero que esto de los filtros funcione todo desde el front, sin hacer llamados al back. Que Quite y agrege cosas en el grpafico desde el front. Es posible? Después refactorizamos si queda código sin usarse en el back" — ratificó el shift client-side.

**Notas:** Claude separó conceptualmente "client-side filtering" (dónde corre el filtro) vs "URL state" (dónde vive el valor del filtro). Confirmó que ambos pueden coexistir: 1 fetch al mount + filtrado en memoria + URL como fuente de verdad del estado de filtros (compartible, sobrevive F5).

### Confirmación post-aclaración

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Mantener URL state (cumple RANK-06) | Filtros client-side + estado en URL params | ✓ |
| Diferir RANK-06 a v1.2 | Solo React state, mover RANK-06 a futuro | |

**User's choice + notas:** "Ok, si entendí bien, el URL state sirve no para pedirle nada al back, sino como referencia misma del front, para que setee los filters en función a eso. De ser así, vamos con la opción 1"

### ¿Cómo escribimos la URL al cambiar un filtro? (re-pregunta post-aclaración)

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Inmediato con replace (recomendado) | setSearchParams con { replace: true } | ✓ |
| Inmediato con push | Cada cambio agrega entrada al historial | |

### ¿Cómo serializamos los players en la URL? (re-pregunta post-aclaración)

| Opción | Descripción | Selected |
|--------|-------------|----------|
| `?players=id1,id2,id3` (CSV ordenado) | Sort estable; coincide con SC#3 | ✓ |
| `?players=id1&players=id2` (key repetida) | URLSearchParams getAll | |

---

## Scope visual + fetch de Phase 11

### ¿Ya hacemos el fetch a /elo/history en Phase 11 o se difiere a Phase 12?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Sí, fetch ya en Phase 11 (recomendado) | SC#5 verificable, Phase 12 enfocada en visual | ✓ |
| No, diferir fetch a Phase 12 | Phase 11 más chico pero deja SC#5 colgado | |

### ¿Qué se renderiza debajo de los filtros?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Placeholder "Próximamente: gráfico" | Mensaje neutro | |
| Skeleton / esqueleto del chart | Caja con altura + líneas grises | ✓ |
| Resumen mínimo de la data filtrada | Texto "X partidas, Y jugadores" | |
| Solo loading/empty/error states | Sin contenido principal | |

### ¿Cómo manejamos el silent-catch del fetch?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Inline en useEffect con try/catch separado | Mismo idiom que PlayerProfile (D-14 Phase 9) | ✓ |
| Custom hook useEloHistory | Encapsula fetch+loading+error en hook reusable | |

### ¿De dónde sale la lista de jugadores activos para el MultiSelect?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| usePlayers hook existente (recomendado) | Reuso de hook ya gestionado | ✓ |
| Derivar de los datos de /elo/history | Sin segundo fetch pero pierde players con 0 partidas | |

---

## Defaults, "Limpiar filtros" y empty state

### Cuando entrás a /ranking SIN params, ¿qué pasa con la URL?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| URL queda limpia, default in-memory | Coincide con SC#3 | ✓ |
| Materializar default en URL al mount | URL refleja exactamente el estado | |

### Cuando el usuario destildea TODOS los players, ¿qué hacemos?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Permitir 0 players → chart vacío + empty state | Comportamiento explícito y predecible | ✓ |
| Bloquear: si quedaría 0, deshacer el toggle | Magia para mantener ≥1 visible | |
| Permitir 0 → caer al default (todos activos) | Auto-revert a default | |

### ¿Qué hace "Limpiar filtros" en el empty state?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Reset total: borra players y from | Vuelve al default completo | ✓ |
| Solo limpia 'Desde' | Mantiene selección de players | |
| Reset inteligente | Borra solo lo que causó el empty | |

### El empty state ("Sin partidas en este rango"), ¿se implementa en Phase 11 o Phase 12?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Phase 11 (recomendado) | Cierra SC#6, lógica vive donde nace la data | ✓ |
| Phase 12 | Phase 11 deja siempre skeleton | |

---

## Tile de Ranking en Home

### ¿Dónde va la tile en el grid de Home?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Después de "Records" | Junto a Records (vistas analíticas) | |
| Después de "Logros" | Lo último del grid, discoverable | ✓ |
| Antes de "Records" | Arriba del flujo analítico | |

### ¿Qué ícono y label le ponemos?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| 📈 Ranking + 'Evolución de ELO' | Gráfico ascendente, alineado al milestone | ✓ |
| 🏆 Ranking + 'Evolución de ELO' | Trofeo (choca con Records) | |
| 📊 Ranking + 'Evolución de ELO' | Barras (impreciso para line chart) | |

### ¿La tile queda habilitada en Phase 11 o 'Próximamente' hasta Phase 12?

| Opción | Descripción | Selected |
|--------|-------------|----------|
| Habilitada en Phase 11 (recomendado) | Cumple SC#1, tile navega a /ranking | ✓ |
| Disabled 'Próximamente' hasta Phase 12 | Contradice SC#1 | |

---

## Claude's Discretion

- Estilo visual exacto del skeleton del chart (altura, color de líneas, animación pulse opcional)
- Naming exacto de funciones internas del hook y signatures finales
- Estructura HTML interna de la page (h1, header, section)
- Single onChange combinado vs handlers separados en `<RankingFilters>` (lo que quede más limpio en `Ranking.tsx`)
- Si el botón "Reintentar" del estado de error vive inline o como helper extraído
- Tests específicos a escribir más allá del mínimo (SC#5 round-trip TZ Buenos Aires)
- Si la tile de Home se reordena con un solo Edit o conviene refactor previo

## Deferred Ideas

- Refactor cleanup de params backend (`from`/`player_ids` de `/elo/history`) si quedan sin uso post-Phase 12
- `Skeleton` component genérico (YAGNI)
- `useEloHistory` hook (idiom inline gana por D-B2)
- Presets de rango temporal (RANK-FUT-01)
- Tabla data-fallback a11y (RANK-FUT-02)
- Click-en-línea / focus mode (RANK-FUT-03)
- Eje X conmutable (RANK-FUT-04)
- Debounce de cambios (innecesario con MultiSelect discreto)
- `?players=` con key repetida (descartado por SC#3 wording)
