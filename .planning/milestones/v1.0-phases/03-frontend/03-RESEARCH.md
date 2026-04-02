# Phase 3: Frontend - Research

**Researched:** 2026-03-31
**Domain:** React functional components, CSS Modules, lucide-react, Vite, Vitest + React Testing Library
**Confidence:** HIGH

## Summary

Phase 3 delivers all visual surfaces for the achievements system: a post-game modal, a restructured PlayerProfile with tabs, and a new AchievementCatalog page. The backend API is fully complete (Phases 1 and 2 done), all TypeScript DTOs are defined in `frontend/src/types/index.ts`, and the API layer (`frontend/src/api/achievements.ts`) already exists with all three functions: `triggerAchievements`, `getPlayerAchievements`, `getAchievementsCatalog`. The design contract is fully specified in `03-UI-SPEC.md`.

The project uses React 18 with React Router v6, hand-rolled components with CSS Modules, no component framework (no shadcn, no Tailwind), and Vitest + React Testing Library for unit tests. The only new npm dependency is `lucide-react` — `vite-plugin-svgr` is NOT needed because D-20 confirms that v1 uses only Lucide icons (SVG custom files are v2). There is no existing Tab component; one must be created from scratch.

The key complexity areas are: (1) integrating the achievement modal trigger into `GameRecords.tsx` using the already-available `useGames.fetchAchievements`, (2) restructuring `PlayerProfile.tsx` to use tabs with independent loading per tab, and (3) building `AchievementCard` to match the Ahead app visual reference. All patterns, colors, spacing, copy, and component boundaries are locked in the UI-SPEC.

**Primary recommendation:** Build bottom-up — AchievementIcon and ProgressBar first (leaf components), then AchievementCard and AchievementBadgeMini, then assemble into modal, profile tabs, and catalog page. This ordering avoids circular blocking during implementation.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**End-of-game achievement display**
- D-01: Los logros post-partida se muestran en un modal/overlay que aparece automáticamente al llegar a GameRecords
- D-02: El modal solo aparece si hubo logros nuevos o mejorados. Si nadie desbloqueó nada, no aparece modal
- D-03: Los logros se muestran agrupados por jugador: header con nombre del jugador, debajo sus logros
- D-04: Diferenciación visual entre "Nuevo logro" y "Logro mejorado" mediante color de borde/accent diferente (no etiqueta de texto)
- D-05: El modal usa el componente Modal existente. Mini badges dentro: ícono + título + tier

**Profile restructuration**
- D-06: Perfil de jugador reestructurado con tabs horizontales debajo del header: Stats, Records, Logros
- D-07: Tab Stats contiene: stats grid (games played, won, win rate) + game history
- D-08: Tab Records contiene: records del jugador
- D-09: Tab Logros contiene: achievement cards estilo referencia (imagen Ahead app)

**Achievement cards en perfil**
- D-10: Cada card: ícono circular a la izquierda, título + descripción a la derecha, LEVEL N abajo a la izquierda, barra de progreso + counter (ej: 2/3) abajo a la derecha
- D-11: Logros bloqueados: ícono en grayscale + barra vacía + LEVEL 0 + counter 0/N. Mismo layout que desbloqueados pero en gris
- D-12: Logros desbloqueados: ícono a color, LEVEL N coloreado (accent), barra de progreso llena/parcial
- D-13: Se muestran TODOS los logros (desbloqueados primero, luego bloqueados). Datos del endpoint GET /players/{id}/achievements

**Catalog page**
- D-14: Nueva página /achievements accesible desde la navegación principal (junto a Partidas, Jugadores, Records)
- D-15: Layout de lista vertical, NO grilla. Cada card estilo similar al perfil
- D-16: Cada card muestra: tier máximo alcanzado globalmente + cantidad de holders (ej: "LEVEL 3 — 2 jugadores")
- D-17: Al clickear un logro se abre Modal con lista de holders: nombre del jugador, tier alcanzado, fecha de desbloqueo
- D-18: Datos del endpoint GET /achievements/catalog

**Icon strategy**
- D-19: Fallback chain simplificada: SVG custom → Lucide icon. Sin emoji como fallback
- D-20: Para v1, los 5 logros iniciales usan solo Lucide como ícono. SVGs custom se agregan en v2
- D-21: Instalar `lucide-react` como dependencia
- D-22: Componente `AchievementIcon` que acepta `icon: string | null` (SVG path) y `fallback_icon: string` (nombre de Lucide icon). Si `icon` es null, renderiza el Lucide icon
- D-23: Mapping de fallback_icon names a Lucide components (ej: "trophy" → Trophy, "flame" → Flame, "gamepad" → Gamepad2, etc.)

### Claude's Discretion
- Colores exactos para new vs upgrade accent en el modal de fin de partida
- Diseño exacto de la barra de progreso (altura, border-radius, colores)
- Tab component: implementación propia o reutilizar patrón existente
- Transiciones/animaciones sutiles (si las hay)
- Cómo manejar el loading state de achievements en cada superficie

### Deferred Ideas (OUT OF SCOPE)
- SVGs custom para cada logro — v2 (VIS-01)
- Animación sutil de desbloqueo — v2 (VIS-02)
- Toast/notification system genérico — no necesario para v1, el modal es suficiente
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENDG-01 | Sección separada de logros nuevos en pantalla de fin de partida | `useGames.fetchAchievements` already available; `GameRecords.tsx` needs modal trigger; `AchievementsByPlayerDTO` already typed |
| ENDG-02 | Badge mini: solo ícono + título del logro desbloqueado | New `AchievementBadgeMini` component; reads `AchievementUnlockedDTO.title` and `fallback_icon` |
| ENDG-03 | Diferenciación visual entre "Nuevo logro" y "Logro mejorado" | `AchievementUnlockedDTO.is_new` / `is_upgrade` booleans available; border-left color switching pattern (accent vs success) |
| PROF-01 | Perfil de jugador reestructurado en secciones (Stats, Records, Logros) | New `TabBar` component; refactor `PlayerProfile.tsx`; independent useState per tab section |
| PROF-02 | Badge completo: ícono, título, descripción, tier actual, indicador de tier máximo | New `AchievementCard` component; reads `PlayerAchievementDTO` with all fields present |
| PROF-03 | Barra de progreso hacia siguiente tier | New `ProgressBar` component; `PlayerAchievementDTO.progress` provides `current`/`target`; null means no progress bar |
| PROF-04 | Logros bloqueados visibles en grayscale/opaco con progreso si aplica | `PlayerAchievementDTO.unlocked: boolean` controls CSS grayscale; `progress` can be present even when locked |
| CATL-01 | Página con todos los logros disponibles | New `AchievementCatalog` page at `/achievements`; uses `getAchievementsCatalog()` already in api/achievements.ts |
| CATL-02 | Cada logro muestra qué jugadores lo tienen y en qué tier | `AchievementCatalogItemDTO.holders` array available; clickable card opens Modal with holders list |
| ICON-01 | Componente `AchievementIcon` con fallback chain | New `AchievementIcon` component; in v1 `icon` is always null so always renders Lucide; `vite-plugin-svgr` NOT needed in v1 |
| ICON-02 | Integración `vite-plugin-svgr` para SVG como componentes React | DEFERRED to v2 per D-20 — do not implement in this phase |
| ICON-03 | Mapeo de fallback icons en definiciones de logros (Lucide icon names) | Static mapping in `AchievementIcon.tsx`: trophy→Trophy, flame→Flame, map→Map, gamepad-2→Gamepad2, star→Star, zap→Zap |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^18.3.1 (already installed) | UI rendering | Project standard |
| react-router-dom | ^6.28.0 (already installed) | Routing, add /achievements | Project standard |
| lucide-react | 1.7.0 (to install) | Lucide icon components | D-21 locked decision; replaces emoji fallbacks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^3.2.4 (already installed) | Unit test runner | All new component tests |
| @testing-library/react | ^16.1.0 (already installed) | DOM assertions | Component render tests |
| @testing-library/user-event | ^14.5.2 (already installed) | User interaction simulation | Tab switching, modal close |

### NOT Needed (confirmed)
| Library | Reason |
|---------|--------|
| vite-plugin-svgr | D-20: SVG custom icons are v2, not v1. No SVG files to import as components |
| Any animation library | Deferred per VIS-02 |
| Any component framework | Project uses hand-rolled CSS Modules |

**Installation:**
```bash
cd /Users/facu/Desarrollos/Personales/tm-scorekeeper/frontend
npm install lucide-react
```

**Version verification:** `npm view lucide-react version` → confirmed 1.7.0 (verified 2026-03-31)

---

## Architecture Patterns

### Component Build Order (bottom-up)
Build leaf components first to avoid blocking:
1. `AchievementIcon` — pure presentational, no dependencies on other new components
2. `ProgressBar` — pure presentational, accepts `value: number` (0–100)
3. `AchievementCard` — composes AchievementIcon + ProgressBar
4. `AchievementBadgeMini` — composes AchievementIcon, used in modal
5. `TabBar` — pure presentational, controlled (activeTab + onTabChange props)
6. `AchievementModal` — wraps Modal + AchievementBadgeMini
7. Modify `PlayerProfile.tsx` — integrates TabBar + AchievementCard
8. Modify `GameRecords.tsx` — integrates AchievementModal
9. New `AchievementCatalog` page — AchievementCard variant + Modal for holders

### Recommended Project Structure (new files)
```
frontend/src/
├── components/
│   ├── AchievementIcon/
│   │   ├── AchievementIcon.tsx
│   │   └── AchievementIcon.module.css
│   ├── AchievementCard/
│   │   ├── AchievementCard.tsx
│   │   └── AchievementCard.module.css
│   ├── AchievementBadgeMini/
│   │   ├── AchievementBadgeMini.tsx
│   │   └── AchievementBadgeMini.module.css
│   ├── AchievementModal/
│   │   ├── AchievementModal.tsx
│   │   └── AchievementModal.module.css
│   ├── ProgressBar/
│   │   ├── ProgressBar.tsx
│   │   └── ProgressBar.module.css
│   └── TabBar/
│       ├── TabBar.tsx
│       └── TabBar.module.css
├── pages/
│   └── AchievementCatalog/
│       ├── AchievementCatalog.tsx
│       └── AchievementCatalog.module.css
└── test/
    └── components/
        ├── AchievementIcon.test.tsx
        ├── AchievementCard.test.tsx
        ├── AchievementBadgeMini.test.tsx
        ├── TabBar.test.tsx
        └── ProgressBar.test.tsx
```

### Pattern 1: AchievementIcon — Lucide mapping table
**What:** Static map from string key to Lucide component; unknown keys fall back to a default icon (Trophy).
**When to use:** Everywhere an achievement icon is needed.
```typescript
// Source: lucide-react docs / project decision D-23
import { Trophy, Flame, Map, Gamepad2, Star, Zap } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type LucideComponent = (props: LucideProps) => JSX.Element

const ICON_MAP: Record<string, LucideComponent> = {
  'trophy': Trophy,
  'flame': Flame,
  'map': Map,
  'gamepad-2': Gamepad2,
  'star': Star,
  'zap': Zap,
}

interface AchievementIconProps {
  fallback_icon: string
  size?: number       // defaults to 24
  unlocked: boolean   // controls color: --color-accent vs --color-text-muted + grayscale
}

export default function AchievementIcon({ fallback_icon, size = 24, unlocked }: AchievementIconProps) {
  const Icon = ICON_MAP[fallback_icon] ?? Trophy
  return (
    <div className={[styles.circle, unlocked ? styles.unlocked : styles.locked].join(' ')}>
      <Icon size={size} />
    </div>
  )
}
```

### Pattern 2: Controlled TabBar
**What:** TabBar receives `activeTab` and `onTabChange` from parent — pure controlled component.
**When to use:** PlayerProfile to avoid lifting state concerns into TabBar itself.
```typescript
type Tab = 'stats' | 'records' | 'logros'

interface TabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}
```

### Pattern 3: AchievementModal conditional render (D-02)
**What:** GameRecords manages `achievements` state; renders `<AchievementModal>` only when non-empty.
**When to use:** Post-game achievements, triggered in useEffect after fetchAchievements resolves.
```typescript
// In GameRecords.tsx — integration point
const [achievements, setAchievements] = useState<AchievementsByPlayerDTO | null>(null)
const [showModal, setShowModal] = useState(false)

useEffect(() => {
  if (!gameId) return
  // ... existing record/result fetches
  useGames.fetchAchievements(gameId).then(data => {
    if (data) {
      const hasAny = Object.values(data.achievements_by_player).some(list => list.length > 0)
      if (hasAny) {
        setAchievements(data)
        setShowModal(true)
      }
    }
  })
}, [gameId])
```

**IMPORTANT:** `useGames` is a hook — `GameRecords` cannot call it directly. The STATE.md note says "fetchAchievements not called inside submitGame — caller chains submitGame -> fetchAchievements -> fetchRecords in Phase 3 UI layer". `GameRecords` must either call `triggerAchievements` directly from api/achievements.ts (same as `useGames.fetchAchievements` does internally), or instantiate `useGames` locally just for this. Since `GameRecords` doesn't need game submission, the cleanest pattern is importing `triggerAchievements` directly from `api/achievements.ts`.

### Pattern 4: Profile tab with lazy loading
**What:** Each tab's data fetched only once; cached in component state.
**When to use:** Logros tab — fetch on first activation, not on mount.
```typescript
const [activeTab, setActiveTab] = useState<'stats' | 'records' | 'logros'>('stats')
const [achievements, setAchievements] = useState<PlayerAchievementDTO[] | null>(null)
const [loadingAchievements, setLoadingAchievements] = useState(false)

const handleTabChange = (tab: typeof activeTab) => {
  setActiveTab(tab)
  if (tab === 'logros' && achievements === null) {
    // fetch only once
    setLoadingAchievements(true)
    getPlayerAchievements(playerId!)
      .then(res => setAchievements(res.achievements))
      .catch(() => setAchievementsError('No se pudo cargar los logros. Intentá de nuevo.'))
      .finally(() => setLoadingAchievements(false))
  }
}
```

### Pattern 5: AchievementCard — unlocked vs locked via prop
**What:** Single component handles both states; `unlocked` boolean drives CSS class and content.
**When to use:** Both PlayerProfile (uses `PlayerAchievementDTO`) and AchievementCatalog (uses `AchievementCatalogItemDTO` adapted to same shape).
```typescript
// ProgressBar receives value 0–100
// Locked: value=0, LEVEL label="NIVEL 0", counter="0/{target}"
// Unlocked: value=progress.current/progress.target*100, LEVEL="NIVEL {tier}"
```

### Anti-Patterns to Avoid
- **Fetching achievements in all tabs on mount:** Causes unnecessary API calls; use lazy load (fetch only when tab becomes active for the first time).
- **Inline styles for locked/unlocked state:** Use CSS class composition (styles.locked / styles.unlocked) — project rule prohibits inline styles.
- **Passing entire AchievementsByPlayerDTO to AchievementModal and iterating there:** Keep logic in parent (GameRecords) — only pass already-filtered data.
- **Creating a separate AchievementCard for catalog vs profile:** Both surfaces use same card structure with different data shape. Use an adapter at call site rather than two components.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon components | Custom SVG inline | `lucide-react` | Tree-shakeable, typed, consistent sizing API, maintained |
| Modal overlay | New modal component | Existing `Modal.tsx` | Already handles Escape key, click-outside, aria-label, stopPropagation |
| Loading spinner | New spinner CSS | Existing `Spinner.tsx` | Already styled to project system |
| Buttons | New button styles | Existing `Button.tsx` | Already has variant/size API (primary, ghost, sm) |
| Date formatting | Custom date string | Existing `formatDate` / `tryFormatDate` util | Already handles project date format (DD/MM/YYYY) |
| CSS variables | Hard-coded color values | `var(--color-accent)` etc. | Theming consistency; all tokens already in index.css |

**Key insight:** The project has all infrastructure in place. Phase 3 is pure UI composition using established patterns — no new utilities, no new routing primitives, no new API infrastructure needed.

---

## Common Pitfalls

### Pitfall 1: Using useGames in GameRecords for fetchAchievements
**What goes wrong:** `useGames` is designed for `GameForm`'s submit flow. Importing it into `GameRecords` just to call `fetchAchievements` creates unnecessary state (`submitting`, `submitError`) in GameRecords.
**Why it happens:** `fetchAchievements` lives in the hook for form orchestration reasons.
**How to avoid:** Import `triggerAchievements` directly from `@/api/achievements` in `GameRecords.tsx`. Same function, no hook overhead. Add try/catch with one retry inline (copy the retry logic from useGames if desired, or keep simple).
**Warning signs:** If `useGames` is imported in `GameRecords.tsx`, double-check it's only used for fetchAchievements.

### Pitfall 2: Modal renders empty if achievements object has player keys with empty arrays
**What goes wrong:** `achievements_by_player` may be `{ "player-id": [] }` — player key exists but no achievements. If check is `Object.keys(data.achievements_by_player).length > 0`, modal opens empty.
**Why it happens:** Backend returns player keys even when no achievements unlocked (edge case).
**How to avoid:** Check `Object.values(data.achievements_by_player).some(list => list.length > 0)` before showing modal (D-02 requirement). Filter player groups in AchievementModal to skip empty arrays.
**Warning signs:** Modal appears with player header but no badges below it.

### Pitfall 3: Progress bar divide-by-zero when target is 0
**What goes wrong:** `ProgressBar` receives `value = current/target * 100` — if `target` is 0 (shouldn't happen but defensive), produces NaN/Infinity.
**Why it happens:** Achievements with no progress (e.g., single-tier with no progress tracking) have `progress: null` — but caller must guard before computing percentage.
**How to avoid:** Always check `if (achievement.progress !== null)` before passing to ProgressBar. When `progress` is null, pass `value={0}` or hide the bar entirely per design (NIVEL N with no bar for achievements that don't support progress).
**Warning signs:** `NaN%` in progress bar width CSS.

### Pitfall 4: AchievementCard used in catalog with wrong DTO shape
**What goes wrong:** `AchievementCatalogItemDTO` has `tiers[]` and `holders[]` instead of `PlayerAchievementDTO`'s `tier`/`progress`/`unlocked`. If you try to pass catalog items directly to AchievementCard, TypeScript will error.
**Why it happens:** The two DTOs serve different use cases (player-specific vs global).
**How to avoid:** In `AchievementCatalog`, derive display data from `AchievementCatalogItemDTO` before passing to card: compute `maxTier = Math.max(...holders.map(h => h.tier), 0)`, `holderCount = holders.length`. The catalog card variant shows "NIVEL {maxTier} — {n} jugadores" rather than personal progress.
**Warning signs:** TypeScript errors when passing catalog DTOs to a profile-typed AchievementCard.

### Pitfall 5: Tab sticky positioning breaks on short content
**What goes wrong:** TabBar is specified as "sticky if content scrolls" — position:sticky on the tab bar requires proper scroll container setup. If parent doesn't have overflow, sticky won't work.
**Why it happens:** CSS sticky requires a scroll ancestor with overflow.
**How to avoid:** For v1, implement tab bar as position: sticky with top: 0 and verify in mobile viewport. If the page uses `min-height: 100vh` on `.page`, sticky should work. Fallback: non-sticky tab bar (still correct, just not sticky on long lists).
**Warning signs:** Tab bar scrolls away when user scrolls through long achievement list.

### Pitfall 6: Lucide import style — named vs default
**What goes wrong:** lucide-react 1.x uses named exports. Importing as default (`import Trophy from 'lucide-react'`) will fail.
**Why it happens:** Library changed import style in major versions.
**How to avoid:** Always use named imports: `import { Trophy, Flame } from 'lucide-react'`. For the dynamic map pattern, import all needed icons at top of `AchievementIcon.tsx` explicitly.
**Warning signs:** `Trophy is not a function` or TypeScript cannot find module default export.

---

## Code Examples

### AchievementIcon — full implementation pattern
```typescript
// Source: project decisions D-22, D-23 + lucide-react named imports
import { Trophy, Flame, Map, Gamepad2, Star, Zap } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import styles from './AchievementIcon.module.css'

type IconComponent = React.FC<LucideProps>

const ICON_MAP: Record<string, IconComponent> = {
  'trophy': Trophy,
  'flame': Flame,
  'map': Map,
  'gamepad-2': Gamepad2,
  'star': Star,
  'zap': Zap,
}

interface AchievementIconProps {
  fallback_icon: string
  size?: number
  unlocked: boolean
}

export default function AchievementIcon({ fallback_icon, size = 24, unlocked }: AchievementIconProps) {
  const Icon: IconComponent = ICON_MAP[fallback_icon] ?? Trophy
  return (
    <div className={[styles.circle, unlocked ? styles.unlocked : styles.locked].join(' ')}>
      <Icon size={size} />
    </div>
  )
}
```

### ProgressBar
```typescript
// value: 0–100 (percentage). height: 6px per UI-SPEC
interface ProgressBarProps {
  value: number   // 0–100
}
// CSS: track = --color-border, fill = --color-accent, height 6px, border-radius 3px
// .fill { width: `${Math.min(100, Math.max(0, value))}%` }
```

### AchievementCard — data shape
```typescript
// Used for PlayerProfile (from PlayerAchievementDTO)
interface AchievementCardProps {
  title: string
  description: string
  fallback_icon: string
  tier: number          // 0 when locked
  max_tier: number
  unlocked: boolean
  progress: { current: number; target: number } | null
}
// progress bar value = progress ? Math.round(progress.current / progress.target * 100) : 0
// counter = progress ? `${progress.current}/${progress.target}` : undefined
```

### AchievementBadgeMini — border color logic
```typescript
// D-04: border-left color differentiates new vs upgrade
// is_new (tier 1) → --color-accent (#e67e22)
// is_upgrade (tier 2+) → --color-success (#27ae60)
const borderColor = achievement.is_new ? 'var(--color-accent)' : 'var(--color-success)'
// Note: this is the ONE allowed inline style in the codebase — or use data-attribute CSS:
// data-type="new" | "upgrade" → CSS [data-type="new"] { border-left-color: var(--color-accent) }
// Prefer data-attribute to keep CSS Modules rule intact
```

### Tab switching in PlayerProfile
```typescript
// useState default 'stats', lazy-load logros tab on first activation
const [activeTab, setActiveTab] = useState<'stats' | 'records' | 'logros'>('stats')
const achievementsLoadedRef = useRef(false)

const handleTabChange = (tab: 'stats' | 'records' | 'logros') => {
  setActiveTab(tab)
  if (tab === 'logros' && !achievementsLoadedRef.current) {
    achievementsLoadedRef.current = true
    // trigger fetch
  }
}
```

### GameRecords — achievement trigger
```typescript
// Import triggerAchievements directly (not via useGames hook)
import { triggerAchievements } from '@/api/achievements'
// In useEffect alongside records/results fetch:
triggerAchievements(gameId)
  .then(data => {
    const hasAny = Object.values(data.achievements_by_player).some(list => list.length > 0)
    if (hasAny) { setAchievements(data); setShowModal(true) }
  })
  .catch(() => {}) // silent failure per STATE.md decision
```

### Home.tsx — add nav item
```typescript
// Add to navItems array:
{ to: '/achievements', icon: '🏅', title: 'Logros', description: 'Catálogo de logros', disabled: false }
```

### App.tsx — add route
```typescript
import AchievementCatalog from '@/pages/AchievementCatalog/AchievementCatalog'
// Add inside Routes:
<Route path="/achievements" element={<ProtectedRoute><AchievementCatalog /></ProtectedRoute>} />
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Emoji fallback for icons (ICON-01 original req) | Lucide-only for v1 (D-19/D-20) | Phase 3 context session | No vite-plugin-svgr needed; simpler AchievementIcon |
| Profile shows all sections stacked | Profile uses horizontal tabs | Phase 3 context session | Requires new TabBar component, refactor of PlayerProfile |
| POST /games/ returns GameCreatedResponseDTO | GameCreatedResponseDTO extended with achievements | Phase 2 | STATE.md warns this is a breaking change — frontend already adapted in types/index.ts |

**Deprecated/outdated:**
- ICON-02 (`vite-plugin-svgr`): Listed in REQUIREMENTS.md but deferred by D-20. Do NOT implement in Phase 3.
- Emoji fallback chain: Original ICON-01 spec mentioned emoji as last fallback. D-19 removes it. AchievementIcon has only 2 levels: SVG (future v2) → Lucide.

---

## Open Questions

1. **PlayerProfile current Records tab content**
   - What we know: Current PlayerProfile shows `profile.records` as a list of record type codes the player holds (boolean map). The Records tab should contain "records del jugador".
   - What's unclear: Does the Records tab reuse existing records UI (requires a `getPlayerRecords` API call), or just show the current boolean-map list?
   - Recommendation: The current code shows `profile.records` (boolean map from `PlayerProfileDTO`). Phase 3 plan should preserve this behavior in the Records tab — no new API call needed unless the plan explicitly adds one. The existing `getPlayerProfile` endpoint already returns `records`.

2. **AchievementModal close button label**
   - What we know: UI-SPEC says close button text is "Continuar" with variant `primary`.
   - What's unclear: The existing `Modal.tsx` only has an "×" close button via prop `onClose`. Adding a "Continuar" primary button requires either modifying Modal.tsx or adding a footer via `children` in AchievementModal.
   - Recommendation: Pass "Continuar" button as part of `children` in `AchievementModal` (bottom of modal body). Do not modify `Modal.tsx` to avoid breaking other usages.

3. **Catalog card click area**
   - What we know: D-17 says clicking a catalog card opens a Modal with holders. UI-SPEC says "no router navigation".
   - What's unclear: Should the entire card be clickable (button role) or just a "Ver holders" link?
   - Recommendation: Wrap entire catalog `AchievementCard` in a `<button>` with `onClick`. Use `cursor: pointer` and hover state on the card. This is consistent with the existing `gameRow` link pattern in PlayerProfile.

---

## Validation Architecture

nyquist_validation is enabled (`workflow.nyquist_validation: true` in .planning/config.json).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 + React Testing Library 16.1.0 |
| Config file | `frontend/vite.config.ts` (vitest config inline, `test.environment: 'jsdom'`) |
| Setup file | `frontend/src/test/setup.ts` (imports @testing-library/jest-dom, mocks localStorage) |
| Quick run command | `cd frontend && npm test -- --run` |
| Full suite command | `cd frontend && npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENDG-01 | AchievementModal renders when achievements present | unit | `npm test -- --run AchievementModal` | ❌ Wave 0 |
| ENDG-02 | AchievementBadgeMini renders icon + title | unit | `npm test -- --run AchievementBadgeMini` | ❌ Wave 0 |
| ENDG-03 | Border color differs for is_new vs is_upgrade | unit | `npm test -- --run AchievementBadgeMini` | ❌ Wave 0 |
| PROF-01 | TabBar renders 3 tabs, switches active state | unit | `npm test -- --run TabBar` | ❌ Wave 0 |
| PROF-02 | AchievementCard renders title/desc/tier | unit | `npm test -- --run AchievementCard` | ❌ Wave 0 |
| PROF-03 | ProgressBar width reflects value prop | unit | `npm test -- --run ProgressBar` | ❌ Wave 0 |
| PROF-04 | AchievementCard locked state applies grayscale class | unit | `npm test -- --run AchievementCard` | ❌ Wave 0 |
| CATL-01 | AchievementCatalog renders list of achievements | unit | `npm test -- --run AchievementCatalog` | ❌ Wave 0 |
| CATL-02 | Clicking catalog card opens Modal with holders | unit | `npm test -- --run AchievementCatalog` | ❌ Wave 0 |
| ICON-01 | AchievementIcon renders known icon, fallback for unknown | unit | `npm test -- --run AchievementIcon` | ❌ Wave 0 |
| ICON-02 | vite-plugin-svgr | N/A — deferred to v2 | skip | N/A |
| ICON-03 | All 6 icon strings map to Lucide components | unit | `npm test -- --run AchievementIcon` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npm test -- --run`
- **Per wave merge:** `cd frontend && npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/test/components/AchievementIcon.test.tsx` — covers ICON-01, ICON-03
- [ ] `frontend/src/test/components/AchievementBadgeMini.test.tsx` — covers ENDG-02, ENDG-03
- [ ] `frontend/src/test/components/AchievementCard.test.tsx` — covers PROF-02, PROF-03, PROF-04
- [ ] `frontend/src/test/components/TabBar.test.tsx` — covers PROF-01
- [ ] `frontend/src/test/components/ProgressBar.test.tsx` — covers PROF-03
- [ ] `frontend/src/test/components/AchievementCatalog.test.tsx` — covers CATL-01, CATL-02

*(AchievementModal and GameRecords/PlayerProfile integration are integration-level — verify via manual or e2e in verification phase)*

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `frontend/src/types/index.ts` — all achievement DTOs verified present
- Direct file inspection: `frontend/src/api/achievements.ts` — all 3 API functions verified present
- Direct file inspection: `frontend/src/hooks/useGames.ts` — fetchAchievements verified available
- Direct file inspection: `frontend/package.json` — confirmed lucide-react NOT yet installed
- Direct file inspection: `frontend/vite.config.ts` — Vitest config confirmed (jsdom, globals, setupFiles)
- Direct file inspection: `frontend/src/pages/GameRecords/GameRecords.tsx` — confirmed no achievements integration yet
- Direct file inspection: `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` — confirmed current flat structure
- Direct file inspection: `.planning/phases/03-frontend/03-CONTEXT.md` — all decisions locked
- Direct file inspection: `.planning/phases/03-frontend/03-UI-SPEC.md` — full design contract
- npm registry: `npm view lucide-react version` → 1.7.0 (verified live)
- npm registry: `npm view vite-plugin-svgr version` → 5.0.0 (verified live, but not needed for v1)

### Secondary (MEDIUM confidence)
- lucide-react import pattern: named exports confirmed by package structure + prior codebase usage patterns

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified via package.json inspection and npm registry
- Architecture: HIGH — based on direct codebase inspection of all files to be modified
- Pitfalls: HIGH — derived from actual code inspection (GameRecords, PlayerProfile, DTO shapes)
- Test patterns: HIGH — existing test files (Login.test.tsx) provide exact patterns to follow

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable stack, no fast-moving dependencies)
