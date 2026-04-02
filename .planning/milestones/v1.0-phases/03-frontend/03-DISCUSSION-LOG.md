# Phase 3: Frontend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 03-frontend
**Areas discussed:** End-of-game display, Profile sections + achievement cards, Catalog page & holders, Icon strategy
**Visual reference:** `/Users/facu/Desarrollos/Personales/achievement-example.jpeg` (Ahead app achievement cards)

---

## End-of-game Achievement Display

### Position of achievements

| Option | Description | Selected |
|--------|-------------|----------|
| Antes de records | Section between celebration header and records | |
| Después de records | Records first, achievements at bottom | |
| En un modal/overlay | Auto-appearing modal showing unlocked achievements | ✓ |

**User's choice:** Modal/overlay
**Notes:** None

### Modal trigger condition

| Option | Description | Selected |
|--------|-------------|----------|
| Solo si hay logros nuevos/mejorados | No modal if nobody unlocked anything | ✓ |
| Siempre, con mensaje 'Sin logros nuevos' | Always appears even if no changes | |

**User's choice:** Solo si hay logros nuevos/mejorados
**Notes:** None

### Visual differentiation new vs upgraded

| Option | Description | Selected |
|--------|-------------|----------|
| Color de borde/accent diferente | New = gold/orange accent, Upgraded = blue/purple accent | ✓ |
| Etiqueta de texto diferente | Badge/chip "NUEVO" vs "MEJORADO" | |
| Ambos: color + etiqueta | Color + text chip | |
| You decide | Claude chooses | |

**User's choice:** Color de borde/accent diferente
**Notes:** None

### Grouping in modal

| Option | Description | Selected |
|--------|-------------|----------|
| Agrupados por jugador | Header with player name, achievements below | ✓ |
| Lista plana con nombre en cada card | All achievements mixed, player name on each card | |

**User's choice:** Agrupados por jugador
**Notes:** None

---

## Profile Sections + Achievement Cards

### Section navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs horizontales | Tab bar below header: Stats, Records, Logros | ✓ |
| Scroll continuo con anchors | All sections stacked, scrollable | |
| Accordion/collapsible | Each section expands/collapses | |

**User's choice:** Tabs horizontales
**Notes:** None

### Tab content distribution

| Option | Description | Selected |
|--------|-------------|----------|
| Stats: stats+history, Records: records, Logros: achievements | Stats tab has grid + game history | ✓ |
| Stats: solo stats, Partidas: history, Records+Logros juntos | Separate stats from history | |
| You decide | Claude chooses | |

**User's choice:** Stats: stats+history | Records: records | Logros: achievements
**Notes:** None

### Locked achievement treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Grayscale icon + empty bar + LEVEL 0 (like reference) | Same layout but in gray | ✓ |
| Full card with reduced opacity | Everything at 50% opacity | |
| You decide | Claude chooses | |

**User's choice:** Grayscale + empty bar + LEVEL 0 (like reference image)
**Notes:** None

---

## Catalog Page & Holders

### Catalog layout

| Option | Description | Selected |
|--------|-------------|----------|
| Lista vertical (like reference) | Vertical cards, consistent with profile | ✓ |
| Grilla 2 columnas | Compact grid, less info per card | |
| You decide | Claude chooses | |

**User's choice:** Lista vertical
**Notes:** None

### Holders display

| Option | Description | Selected |
|--------|-------------|----------|
| Modal con lista de holders | Click card → Modal with holder list | ✓ |
| Expandir inline debajo del card | Card expands downward | |

**User's choice:** Modal
**Notes:** Reuses existing Modal component

### Catalog card info

| Option | Description | Selected |
|--------|-------------|----------|
| Tier máximo alcanzado + cantidad de holders | "LEVEL 3 — 2 jugadores" | ✓ |
| Solo cantidad de holders | "3 jugadores" without tier | |
| You decide | Claude chooses | |

**User's choice:** Tier máximo + cantidad de holders
**Notes:** None

### Navigation access

| Option | Description | Selected |
|--------|-------------|----------|
| Nueva entrada en navegación principal | /achievements alongside Partidas, Jugadores, Records | ✓ |
| Dentro de Records | Tab or section in /records | |
| You decide | Claude chooses | |

**User's choice:** Nueva entrada en navegación principal
**Notes:** None

---

## Icon Strategy

### Lucide vs emoji

| Option | Description | Selected |
|--------|-------------|----------|
| Agregar Lucide ahora | Install lucide-react, use as primary fallback | |
| Solo emoji por ahora | Keep consistency with current app | |
| You decide | Claude chooses | |

**User's choice:** Custom — "Eliminar lo del emoji. Que haya un único fallback, y que sea a un Lucide icon"
**Notes:** Simplified fallback chain: SVG custom → Lucide. No emoji at all

### SVG custom timing

| Option | Description | Selected |
|--------|-------------|----------|
| Solo Lucide por ahora, SVGs custom en v2 | Component supports SVG but v1 uses only Lucide | ✓ |
| Crear SVGs custom básicos ahora | Design 5 simple SVGs for initial achievements | |

**User's choice:** Solo Lucide por ahora
**Notes:** None

---

## Claude's Discretion

- Exact colors for new vs upgrade accent
- Progress bar design details
- Tab component implementation
- Transitions/animations
- Loading states for each surface

## Deferred Ideas

- SVGs custom para cada logro (v2)
- Animación de desbloqueo (v2)
- Toast/notification system genérico (not needed, modal suffices)
