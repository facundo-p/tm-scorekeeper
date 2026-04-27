# Stack Research

**Domain:** Achievement / gamification system additions to an existing React + FastAPI + PostgreSQL app
**Researched:** 2026-03-23
**Confidence:** HIGH for icon library and SVG patterns; MEDIUM for DB patterns (verified against SQLAlchemy docs, but project uses SQLAlchemy 1.4 which has compatibility notes)

---

## Context: What Already Exists

This milestone adds onto an existing stack. Do not re-research or re-install these:

| Layer | Existing Tech |
|-------|---------------|
| Frontend | React 18 + TypeScript + Vite 6 + CSS Modules |
| Routing | react-router-dom 6 |
| Backend | FastAPI + Pydantic v2 + Uvicorn |
| ORM | SQLAlchemy >=1.4 (constraint in requirements.txt) |
| Migrations | Alembic |
| Database | PostgreSQL + psycopg2-binary |
| Testing | Vitest + Testing Library (frontend), pytest + httpx (backend) |

No UI component library is installed. No icon library is installed. No SVG handling plugin is installed.

---

## Recommended Stack Additions

### Frontend: Icon Library

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| lucide-react | ^0.577.0 (latest stable) | Achievement badge fallback icons, UI icons generally | Tree-shakeable ESM-first; each icon is an inline SVG component. Bundle only what you import. ~1400 icons including trophy, medal, award, flame, star, gamepad, target, zap — all needed for TM achievements. TypeScript types included. No peer dep beyond React. The project's `fallback_icon` field in `AchievementDefinition` maps directly to Lucide icon names. |

**Install:**
```bash
npm install lucide-react
```

**Usage pattern for this project:**
```tsx
import { Trophy, Flame, Medal, Star, Gamepad2, Target, Zap, Award } from 'lucide-react'

// In AchievementBadge component — maps fallback_icon string to component
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  trophy: Trophy,
  flame: Flame,
  medal: Medal,
  gamepad: Gamepad2,
  // ...
}
```

Confidence: HIGH — verified on npmjs.com (0.577.0, published 19 days ago), official docs at lucide.dev confirm v1 release with 32% size reduction. 11,103 projects use it.

---

### Frontend: SVG Handling for Custom Achievement Icons

The project plan calls for custom SVGs as primary icon source with a fallback chain to Lucide. Two viable patterns exist; one is recommended.

**Recommended: vite-plugin-svgr + `?react` import suffix**

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| vite-plugin-svgr | ^4.5.0 | Transform `.svg` files into React components at build time | Enables `import TrophySvg from './icons/high_score.svg?react'` — the SVG is inlined as a React component, inherits CSS variables for fill/stroke, no extra HTTP request, no runtime parsing. The `?react` suffix (v4 API) means regular `.svg` imports still work as URL strings for `<img src>` use. |

**Install:**
```bash
npm install -D vite-plugin-svgr
```

**vite.config.ts change:**
```ts
import svgr from 'vite-plugin-svgr'
import react from '@vitejs/plugin-react'

export default {
  plugins: [react(), svgr()],
}
```

**TypeScript: add to `vite-env.d.ts`:**
```ts
/// <reference types="vite-plugin-svgr/client" />
```

**Usage in AchievementBadge component:**
```tsx
// Custom SVG — imported as component
import HighScoreIcon from '@/assets/icons/high_score.svg?react'

// Fallback when no custom SVG
import { Trophy } from 'lucide-react'

function AchievementBadge({ icon, fallbackIcon }: Props) {
  if (icon) {
    const SvgIcon = svgIconMap[icon]
    return SvgIcon ? <SvgIcon className={styles.icon} /> : null
  }
  const LucideIcon = lucideIconMap[fallbackIcon]
  return LucideIcon ? <LucideIcon className={styles.icon} /> : <span>🏆</span>
}
```

Confidence: HIGH — vite-plugin-svgr v4.5.0 confirmed on GitHub releases (August 2025). The `?react` suffix is the documented v4 API, verified against multiple sources.

---

### Frontend: Progress Bar

**Recommendation: CSS-only custom component. No library needed.**

A progress bar for achievement tiers is a two-div layout (track + fill). The project already uses CSS Modules with CSS variables. Adding a library for this would be disproportionate.

```tsx
// AchievementProgress.tsx
interface Props {
  current: number
  target: number
}

export function AchievementProgress({ current, target }: Props) {
  const pct = Math.min((current / target) * 100, 100)
  return (
    <div className={styles.track} role="progressbar" aria-valuenow={current} aria-valuemax={target}>
      <div className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  )
}
```

```css
/* AchievementProgress.module.css */
.track {
  width: 100%;
  height: 6px;
  background: var(--color-surface-2);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: inherit;
  transition: width 0.3s ease;
}
```

Note: the one inline style (`width`) is acceptable here — it is a dynamic runtime value, not a static design decision. This does not violate the project's "no inline styling" rule, which targets static visual decisions that belong in CSS.

Confidence: HIGH — this is a universally implemented pattern.

---

### Backend: PostgreSQL Upsert for Achievement Persistence

No new library is needed. The achievement unlock pattern maps exactly to PostgreSQL's native `INSERT ... ON CONFLICT` construct, already exposed by SQLAlchemy via `sqlalchemy.dialects.postgresql.insert`.

**Pattern for `player_achievements` table:**

The DB model uses a `UniqueConstraint("player_id", "code")`. The upsert updates the tier and timestamp when a player improves their tier, and does nothing on conflict if tier did not change (handled in application logic before the upsert).

```python
from sqlalchemy.dialects.postgresql import insert as pg_insert
from datetime import date

def upsert_achievement(session, player_id: str, code: str, tier: int) -> None:
    stmt = pg_insert(PlayerAchievement).values(
        player_id=player_id,
        code=code,
        tier=tier,
        unlocked_at=date.today(),
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_player_achievement",  # matches UniqueConstraint name in model
        set_={
            "tier": stmt.excluded.tier,
            "unlocked_at": stmt.excluded.unlocked_at,
        },
        where=PlayerAchievement.tier < stmt.excluded.tier,  # only upgrade, never downgrade
    )
    session.execute(stmt)
    session.commit()
```

The `where` clause on `on_conflict_do_update` ensures tiers never regress (achievement system guarantee: unlocks are permanent).

Confidence: HIGH — pattern verified against SQLAlchemy 2.0 official docs at docs.sqlalchemy.org. The `pg_insert` function and `on_conflict_do_update` with `constraint` + `where` parameters are confirmed API.

**Note on SQLAlchemy version:** `requirements.txt` pins `sqlalchemy>=1.4`. The `on_conflict_do_update` API exists in both 1.4 and 2.x. For new code in this milestone, use the 2.0 unified select/execute style (`session.execute(select(...))`) since 1.4 supports both styles. Upgrading to `sqlalchemy>=2.0` for this milestone is recommended — 2.0 is the current stable (2.1 docs are available), and 1.4 reached end-of-life.

---

### Backend: Alembic Migration for `player_achievements` Table

No new library needed. Alembic is already installed. One migration is required.

```python
# alembic/versions/xxxx_add_player_achievements.py
def upgrade():
    op.create_table(
        'player_achievements',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('player_id', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('tier', sa.Integer(), nullable=False),
        sa.Column('unlocked_at', sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(['player_id'], ['players.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('player_id', 'code', name='uq_player_achievement'),
    )
    op.create_index('ix_player_achievements_player_id', 'player_achievements', ['player_id'])
```

---

## Installation Summary

```bash
# Frontend: icon library
npm install lucide-react

# Frontend: SVG-to-component transform (dev dependency)
npm install -D vite-plugin-svgr
```

No new backend dependencies required.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| lucide-react | react-icons | react-icons bundles entire icon sets; no tree-shaking per-icon without careful sub-path imports. lucide-react is always per-icon. |
| lucide-react | heroicons | Smaller icon set (~300 icons). Adequate for UI chrome, but lacks the thematic variety (flame, gamepad, target, zap) needed for achievement iconography. |
| lucide-react | phosphor-react | Solid alternative with similar quality. lucide-react has 3x the ecosystem adoption (11k+ dependents vs ~2k) and better Vite tree-shaking documentation. Either would work. |
| vite-plugin-svgr | Inline SVG string in JS/TS | Requires manual copy-paste of SVG markup into components. Loses the "add a file, it works" DX. Hard to maintain when icons are updated. |
| vite-plugin-svgr | SVG sprite sheet | Best for 50+ icons with shared references. This app will have fewer than 20 achievement icons. The `?react` component approach has equivalent perf for this scale without build complexity. |
| CSS-only progress bar | @radix-ui/react-progress | Radix Progress is zero-styled — you still write all the CSS. The API adds a Root+Indicator component split with no benefit over two divs in this context. Adds a dependency for two CSS rules. |
| pg `on_conflict_do_update` | ORM `session.merge()` | `merge()` does separate SELECT + INSERT/UPDATE statements, not atomic. For achievement upserts (hot path on every game save), a single atomic INSERT...ON CONFLICT is safer and faster. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-icons (full package) | Default import pulls entire icon families into the bundle (~MB). Must use `/fa` sub-path imports to avoid, which is footgun for teams. | lucide-react (per-icon imports always tree-shaken) |
| Any animation library (framer-motion, react-spring) for achievement unlock | PROJECT.md explicitly rules out "elaborate unlock animations." Adding a motion library for a fade-in notification is scope creep and a >100KB dependency. | CSS `transition` / `animation` on the notification component. |
| SQLAlchemy `merge()` for unlocks | Not atomic. Issues two queries. Does not support the "only upgrade tier, never downgrade" constraint at the DB level. | `pg_insert().on_conflict_do_update()` with `where` clause |
| Storing achievement definitions in the DB | Adds a migration every time a new achievement is designed. Inconsistent with the records pattern. Creates a sync problem between code evaluators and DB rows. | Definitions in Python code (consistent with `ALL_CALCULATORS` pattern), only unlocks in DB. |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| lucide-react ^0.577.0 | React 18, TypeScript 5 | Tree-shaking works with Vite's ESM bundler out of the box. No config needed. |
| vite-plugin-svgr ^4.5.0 | Vite ^6, TypeScript 5 | Requires `?react` suffix (v4 API). Add `/// <reference types="vite-plugin-svgr/client" />` to vite-env.d.ts for TS support. |
| sqlalchemy pg `insert` | SQLAlchemy >=1.4, PostgreSQL 9.5+ | `on_conflict_do_update` available in both 1.4 and 2.x. The `where=` parameter on the conflict clause is available in SQLAlchemy 1.2+. |

---

## Sources

- [lucide-react on npm](https://www.npmjs.com/package/lucide-react) — current version 0.577.0 confirmed (HIGH)
- [Lucide v1 release notes](https://lucide.dev/guide/version-1) — v1 API changes, `@lucide/react` naming, size reduction (HIGH)
- [Lucide React guide](https://lucide.dev/guide/packages/lucide-react) — import pattern, tree-shaking, TypeScript support (HIGH)
- [vite-plugin-svgr GitHub releases](https://github.com/pd4d10/vite-plugin-svgr/releases) — v4.5.0 confirmed current (HIGH)
- [vite-plugin-svgr npm](https://www.npmjs.com/package/vite-plugin-svgr) — install command, v4 `?react` suffix API (HIGH)
- [SQLAlchemy PostgreSQL dialect docs](https://docs.sqlalchemy.org/en/21/dialects/postgresql.html) — `on_conflict_do_update` API with `constraint` and `where` params (HIGH)
- [SQLAlchemy 2.0 ORM DML guide](https://docs.sqlalchemy.org/en/20/orm/queryguide/dml.html) — RETURNING pattern, upsert with ORM (HIGH)
- [SVG in React best practices](https://benadam.me/thoughts/react-svg-sprites/) — sprite vs inline vs component import tradeoffs (MEDIUM — community source)
- [React progress bar without library](https://medium.com/@talibwaseem135/create-a-custom-linear-progress-bar-in-react-without-any-library-79a8a1a8b24f) — confirms two-div pattern is standard (MEDIUM)

---

*Stack research for: Achievements system additions to tm-scorekeeper*
*Researched: 2026-03-23*
