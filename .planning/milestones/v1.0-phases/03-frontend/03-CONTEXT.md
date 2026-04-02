# Phase 3: Frontend - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Todas las superficies visuales para logros: modal de logros post-partida, perfil de jugador reestructurado en tabs con sección de logros, página de catálogo global, y componente AchievementIcon con fallback chain SVG → Lucide.

</domain>

<decisions>
## Implementation Decisions

### End-of-game achievement display
- **D-01:** Los logros post-partida se muestran en un **modal/overlay** que aparece automáticamente al llegar a GameRecords
- **D-02:** El modal solo aparece si hubo logros nuevos o mejorados. Si nadie desbloqueó nada, no aparece modal
- **D-03:** Los logros se muestran **agrupados por jugador**: header con nombre del jugador, debajo sus logros
- **D-04:** Diferenciación visual entre "Nuevo logro" y "Logro mejorado" mediante **color de borde/accent diferente** (no etiqueta de texto)
- **D-05:** El modal usa el componente Modal existente. Mini badges dentro: ícono + título + tier

### Profile restructuration
- **D-06:** Perfil de jugador reestructurado con **tabs horizontales** debajo del header: Stats, Records, Logros
- **D-07:** Tab Stats contiene: stats grid (games played, won, win rate) + game history (lo que hay ahora)
- **D-08:** Tab Records contiene: records del jugador (lo que hay ahora en la sección records)
- **D-09:** Tab Logros contiene: achievement cards estilo referencia (imagen Ahead app)

### Achievement cards en perfil (estilo referencia)
- **D-10:** Cada card: ícono circular a la izquierda, título + descripción a la derecha, LEVEL N abajo a la izquierda, barra de progreso + counter (ej: 2/3) abajo a la derecha
- **D-11:** Logros bloqueados: ícono en **grayscale** + barra vacía + **LEVEL 0** + counter 0/N. Mismo layout que desbloqueados pero en gris
- **D-12:** Logros desbloqueados: ícono a color, LEVEL N coloreado (accent), barra de progreso llena/parcial
- **D-13:** Se muestran TODOS los logros (desbloqueados primero, luego bloqueados). Datos del endpoint GET /players/{id}/achievements

### Catalog page
- **D-14:** Nueva página /achievements accesible desde la navegación principal (junto a Partidas, Jugadores, Records)
- **D-15:** Layout de **lista vertical** (como la referencia), NO grilla. Cada card estilo similar al perfil
- **D-16:** Cada card muestra: tier máximo alcanzado globalmente + cantidad de holders (ej: "LEVEL 3 — 2 jugadores")
- **D-17:** Al clickear un logro se abre **Modal** con lista de holders: nombre del jugador, tier alcanzado, fecha de desbloqueo
- **D-18:** Datos del endpoint GET /achievements/catalog

### Icon strategy
- **D-19:** Fallback chain simplificada: **SVG custom → Lucide icon**. Sin emoji como fallback
- **D-20:** Para v1, los 5 logros iniciales usan **solo Lucide** como ícono. SVGs custom se agregan en v2
- **D-21:** Instalar `lucide-react` como dependencia
- **D-22:** Componente `AchievementIcon` que acepta `icon: string | null` (SVG path) y `fallback_icon: string` (nombre de Lucide icon). Si `icon` es null, renderiza el Lucide icon
- **D-23:** Mapping de fallback_icon names a Lucide components (ej: "trophy" → Trophy, "flame" → Flame, "gamepad" → Gamepad2, etc.)

### Claude's Discretion
- Colores exactos para new vs upgrade accent en el modal de fin de partida
- Diseño exacto de la barra de progreso (altura, border-radius, colores)
- Tab component: implementación propia o reutilizar patrón existente
- Transiciones/animaciones sutiles (si las hay)
- Cómo manejar el loading state de achievements en cada superficie

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design reference
- `/Users/facu/Desarrollos/Personales/achievement-example.jpeg` — Visual reference for achievement cards (Ahead app). Icon left, title+desc right, LEVEL N + progress bar bottom

### Frontend structure
- `frontend/src/index.css` — Global CSS variables (colors, spacing, typography, border-radius)
- `frontend/src/App.tsx` — Routes definition, add /achievements route here
- `frontend/src/types/index.ts` — TypeScript achievement types (AchievementUnlockedDTO, PlayerAchievementDTO, AchievementCatalogItemDTO) already defined

### Existing components (pattern reference)
- `frontend/src/components/Modal/Modal.tsx` — Modal component to reuse for holders and end-of-game
- `frontend/src/components/RecordsSection/RecordsSection.tsx` — Card display pattern
- `frontend/src/components/RecordComparisonCard/RecordComparisonCard.tsx` — Card with emoji, title, metadata
- `frontend/src/components/Button/Button.tsx` — Button variants and sizes
- `frontend/src/components/Spinner/Spinner.tsx` — Loading state

### Pages to modify
- `frontend/src/pages/GameRecords/GameRecords.tsx` — Add achievement modal post-game
- `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` — Restructure into tabs, add Logros tab

### API and hooks
- `frontend/src/api/achievements.ts` — triggerAchievements, getPlayerAchievements, getAchievementsCatalog
- `frontend/src/hooks/useGames.ts` — fetchAchievements already available

### Navigation
- `frontend/src/pages/Home/Home.tsx` — Add navigation link to /achievements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Modal` component — overlay modal with close button, Escape key support
- `RecordComparisonCard` — card pattern with icon, title, metadata
- `Spinner` — loading indicator
- `Button` — variants (primary, secondary, ghost, danger)
- CSS variables — full design system with colors, spacing, typography
- `useGames.fetchAchievements` — already returns AchievementsByPlayerDTO

### Established Patterns
- CSS Modules (`ComponentName.module.css`) for scoped styling
- CSS custom properties for theming (dark theme, Terraforming Mars palette)
- Mobile-first responsive design
- Card pattern: surface bg, border, border-radius, padding
- Achieved state: accent border + orange tint background

### Integration Points
- `GameRecords.tsx` — add achievement modal trigger after fetchAchievements
- `PlayerProfile.tsx` — restructure into tabs, add achievements tab
- `App.tsx` — add /achievements route
- `Home.tsx` — add navigation link
- `package.json` — add lucide-react dependency

</code_context>

<specifics>
## Specific Ideas

- Achievement cards deben seguir el patrón visual de la imagen de referencia (Ahead app): ícono circular izquierda, título+descripción derecha, LEVEL + barra progreso abajo
- Los logros bloqueados se ven como la referencia: LEVEL 0, ícono gris, barra vacía
- El catálogo muestra tier máximo global + cantidad de holders por logro
- No hay toast/notification system — el modal de fin de partida cumple esa función

</specifics>

<deferred>
## Deferred Ideas

- SVGs custom para cada logro — v2 (VIS-01)
- Animación sutil de desbloqueo — v2 (VIS-02)
- Toast/notification system genérico — no necesario para v1, el modal es suficiente

</deferred>

---

*Phase: 03-frontend*
*Context gathered: 2026-03-31*
