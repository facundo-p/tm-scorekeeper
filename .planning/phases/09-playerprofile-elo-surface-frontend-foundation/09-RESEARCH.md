# Phase 9: PlayerProfile ELO surface + frontend foundation - Research

**Researched:** 2026-04-28
**Domain:** Backend FastAPI endpoint (route + service method + mapper) + React frontend (typed contracts, api wrapper, reusable card component, page integration)
**Confidence:** HIGH (every standard, pattern, and pitfall is grounded in a direct read of the v1.1 frontend research already done plus live codebase reads of `backend/{routes,services,repositories,mappers,schemas}` and `frontend/src/{api,types,pages,components,test}`)

## Summary

Phase 9 is a thin-slice integration phase, not a green-field design phase. The user-facing deliverable is small (one hero card on `PlayerProfile`), but it is load-bearing for the rest of v1.1 because it lands the typed contracts (`EloChangeDTO` mirror, new `PlayerEloSummaryDTO`, drift-fix on `PlayerResponseDTO.elo` / `PlayerProfileDTO.elo`) and the `api/elo.ts` wrapper that Phases 10-12 will reuse. The backend half is a new dedicated endpoint `GET /players/{player_id}/elo-summary` that composes existing repositories — no new repository is created, no migration is needed (D-03: peak is computed on-the-fly from `EloChange`).

Every architectural decision has been pre-locked in `09-CONTEXT.md` (D-01 through D-20). The role of this research is therefore not to explore options but to (a) confirm the locked decisions are technically achievable in the existing codebase, (b) catalogue the exact existing files / patterns each task must extend, and (c) flag the validation architecture so plan-time tasks include the right tests.

**Primary recommendation:** Two parallelizable tracks — backend (route + service method + mapper + integration tests) and frontend (types drift-fix + new types + api wrapper + EloSummaryCard + PlayerProfile integration + component tests). They share only the shape of `PlayerEloSummaryDTO`, which is locked in CONTEXT D-02. After both tracks land, run a manual edge-case sweep on a real profile page covering the five edge cases enumerated in D-16 / D-17 / D-18.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Backend data delivery:**
- **D-01:** New dedicated endpoint `GET /players/{player_id}/elo-summary`. Do NOT extend `PlayerProfileDTO`.
- **D-02:** Response shape: `{ "current_elo": int, "peak_elo": int|null, "last_delta": int|null, "rank": { "position": int, "total": int }|null }`.
- **D-03:** `peak_elo` computed on-the-fly via `max(elo_after) WHERE player_id = X` against the `EloChange` (PlayerEloHistory) table. No migration. No new column.
- **D-04:** Rank scope = active players only (`is_active = true`). `position` = 1-based index in the list of active players ordered by `players.elo DESC`. `total` = count of active players.
- **D-05:** Empty shape (0 games): endpoint returns 200 with `current_elo: 1000` (seed), `peak_elo: null`, `last_delta: null`, `rank: null`. Never 404.
- **D-06:** Tie-break = stable order by `player_id` (NOT dense rank). Document in service docstring.
- **D-07:** Endpoint lives in `backend/routes/players_routes.py`. Service method on existing `EloService` (services/container.py). No new `elo_routes.py` and no new service.

**Frontend visual hierarchy:**
- **D-08:** Hero card ABOVE the existing `statsCard`. ELO grande + delta inline on main row; peak + rank on secondary sub-row. Existing 3-tile grid (Partidas / Ganadas / Win rate) remains intact below.
- **D-09:** Reuse existing color tokens — `--color-success` (#27ae60, already in `index.css`) for positive delta, `--color-error` for negative, `--color-text-muted` for `±0`. NO new `--color-elo-*` tokens.
- **D-10:** Reusable component `EloSummaryCard` at `src/components/EloSummaryCard/EloSummaryCard.tsx` + `.module.css`. Props: `{ summary: PlayerEloSummaryDTO }`. Component handles all nullables internally.
- **D-11:** Delta syntax = signed number only (`+23` / `-12` / `±0`), no auxiliary visible text. MUST include `aria-label="Cambio de ELO en la última partida: +23"` on the delta span.

**Frontend foundation scope:**
- **D-12:** Pragmatic partial foundation — Phase 9 ships ONLY: `elo: number` added to `PlayerResponseDTO` + `PlayerProfileDTO` (drift fix), new `EloChangeDTO` (mirror), new `PlayerEloSummaryDTO`, new `src/api/elo.ts` with only `getEloSummary(playerId)`.
- **D-13:** Phase 10 owns `getEloChanges(gameId)`. Phase 11 owns `PlayerEloHistoryDTO`/`EloHistoryPointDTO`/`getEloHistory()`. Do NOT speculate contracts here.
- **D-14:** Fetch in `PlayerProfile.tsx` = inline in existing `useEffect`. Extend the existing `Promise.all([getPlayerProfile, getPlayers])` to 3 calls (add `getEloSummary`). Catch separated so summary failure does not break profile render. NO new hook (`useEloSummary` not created).
- **D-15:** Do NOT run `/sync-enums` skill — Phase 9 touches DTOs, not enums.

**Edge cases:**
- **D-16:** `peak_elo == current_elo` → render `Pico: 1612 · actual` (suffix "actual" as positive recognition). If `peak_elo == null` (0 games) → hide peak line entirely.
- **D-17:** `last_delta == 0` → show `±0` with `--color-text-muted`. If `last_delta == null` (0 games) → hide delta span.
- **D-18:** Rank shown whenever `rank != null`, including `#1 de 1` (single active player). Inactive player viewing their own profile → backend returns `rank: null` because scope = active → frontend hides.
- **D-19:** Refresh strategy post-edition = on-mount-refetch ONLY. NO cache. NO localStorage. NO React Query. NO SWR. (Pitfall 1 of v1.1 PITFALLS.md is load-bearing.)
- **D-20:** Strict scope. Nothing outside PROF-01..PROF-04 — no mini-sparkline, no tier names, no extras.

### Claude's Discretion

- Naming of subarchivos/funciones del backend (`get_summary_for_player` vs `compute_elo_summary` etc.).
- Tamaños de tipografía exactos del card hero (usar tokens `--font-size-xl` / `--font-size-2xl`).
- Estructura HTML interna del card (qué es `<h2>`, `<span>`, etc.) siempre que cumpla a11y.
- Tests específicos a escribir (cubrir todos los nullables, peak==current, delta=0, rank null).

### Deferred Ideas (OUT OF SCOPE)

- **Mini-sparkline del ELO** (PROF-FUT-01) — requires history endpoint (Phase 8) + recharts (Phase 12). Defer to v1.2.
- **Banda de incertidumbre Glicko-2** (PROF-FUT-02) — out of milestone charter.
- **Tier names visuales (Bronze/Silver/Gold)** — anti-feature documented in REQUIREMENTS.md "Out of Scope".
- **Tooltip/hover en el delta** — minimalist path chosen; reconsider in v1.2 if feedback indicates ambiguity.
- **`useEloSummary` hook** — inline pattern is sufficient; promote to hook only if Phase 12 leaderboard needs to reuse the fetch.
- **Persistir `players.peak_elo` como columna** — discarded due to drift risk. Reconsider only if on-the-fly computation shows performance issues (improbable at this N).
- **Endpoint `/elo/leaderboard` global** — not needed for Phase 9 (rank computed in player summary). Potentially useful for Phase 12 if repeat-call performance does not scale.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **PROF-01** | Usuario ve el ELO actual del jugador en su perfil | `current_elo` in `PlayerEloSummaryDTO` (always present, equals seed 1000 when 0 games per D-05). EloSummaryCard hero number. Verified: `players.elo` column already exists and is bulk-updated by `EloService.recompute_from_date` (`elo_service.py:89`). |
| **PROF-02** | Usuario ve la delta de ELO de la última partida (color-coded) | `last_delta` in `PlayerEloSummaryDTO` (nullable when 0 games per D-05). Computed from latest `PlayerEloHistory` row by `recorded_at DESC`. Color via `--color-success` / `--color-error` / `--color-text-muted` per D-09. |
| **PROF-03** | Usuario ve el peak rating histórico del jugador | `peak_elo` via `MAX(elo_after) WHERE player_id = X` against `PlayerEloHistory` table (D-03). Verified: `EloRepository` already queries this table directly via session (pattern in `get_changes_for_game`, `get_baseline_elo_before` — same idiom applies). |
| **PROF-04** | Usuario ve el ranking entre jugadores activos | `rank.position` and `rank.total` over active players only (D-04), tie-break by `player_id` (D-06). Verified: `players.elo` is kept in sync (`PlayersRepository.bulk_update_elo`), so a single ordered query plus an index lookup gives both fields. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Persisting / mutating ELO state | API / Backend (existing `EloService`) | Database (PostgreSQL) | Already shipped in PR #42. Phase 9 only reads; nothing is added here. |
| Computing summary (current / peak / last_delta / rank) | API / Backend (`EloService.get_summary_for_player`) | Database (single read of `PlayerEloHistory` + `Player`) | Backend owns ELO truth (D-19 forbids any client computation or cache). |
| Mapping domain → DTO (`PlayerEloSummaryDTO`) | API / Backend (mappers/elo_summary_mapper.py OR inline in service) | — | Standard mapper layer convention (`mappers/elo_mapper.py` precedent). |
| Exposing summary via HTTP | API / Backend (`backend/routes/players_routes.py`) | — | D-07 keeps endpoint scoped to a player; consistent with `/players/{id}/profile` and `/players/{id}/achievements` precedents. |
| Typed wrapper + DTO mirror | Frontend (`src/api/elo.ts` + `src/types/index.ts`) | — | Established convention `api → hooks → pages/components → types` (research/ARCHITECTURE.md). |
| Fetching summary on profile mount | Frontend page (`PlayerProfile.tsx` `useEffect`) | — | D-14: extend existing `Promise.all` to 3 calls. No new hook. |
| Rendering hero card + nullable branches | Frontend component (`EloSummaryCard`) | — | D-10: reusable, prop-driven, manages its own nullables. |
| Visual styling via design tokens | Frontend CSS Module (`EloSummaryCard.module.css`) | — | Project rule: no inline styles, all colors via CSS variables. |

## Standard Stack

### Backend (no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | (existing) | HTTP route layer | Already wired — every other route in the app uses it. |
| SQLAlchemy | (existing) | ORM session + queries | Required pattern: `with self._session_factory() as session:` (verified `repositories/elo_repository.py:18`). |
| Pydantic | v2 (existing) | DTO definition with `Field()` validation | Established by `schemas/elo.py`, `schemas/player.py`. |

### Frontend (no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 (existing) | Functional component with hooks | Project rule. |
| TypeScript | 5.6.x (existing) | DTOs + Props typing | Established. |
| CSS Modules | (existing) | Scoped styling for `EloSummaryCard.module.css` | Project rule "Sin inline styling. CSS separado y reutilizable." |
| Vitest + Testing Library | 3.x / 16.x (existing) | Component tests for `EloSummaryCard.test.tsx` | Established (`frontend/src/test/components/`). |

### Alternatives Considered (and rejected)

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline fetch in `PlayerProfile.tsx` (D-14) | New `useEloSummary` hook | More indirection without saving code; no other consumer in this phase. Promote later if Phase 12 reuses it. |
| Dedicated endpoint `GET /players/{id}/elo-summary` (D-01) | Extend `PlayerProfileDTO` with summary fields | Couples profile shape to ELO concerns; breaks the ability to reuse summary in Phase 12 leaderboard. D-01 wins. |
| Persisting `players.peak_elo` column | Computing on-the-fly per request | Drift risk after `recompute_from_date`. On-the-fly is correct by construction. D-03 wins. |
| New `--color-elo-positive` / `--color-elo-negative` tokens | Reusing `--color-success` / `--color-error` | Token proliferation; semantic duplication. D-09 wins (verified `--color-success: #27ae60` is already in `index.css:14`). |

**Installation:** None. Phase 9 adds no dependencies to `package.json` or `requirements.txt`.

**Version verification:** N/A — no new packages. All recommended technologies are already pinned in the existing `package.json` and `requirements.txt`.

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser                                                              │
│                                                                        │
│  PlayerProfile.tsx (useEffect on mount)                                │
│       │                                                                │
│       ▼                                                                │
│  Promise.all([                                                         │
│    getPlayerProfile(playerId),  ── existing                            │
│    getPlayers(),                ── existing                            │
│    getEloSummary(playerId),     ── NEW (api/elo.ts)                    │
│  ]).then(([profile, players, summary]) => setState)                    │
│  .catch on summary alone (does NOT break profile render)               │
│       │                                                                │
│       ▼                                                                │
│  Render order in Stats tab:                                            │
│    <EloSummaryCard summary={summary} />   ── ABOVE statsCard           │
│    <section className={styles.statsCard}>  ── existing 3-tile grid    │
└──────────────────────────────────────────────────────────────────────┘
                          │
                          │  HTTP GET /players/{playerId}/elo-summary
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                                    │
│                                                                        │
│  routes/players_routes.py                                              │
│    @router.get("/{player_id}/elo-summary",                             │
│                 response_model=PlayerEloSummaryDTO)                    │
│    └──> elo_service.get_summary_for_player(player_id)                  │
│                                                                        │
│  services/elo_service.py (NEW method)                                  │
│    get_summary_for_player(player_id) -> PlayerEloSummaryDTO            │
│       │                                                                │
│       ├──> players_repository.get(player_id)         ── current_elo    │
│       │       (raises KeyError → 404)                                  │
│       │                                                                │
│       ├──> elo_repository.get_peak_for_player(p)    ── peak_elo (NEW) │
│       │       SQL: SELECT MAX(elo_after) FROM PlayerEloHistory         │
│       │            WHERE player_id = :pid                              │
│       │            (returns None if no rows → null in DTO per D-05)    │
│       │                                                                │
│       ├──> elo_repository.get_last_change_for_player(p) ── delta (NEW)│
│       │       SQL: ORDER BY recorded_at DESC, game_id DESC LIMIT 1     │
│       │            .delta value (or None → null per D-05)              │
│       │                                                                │
│       └──> players_repository.get_active_players_ranked() ── rank (NEW)│
│               SQL: WHERE is_active = true                              │
│                    ORDER BY elo DESC, player_id ASC                    │
│                    Then: position = index+1; total = count             │
│               If player not in result (inactive) → rank = null         │
│                                                                        │
│  mappers/elo_summary_mapper.py (NEW, optional — inline if 1:1)        │
│    summary_to_dto(domain_summary) -> PlayerEloSummaryDTO               │
└──────────────────────────────────────────────────────────────────────┘
                          │
                          │  SQLAlchemy session
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                           │
│    players (id, name, is_active, elo)            ← existing           │
│    player_elo_history (id, player_id, game_id,                         │
│                        elo_before, elo_after, delta, recorded_at)      │
│      indexed on (player_id, recorded_at)         ← already exists      │
└──────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (NEW + MODIFIED files only)

**Backend:**
```
backend/
├── routes/
│   └── players_routes.py        # MODIFIED: add @router.get("/{player_id}/elo-summary")
├── services/
│   └── elo_service.py           # MODIFIED: add get_summary_for_player(player_id)
├── repositories/
│   └── elo_repository.py        # MODIFIED: add get_peak_for_player + get_last_change_for_player
│   └── player_repository.py     # MODIFIED: add get_active_players_ranked
├── schemas/
│   └── elo.py                   # MODIFIED: add PlayerEloSummaryDTO + EloRankDTO
├── mappers/
│   └── elo_summary_mapper.py    # NEW (optional — only if transformation is non-trivial; inline in service if 1:1)
└── tests/
    └── integration/
        └── test_elo_summary_endpoint.py   # NEW
    └── test_elo_service.py      # MODIFIED: add unit tests for get_summary_for_player
```

**Frontend:**
```
frontend/src/
├── api/
│   └── elo.ts                   # NEW: getEloSummary(playerId)
├── types/
│   └── index.ts                 # MODIFIED: drift-fix elo on PlayerResponseDTO + PlayerProfileDTO; add EloChangeDTO mirror; add PlayerEloSummaryDTO + EloRankDTO
├── components/
│   └── EloSummaryCard/
│       ├── EloSummaryCard.tsx   # NEW
│       └── EloSummaryCard.module.css  # NEW
├── pages/
│   └── PlayerProfile/
│       └── PlayerProfile.tsx    # MODIFIED: extend Promise.all; render <EloSummaryCard /> above statsCard
└── test/
    └── components/
        └── EloSummaryCard.test.tsx   # NEW
```

### Pattern 1: Backend route → service → repository (existing convention)

**What:** Routes are thin wrappers that call a service method, catch domain exceptions, and translate to HTTP. Services compose repositories. Repositories own SQLAlchemy sessions.

**When to use:** Always — every endpoint in this codebase follows this layering (verified `players_routes.py:31-45`, `players_routes.py:72-83`, `games_routes.py:94-100`).

**Example (pattern to mirror — `players_routes.py:31-45` for the 404 handling):**
```python
# Source: live read of backend/routes/players_routes.py:31-45
@router.get("/{player_id}/elo-summary", response_model=PlayerEloSummaryDTO)
def get_player_elo_summary(player_id: str):
    try:
        return elo_service.get_summary_for_player(player_id)
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"Player '{player_id}' not found",
        )
```

The `elo_service` instance is imported from `services.container` (already exists per `services/container.py:17-21`).

### Pattern 2: SQLAlchemy session-scoped query (`get_baseline_elo_before` precedent)

**What:** Open a session via context manager, run a query against the ORM model, return Python primitives. No state escapes the session.

**When to use:** All new repository methods.

**Example (peak query — direct extension of `elo_repository.py:67-87` pattern):**
```python
# Source: extends pattern from backend/repositories/elo_repository.py:67-87
from sqlalchemy import func

def get_peak_for_player(self, player_id: str) -> int | None:
    """Returns max(elo_after) for the player, or None if no history exists."""
    with self._session_factory() as session:
        result = (
            session.query(func.max(PlayerEloHistoryORM.elo_after))
            .filter(PlayerEloHistoryORM.player_id == player_id)
            .scalar()
        )
        return result  # None when no rows match
```

```python
# Source: extends pattern from backend/repositories/elo_repository.py:32-47
def get_last_change_for_player(self, player_id: str) -> EloChange | None:
    """Returns the most recent EloChange for the player by recorded_at, or None."""
    with self._session_factory() as session:
        orm = (
            session.query(PlayerEloHistoryORM)
            .filter(PlayerEloHistoryORM.player_id == player_id)
            .order_by(
                PlayerEloHistoryORM.recorded_at.desc(),
                PlayerEloHistoryORM.game_id.desc(),
            )
            .first()
        )
        if orm is None:
            return None
        return EloChange(
            player_id=orm.player_id,
            elo_before=orm.elo_before,
            elo_after=orm.elo_after,
            delta=orm.delta,
        )
```

```python
# Source: extends pattern from backend/repositories/player_repository.py:57-63
def get_active_players_ranked(self) -> list[Player]:
    """Returns active players ordered by elo DESC, tie-break by player_id ASC.

    The order is deterministic and matches the rank semantics in EloService:
    position = index+1 in this list, total = len(this list).
    """
    with self._session_factory() as session:
        orms = (
            session.query(PlayerORM)
            .filter(PlayerORM.is_active.is_(True))
            .order_by(PlayerORM.elo.desc(), PlayerORM.id.asc())
            .all()
        )
        return [
            Player(player_id=o.id, name=o.name, is_active=o.is_active, elo=o.elo)
            for o in orms
        ]
```

### Pattern 3: Service composition without holding session state

**What:** Service methods receive primitive ids, call repositories, compose results into a domain object or DTO. Service never opens its own SQLAlchemy session.

**When to use:** New `EloService.get_summary_for_player`.

**Example:**
```python
# Source: composes existing repos following backend/services/elo_service.py pattern
def get_summary_for_player(self, player_id: str) -> PlayerEloSummaryDTO:
    """
    Returns the ELO summary for a single player.

    Tie-breaking: when multiple active players share the same `elo`, ranking is
    stable by ascending `player_id` (NOT dense rank). A player with 0 games
    receives current_elo = DEFAULT_ELO (1000), peak_elo = None,
    last_delta = None, rank = None. Inactive players also receive rank = None
    (rank is scoped to active players).
    """
    player = self.players_repository.get(player_id)  # raises KeyError → route 404

    peak = self.elo_repository.get_peak_for_player(player_id)
    last_change = self.elo_repository.get_last_change_for_player(player_id)
    last_delta = last_change.delta if last_change is not None else None

    rank = None
    if player.is_active:
        ranked = self.players_repository.get_active_players_ranked()
        for idx, p in enumerate(ranked):
            if p.player_id == player_id:
                rank = EloRankDTO(position=idx + 1, total=len(ranked))
                break

    return PlayerEloSummaryDTO(
        current_elo=player.elo,
        peak_elo=peak,
        last_delta=last_delta,
        rank=rank,
    )
```

### Pattern 4: Pydantic DTO with nullable nested model (CONTEXT D-02 shape)

**What:** Pydantic v2 model with `Optional[T]` fields and a nested DTO for the rank object.

**When to use:** New `PlayerEloSummaryDTO` and `EloRankDTO` in `backend/schemas/elo.py`.

**Example:**
```python
# Source: extends backend/schemas/elo.py + matches backend/schemas/player.py:35-37 nullable pattern
from typing import Optional
from pydantic import BaseModel


class EloRankDTO(BaseModel):
    position: int
    total: int


class PlayerEloSummaryDTO(BaseModel):
    current_elo: int
    peak_elo: Optional[int] = None
    last_delta: Optional[int] = None
    rank: Optional[EloRankDTO] = None
```

### Pattern 5: Frontend API wrapper (1:1 with `api/players.ts`)

**What:** Pure typed function returning a Promise. No state. No retries here (Phase 9 catches in `PlayerProfile.tsx`, not in the wrapper).

**When to use:** New `frontend/src/api/elo.ts`.

**Example:**
```ts
// Source: mirrors frontend/src/api/players.ts pattern exactly
import { api } from './client'
import type { PlayerEloSummaryDTO } from '@/types'

export function getEloSummary(playerId: string): Promise<PlayerEloSummaryDTO> {
  return api.get<PlayerEloSummaryDTO>(`/players/${playerId}/elo-summary`)
}
```

### Pattern 6: Extend `Promise.all` with separate catch (D-14)

**What:** The existing `useEffect` in `PlayerProfile.tsx:25-35` does `Promise.all([getPlayerProfile, getPlayers])`. D-14 says: extend to 3 calls AND keep the summary failure isolated so it does not break the profile render.

**When to use:** `PlayerProfile.tsx` modification.

**Example pattern (sketch — final shape decided in plan):**
```ts
// Source: extends frontend/src/pages/PlayerProfile/PlayerProfile.tsx:25-35
useEffect(() => {
  if (!playerId) return
  // Profile + players: critical, failure shows error box
  // Summary: optional, failure shows nothing (silently absent)
  const profilePromise = Promise.all([getPlayerProfile(playerId), getPlayers()])
  const summaryPromise = getEloSummary(playerId).catch(() => null)

  Promise.all([profilePromise, summaryPromise])
    .then(([[profileData, playersData], summaryData]) => {
      setProfile(profileData)
      const found = playersData.find((p) => p.player_id === playerId)
      setPlayerName(found?.name ?? playerId)
      setEloSummary(summaryData)  // null on failure → card hidden
    })
    .catch(() => setError('No se pudo cargar el perfil del jugador.'))
    .finally(() => setLoading(false))
}, [playerId])
```

The card is rendered only when `eloSummary !== null`. Concrete implementation may differ (e.g., flatten into one Promise.all with `.catch` per call) — the principle is "summary failure isolated."

### Pattern 7: Reusable card component with nullable handling (D-10, D-16, D-17, D-18)

**What:** Single-prop component (`{ summary: PlayerEloSummaryDTO }`) that internally branches on each nullable field. CSS Module for styling.

**When to use:** New `EloSummaryCard.tsx`.

**Example skeleton (final HTML decided in plan, must satisfy a11y D-11 and edge cases D-16/17/18):**
```tsx
// Source: composes design tokens verified in frontend/src/index.css; mirrors statsCard pattern
import type { PlayerEloSummaryDTO } from '@/types'
import styles from './EloSummaryCard.module.css'

interface EloSummaryCardProps {
  summary: PlayerEloSummaryDTO
}

export default function EloSummaryCard({ summary }: EloSummaryCardProps) {
  const hasGames = summary.last_delta !== null  // proxy for "has any history"

  return (
    <section className={styles.card} aria-label="Resumen de ELO">
      <div className={styles.heroRow}>
        <span className={styles.heroValue}>
          {hasGames ? summary.current_elo : '—'}
        </span>
        <span className={styles.heroLabel}>ELO</span>
        {summary.last_delta !== null && (
          <span
            className={deltaClass(summary.last_delta)}
            aria-label={`Cambio de ELO en la última partida: ${formatDelta(summary.last_delta)}`}
          >
            {formatDelta(summary.last_delta)}
          </span>
        )}
      </div>
      {(summary.peak_elo !== null || summary.rank !== null) && (
        <div className={styles.subRow}>
          {summary.peak_elo !== null && (
            <span>
              Pico: {summary.peak_elo}
              {summary.peak_elo === summary.current_elo && ' · actual'}
            </span>
          )}
          {summary.rank !== null && (
            <span>#{summary.rank.position} de {summary.rank.total}</span>
          )}
        </div>
      )}
    </section>
  )
}

// Helpers (sketch — extract to small functions to keep component <20 lines per project rule)
function formatDelta(d: number): string {
  if (d > 0) return `+${d}`
  if (d < 0) return `${d}`
  return '±0'
}

function deltaClass(d: number): string {
  if (d > 0) return styles.deltaPositive
  if (d < 0) return styles.deltaNegative
  return styles.deltaZero
}
```

CSS Module references the verified tokens:
```css
/* Source: tokens verified in frontend/src/index.css:14-17 */
.deltaPositive { color: var(--color-success); }
.deltaNegative { color: var(--color-error); }
.deltaZero { color: var(--color-text-muted); }
```

The 0-games branch hides delta + peak + rank (each guarded by `!== null`); only `current_elo` (rendered as `—`) and the "ELO" label remain visible. This satisfies D-05 (backend always returns `current_elo`) AND the success criterion #4 ("0 games shows `—` for current ELO, peak/rank/delta hidden").

### Anti-Patterns to Avoid

- **Adding a `useEloSummary` hook:** D-14 explicitly forbids it. Inline pattern in `useEffect` is the project convention for page-local data.
- **Storing summary in `localStorage` for "snappier first paint":** D-19 forbids it. v1.1 PITFALLS.md Pitfall 1 explains the cascade-correctness problem.
- **Adding new color tokens (`--color-elo-positive`, `--color-elo-up`, etc.):** D-09 forbids it. `--color-success` (verified `index.css:14`) and `--color-error` already exist.
- **Computing peak/rank in a single mega-query with subqueries:** Three small focused queries are cheaper to understand and test than one composite query. Only collapse if profiling at >100k history rows shows latency (improbable at this N).
- **Catching the summary failure inside the component:** Failures should be caught in the page's `useEffect` per D-14 ("catch separated"). The component receives either a `summary` or is not rendered at all.
- **Rendering the card with `summary === null` and an "error" message:** D-14 says summary failure should not affect the profile UX. Not rendering the card at all is the spec.
- **Adding inline styles for deltas (e.g., `style={{ color: delta > 0 ? '#27ae60' : '#e74c3c' }}`):** Project rule forbids inline styling. Use CSS Module classes that reference design tokens.
- **Functions >20 lines:** Project rule. Extract helpers (`formatDelta`, `deltaClass`, `computeRank`) early.
- **Hardcoded color hex values in CSS:** Use `var(--color-success)` etc. Not `#27ae60`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Computing rank position | A custom Python sort + index loop in service from `players_repository.get_all()` | New `players_repository.get_active_players_ranked()` returning ordered list (use SQL `ORDER BY elo DESC, id ASC`) | Lets the database do the work; deterministic; testable in isolation; reuses session-scoped pattern. |
| Computing peak ELO | A Python `max(...)` over all history rows pulled into memory | `func.max(PlayerEloHistoryORM.elo_after)` SQL aggregate (one row, one scalar) | Avoids loading rows into memory; correct by construction. |
| Computing last delta | Loading all history and sorting in Python | `ORDER BY recorded_at DESC, game_id DESC LIMIT 1` SQL | Single row from DB; scales with index. |
| Translating None → null in DTO | Manual conversion inside the route | Pydantic v2's native `Optional[T]` field handling | Pydantic already serializes Python `None` as JSON `null`. |
| Mirroring backend types in frontend | Importing types from a generated client OR re-defining DTOs | Hand-write the TS interface in `src/types/index.ts` (project convention) | The codebase has zero codegen. Manual mirror is the established discipline. Drift is treated as a bug per CONTEXT D-12 / canonical_refs comment. |
| HTTP request handling | A new fetch call in `api/elo.ts` with custom error handling | Use existing `api.get<T>()` from `client.ts` | `api.get` already handles non-2xx → `ApiError`, JSON parsing, base URL. Verified `client.ts:36-45`. |
| Color logic for delta | Inline `<span style={...}>` switching on sign | CSS Module classes `deltaPositive` / `deltaNegative` / `deltaZero` referencing tokens | Project rule "Sin inline styling." |

**Key insight:** Phase 9 should add zero new abstractions. Every problem maps to an existing pattern (route, service method, session-scoped query, Pydantic Optional, hand-mirrored type, `api.get`, CSS Module class). Resist the impulse to introduce layers — the value of Phase 9 is integration, not architecture.

## Runtime State Inventory

> Phase 9 is an additive feature phase, not a rename/refactor. The full inventory is included for completeness; most categories are empty.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 9 only ADDS columns/values to none, only READS existing `PlayerEloHistory` and `players.elo` | None |
| Live service config | None — no external services touched | None |
| OS-registered state | None — no OS daemons, no scheduled tasks introduced | None |
| Secrets/env vars | None — uses existing `VITE_API_URL` (frontend) and existing DB connection (backend) | None |
| Build artifacts | None — no new packages, no compiled binaries, no codegen | None |

## Common Pitfalls

### Pitfall 1: Cache layer creep (CRITICAL — load-bearing for D-19)

**What goes wrong:** A developer adds React Query, SWR, `localStorage`, or a global "memoize ELO" wrapper to "speed up" the profile page. After a user edits a 3-month-old game, the cascade rewrites every `EloChange` from that date forward and `players.elo` is bulk-updated, but the cached summary on the profile page is now stale.

**Why it happens:** The optimization seems harmless. The cascade is invisible from the frontend's POV. Cache-invalidation discipline is hard.

**How to avoid:** D-19 explicitly forbids any cache. The `useEffect` on mount + page unmount on `<Link>` navigation is the entire correctness guarantee. PR review must reject any cache addition. Add a comment in `PlayerProfile.tsx` and/or `api/elo.ts` documenting the no-cache rationale.

**Warning signs:** A PR introducing `import { useQuery } from '@tanstack/react-query'`. A PR adding `localStorage.setItem('elo-summary-...')`. A "global elo store" appearing in `src/`.

### Pitfall 2: 0-games player rendering `1000` instead of `—` (HIGH — Pitfall 6 case 1 of v1.1 PITFALLS.md)

**What goes wrong:** Backend returns `current_elo: 1000` for a never-played player (per D-05, by design — seed value). Frontend displays `1000` literally. User reads "this player has a rating before they played" and is confused.

**Why it happens:** The backend value is technically correct; without explicit branching, the frontend renders it.

**How to avoid:** `EloSummaryCard` must branch: if `last_delta === null` (proxy for "no history rows for this player"), render `—` em-dash for the current ELO field. This is success criterion #4 of Phase 9 ROADMAP.md and explicitly flagged in v1.1 PITFALLS.md.

**Warning signs:** A test for "0-games player" that asserts `screen.getByText('1000')`. A code review missing the branch.

### Pitfall 3: `peak_elo == current_elo` rendered as just "Pico: 1612" without the "actual" suffix (MEDIUM — D-16)

**What goes wrong:** A player whose current rating is also their all-time peak sees "Pico: 1612" while their hero ELO also says "1612" — looks redundant or buggy.

**How to avoid:** When `summary.peak_elo === summary.current_elo` AND `peak_elo !== null`, append " · actual" to the peak line per D-16. This is a positive recognition, not a redundancy.

**Warning signs:** Test asserting peak line as exactly `"Pico: 1612"` with no suffix variant.

### Pitfall 4: Tie-breaking creates non-deterministic rank (MEDIUM — D-06)

**What goes wrong:** Two active players have `elo = 1500`. `ORDER BY elo DESC` alone is undefined for ties, so on different DB engines or after a VACUUM the relative order can flip. A player sees their rank fluctuate between `#3` and `#4` between page reloads with no game played in between.

**How to avoid:** Always include `, player_id ASC` (or similar deterministic secondary key) in the `ORDER BY`. Document in service docstring per D-06. PostgreSQL with this composite ORDER BY is deterministic.

**Warning signs:** A test that creates two players with the same ELO and only asserts one of them is at a position (instead of asserting the tie-broken-by-id one specifically).

### Pitfall 5: Race between mutation and refetch on same page (LOW — already handled)

**What goes wrong:** User edits a game on `/games/:id`, clicks "← Volver al perfil", and the profile shows old ELO because the GET arrives before the PUT commits.

**Why this is LOW:** Backend mutations are synchronous (verified by v1.1 PITFALLS.md Pitfall 2 analysis of `game_service.py:141-209`). By the time the PUT response returns, all `EloChange` rows and `players.elo` are committed. The subsequent navigation triggers a fresh `useEffect` on `PlayerProfile.tsx` mount that reads the committed state.

**How to avoid:** Trust the existing on-mount-fetch pattern. Do NOT add `setTimeout` before the fetch. Do NOT add polling.

**Warning signs:** A `setTimeout` near the `getEloSummary` call. A "wait for ELO to be ready" endpoint. Polling.

### Pitfall 6: Profile breaks when summary endpoint 500s (HIGH — D-14)

**What goes wrong:** Summary endpoint hits a transient bug or DB blip and returns 500. Without separate catch, the entire `Promise.all` rejects, the profile page shows "No se pudo cargar el perfil del jugador" even though profile + players loaded fine. User cannot see their own data.

**How to avoid:** D-14 mandates separate catch. Implementation pattern in this RESEARCH.md "Pattern 6" handles it. Test must assert: when `getEloSummary` rejects, profile still renders, EloSummaryCard simply absent (no error message, no card).

**Warning signs:** A single `Promise.all([..., getEloSummary(playerId)])` with no per-call catch. A test that does not cover summary-failure-with-profile-success.

### Pitfall 7: Rank computation breaks at `total = 1` or with 0 active players (MEDIUM — D-18)

**What goes wrong:** Edge cases at the boundaries: only one active player exists (rank should be `#1 de 1`); zero active players exist (rare — rank should be `null`); the requested player is inactive (rank should be `null` even though other active players exist).

**How to avoid:**
- If `player.is_active is False`, skip the rank computation entirely → `rank = None`. (D-04 / D-18)
- If `len(get_active_players_ranked()) == 0`, the loop naturally returns `None`. Edge case is handled by absence rather than a special branch.
- If `len(...) == 1` and the player is active, `position = 1, total = 1` is rendered as `#1 de 1` per D-18. Frontend has no special branch needed (verified in pattern 7 sketch).

**Warning signs:** A test that asserts `#1 de 1` is hidden. A `if total > 1:` guard in the frontend. A division-by-zero attempt to compute "percentile."

## Code Examples

(See "Architecture Patterns" section above for the full inventory of code examples — patterns 1 through 7. Each is grounded in a direct read of an existing file with the cited line range.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `players.elo` field absent / always 1000 | `players.elo` is bulk-updated by `EloService.recompute_from_date` (verified `elo_service.py:89`) | PR #42 (pre-milestone) | Phase 9 can read this column directly for `current_elo` — no extra computation needed. |
| Persistir `peak_elo` as a player column | Compute via `MAX(elo_after)` on-the-fly | Phase 9 (D-03) | Eliminates drift risk. Cost is one indexed aggregate query per request — negligible at this N. |
| Frontend types include only basic `PlayerResponseDTO { player_id, name, is_active }` | Add `elo: number` (drift fix) + new `EloChangeDTO` mirror + new `PlayerEloSummaryDTO` + new `EloRankDTO` | Phase 9 (D-12) | Frontend now matches backend exactly; future phases (10-12) extend `api/elo.ts` with `getEloChanges` + `getEloHistory`. |
| ELO entirely backend-only (PR #42) | First user-visible ELO surface | Phase 9 | Breaks the "ELO is invisible" silo; sets the visual / interaction precedent for Phases 10-12. |

**Deprecated/outdated:**
- v1.0 frontend mental model that "the only stat shown on profile is the 3-tile grid" is superseded — hero card now sits above. PlayerProfile.module.css's `.statsCard` pattern still applies; the new card uses a sibling section.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (none) | All claims in this RESEARCH.md were verified against live codebase reads or are direct copies of CONTEXT.md locked decisions or are explicit citations of v1.1 research files (SUMMARY/PITFALLS/ARCHITECTURE/STACK). | — | — |

**No assumptions to confirm.** Every standard, pattern, file path, and pitfall in this research either (a) was read directly from the live source in this session, (b) was copied verbatim from `09-CONTEXT.md` (locked decisions), or (c) was sourced from the v1.1 milestone-level research (which itself was verified against the same codebase).

## Open Questions

1. **Should `elo_summary_mapper.py` exist as a separate file, or be inlined in the service?**
   - What we know: CONTEXT `code_context` says "agregar `elo_summary_mapper.py` si la transformación es no-trivial, o inline si es 1:1."
   - What is unclear: The service's `get_summary_for_player` already constructs a `PlayerEloSummaryDTO` directly from the queried primitives — the transformation is genuinely 1:1, no domain ↔ DTO translation.
   - Recommendation: **Inline in the service** unless the planner's task decomposition shows the service method exceeding 20 lines (project rule). If extraction helps, create the mapper file.

2. **Should the new repository methods live on `EloRepository` or split between `EloRepository` and `PlayersRepository`?**
   - What we know: `get_peak_for_player` and `get_last_change_for_player` query `PlayerEloHistory` → belong to `EloRepository`. `get_active_players_ranked` queries `players` → belongs to `PlayersRepository`.
   - Recommendation: Split per repository ownership of the underlying table. Verified that `EloService` already composes both repos (see `services/container.py:17-21` — already injected). No new wiring needed.

3. **Should the EloSummaryCard render any heading like "Tu ELO" or just be label-less?**
   - What we know: D-11 specifies minimalist delta with no auxiliary text. D-08 says "ELO grande + delta inline en línea principal."
   - What is unclear: Whether the word "ELO" itself should be a `<span>` next to the number (e.g., "1523 ELO") or a smaller subtitle.
   - Recommendation: Render "ELO" as a small label adjacent to the number (mirrors how `.statLabel` works in `PlayerProfile.module.css:78-81`). Final HTML/typography is in Claude's Discretion per CONTEXT.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker + docker-compose | `make test-backend` (project rule "NEVER run pytest on host") | ✓ (assumed — established workflow) | (existing) | None — pytest on host is forbidden by `feedback_never_run_pytest_locally` memory |
| PostgreSQL (via docker-compose.test.yml) | Backend integration tests for new endpoint | ✓ | (existing) | None |
| Node + npm | Frontend `npm run test` for Vitest, `npm run typecheck` | ✓ | Node 18+ (existing) | None |
| FastAPI test client | `TestClient(app)` in integration tests (verified `tests/integration/test_elo_cascade.py:11`) | ✓ | (existing) | None |
| Vitest + jsdom + Testing Library | Frontend component tests | ✓ | 3.x / 25.x / 16.x (existing) | None |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — Phase 9 introduces no new external dependencies.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend Framework | pytest (Docker-only via `docker-compose.test.yml`) |
| Backend Config file | `backend/tests/conftest.py` (verified — `setup_db` + `clean_tables` autouse fixtures) |
| Backend Quick run command | `docker compose -f docker-compose.test.yml down && docker compose -f docker-compose.test.yml run --rm --build backend_test sh -c "alembic upgrade head && python -m pytest tests/integration/test_elo_summary_endpoint.py -q" && docker compose -f docker-compose.test.yml down` |
| Backend Full suite command | `make test-backend` |
| Frontend Framework | Vitest 3.x + Testing Library 16.x + jsdom 25 |
| Frontend Config file | `frontend/src/test/setup.ts` (verified) |
| Frontend Quick run command | `cd frontend && npm run test -- src/test/components/EloSummaryCard.test.tsx` |
| Frontend Full suite command | `cd frontend && npm run test -- --run` (and `npm run typecheck`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **PROF-01** | Endpoint returns `current_elo` matching `players.elo` | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_current_elo -q` | ❌ Wave 0 |
| **PROF-01** | Card renders current ELO as hero number for non-zero player | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "renders current_elo"` | ❌ Wave 0 |
| **PROF-01** | Card renders `—` (em-dash) when player has 0 games | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "renders em-dash for zero games"` | ❌ Wave 0 |
| **PROF-02** | Endpoint returns `last_delta = +N` after a winning game | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_last_delta_after_win -q` | ❌ Wave 0 |
| **PROF-02** | Endpoint returns `last_delta = null` for 0-games player (D-05) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_zero_games_returns_nulls -q` | ❌ Wave 0 |
| **PROF-02** | Card renders `+23` with `--color-success` class for positive delta | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "positive delta uses success class"` | ❌ Wave 0 |
| **PROF-02** | Card renders `-12` with `--color-error` class for negative delta | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "negative delta uses error class"` | ❌ Wave 0 |
| **PROF-02** | Card renders `±0` with muted class for zero delta (D-17) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "zero delta uses muted class"` | ❌ Wave 0 |
| **PROF-02** | Delta span has `aria-label="Cambio de ELO en la última partida: ..."` (D-11) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "delta has aria-label"` | ❌ Wave 0 |
| **PROF-02** | Delta span hidden when `last_delta === null` (D-17) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "delta hidden when null"` | ❌ Wave 0 |
| **PROF-03** | Endpoint returns `peak_elo = max(elo_after)` over history | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_peak_elo -q` | ❌ Wave 0 |
| **PROF-03** | Endpoint returns `peak_elo = null` for 0-games player | backend integration | (covered by `test_zero_games_returns_nulls`) | ❌ Wave 0 |
| **PROF-03** | Card renders "Pico: 1612 · actual" when peak == current (D-16) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "peak equals current shows actual suffix"` | ❌ Wave 0 |
| **PROF-03** | Card renders "Pico: 1612" without suffix when peak > current | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "peak greater than current omits suffix"` | ❌ Wave 0 |
| **PROF-03** | Card hides peak line when `peak_elo === null` (D-16) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "peak hidden when null"` | ❌ Wave 0 |
| **PROF-04** | Endpoint returns `rank = { position, total }` for active player | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_returns_rank_for_active_player -q` | ❌ Wave 0 |
| **PROF-04** | Endpoint tie-breaks rank by `player_id ASC` (D-06) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_tie_break_by_player_id -q` | ❌ Wave 0 |
| **PROF-04** | Endpoint excludes inactive players from rank pool (D-04) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_inactive_excluded_from_rank_total -q` | ❌ Wave 0 |
| **PROF-04** | Endpoint returns `rank = null` for inactive player (D-18) | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_inactive_player_gets_null_rank -q` | ❌ Wave 0 |
| **PROF-04** | Endpoint returns `rank = { 1, 1 }` when only one active player exists | backend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_single_active_player_rank_one_of_one -q` | ❌ Wave 0 |
| **PROF-04** | Card renders "#3 de 8" when rank present | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "renders rank"` | ❌ Wave 0 |
| **PROF-04** | Card hides rank line when `rank === null` (D-18) | frontend component | `npm run test -- EloSummaryCard.test.tsx -t "rank hidden when null"` | ❌ Wave 0 |
| **Success Criterion #5** | Profile reflects recomputed ELO after game-edit (cascade) — no client cache | backend integration + frontend integration | `... pytest tests/integration/test_elo_summary_endpoint.py::test_summary_reflects_cascade_after_edit -q` (extends `test_elo_cascade.py` precedent) | ❌ Wave 0 |
| **D-14 isolation** | Summary fetch failure does NOT break profile render | frontend page test | `npm run test -- PlayerProfile.test.tsx -t "summary failure does not block profile"` | ❌ Wave 0 (PlayerProfile.test.tsx does not yet exist; check before scoping — `frontend/src/test/components/` listing shows none) |

### Sampling Rate

- **Per task commit:**
  - Backend tasks → run only the new file: `... pytest tests/integration/test_elo_summary_endpoint.py -q`
  - Frontend tasks → run only the new file: `npm run test -- src/test/components/EloSummaryCard.test.tsx`
- **Per wave merge:**
  - Backend wave → `make test-backend` (full suite)
  - Frontend wave → `cd frontend && npm run test -- --run && npm run typecheck`
- **Phase gate:** Both full suites green before `/gsd-verify-work`. Plus a manual smoke test on the dev profile page covering the five success criteria + the inactive-player edge case.

### Wave 0 Gaps

- [ ] `backend/tests/integration/test_elo_summary_endpoint.py` — covers PROF-01 through PROF-04 backend behaviors + 0-games + tie-break + inactive + cascade-reflection
- [ ] `frontend/src/test/components/EloSummaryCard.test.tsx` — covers PROF-01..04 visual rendering + all nullable branches + delta sign formatting + aria-label + delta colors
- [ ] `frontend/src/test/components/PlayerProfile.test.tsx` — currently does not exist; required for D-14 (summary-failure-isolation) + integration smoke. Decision: create it OR add the isolation test to an existing PlayerProfile test if one is added by the planner. Either way, the test scenario MUST exist.
- [ ] Optional: `backend/tests/test_elo_service.py` — extend with unit tests for `get_summary_for_player` against mocked repos (faster than integration tests; complements but does not replace the integration suite).

**Framework install:** None needed — Vitest, pytest, jsdom, Testing Library all installed.

## Sources

### Primary (HIGH confidence — verified in this session)

- `09-CONTEXT.md` — every locked decision (D-01 through D-20) copied verbatim
- `.planning/REQUIREMENTS.md` — PROF-01..PROF-04 definitions
- `.planning/ROADMAP.md` — Phase 9 success criteria #1..#5
- `.planning/research/SUMMARY.md` (Phase A + Phase B sections) — type contract conventions and on-mount-refetch pattern recommendation
- `.planning/research/PITFALLS.md` — Pitfall 1 (no-cache discipline) and Pitfall 6 case 1 (0-games em-dash)
- `.planning/research/ARCHITECTURE.md` — layered convention `api → hooks → pages/components → types`
- `.planning/research/STACK.md` — confirms zero new dependencies for this phase
- `backend/routes/players_routes.py:31-90` — route shape, exception handling, response_model usage
- `backend/services/elo_service.py:84-115` — recompute cascade, baseline pattern, session-less service composition
- `backend/services/container.py:7-21` — `elo_service` singleton already wired
- `backend/repositories/elo_repository.py:32-87` — session pattern + existing query idioms (`get_changes_for_game`, `get_baseline_elo_before`)
- `backend/repositories/player_repository.py:57-75` — `get_all` and `bulk_update_elo` patterns (precedent for `get_active_players_ranked`)
- `backend/schemas/elo.py:1-9` — existing `EloChangeDTO` shape (Pydantic v2 BaseModel)
- `backend/schemas/player.py:35-43` — Optional field pattern (precedent for `PlayerEloSummaryDTO` nullables)
- `backend/schemas/player_profile.py:20-25` — confirms `PlayerProfileDTO.elo: int` already present in backend
- `backend/mappers/elo_mapper.py` — mapper convention (pure functions taking domain → DTO)
- `backend/tests/integration/test_elo_cascade.py:11-19` — `TestClient(app)` + Postgres-backed integration test pattern
- `backend/tests/integration/test_player_profile.py:12-42` — fixture pattern for service-level integration tests
- `backend/tests/conftest.py` — autouse `clean_tables` fixture
- `frontend/src/api/players.ts:10-17` — wrapper convention (mirror exactly for `api/elo.ts`)
- `frontend/src/api/client.ts:36-45` — `api.get<T>()` already typed-generic
- `frontend/src/types/index.ts:5-9, 37-42` — current state of `PlayerResponseDTO` and `PlayerProfileDTO` (drift confirmed: both lack `elo`)
- `frontend/src/pages/PlayerProfile/PlayerProfile.tsx:25-35, 75-97` — existing `Promise.all` and `statsCard` integration points
- `frontend/src/pages/PlayerProfile/PlayerProfile.module.css:38-81` — design tokens for `statsCard`, `statsGrid`, `statValue`, `statLabel`
- `frontend/src/index.css:1-50` — verified design tokens including `--color-success: #27ae60` (D-09 reuses this)
- `frontend/src/test/setup.ts` — current vitest setup (no Recharts/ResizeObserver mock needed for Phase 9 since no chart)
- `frontend/src/test/components/AchievementCard.test.tsx, TabBar.test.tsx` — component test patterns to mirror
- `.claude/CLAUDE.md` (project) — project rules: planning obligatorio, función >20 líneas → refactor, sin inline styling, mobile-first, CSS Modules
- `.claude/skills/{new-component,new-endpoint,test-backend}/SKILL.md` — scaffolding patterns referenced by the planner
- `.planning/config.json` — confirms `nyquist_validation: true` (Validation Architecture section is mandatory)

### Secondary (MEDIUM confidence)

- v1.1 SUMMARY.md sources cited there (Recharts, MultiSelect, formatDate research) — not directly relevant to Phase 9 since no chart, no MultiSelect, no date util involved.

### Tertiary (LOW confidence)

- None. Every claim in this research is grounded in a verified primary source.

## Project Constraints (from CLAUDE.md)

The project's `.claude/CLAUDE.md` directives (treated with the same authority as locked decisions):

1. **Planning obligatorio antes de código.** No implementation without explicit approval. Plan must split into small tasks, surface ambiguity. → Phase 9 honors this via the gsd-plan-phase flow that consumes this RESEARCH.md.
2. **Cada funcionalidad debe definir comportamiento esperado, criterios de verificación, casos borde, y tests.** → The Validation Architecture section above enumerates all four categories per requirement.
3. **No duplicar código. Refactor si función >20 líneas. Separar lógica y presentación.** → Card component sketch already extracts `formatDelta` and `deltaClass` helpers; service method composes 3 repository calls without duplication.
4. **Actualizar archivos de documentación .md desactualizados.** → After Phase 9 ships: REQUIREMENTS.md (mark PROF-01..04 as Validated), ROADMAP.md (mark Phase 9 complete), STATE.md (advance current_position), PROJECT.md (move ELO frontend items from Active to Validated), maybe `.planning/codebase/STRUCTURE.md` (note new EloSummaryCard / api/elo.ts).
5. **Frontend Rules: React funcional con hooks. Mobile-first. Componentes pequeños y reutilizables. Sin inline styling. CSS separado y reutilizable. Parametrizar colores y variables comunes.** → Every pattern in this research already complies. EloSummaryCard is functional + hooks-free (pure render). Mobile-first means hero card stacks naturally above the existing 3-tile grid which is already responsive. No inline styling — all colors via tokens.
6. **NEVER run pytest on host (memory `feedback_never_run_pytest_locally`).** → Validation Architecture section uses Docker commands only.
7. **Always use feature branches + PR workflow (memory `feedback_branch_workflow`).** → Already on `feature/v1.1-phase-9-elo-profile` per the git context.
8. **`feedback_review_before_commit`: never `git commit` until user explicitly approves diff.** → Honored by gsd-execute-phase commit-review gate (unless user pre-approves auto-commits).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; every recommended technology is already pinned in `package.json` / `requirements.txt`.
- Architecture: HIGH — every pattern cited is a direct read of an existing file with line range.
- Pitfalls: HIGH — Pitfalls 1, 2, 5 are direct cross-references to v1.1 PITFALLS.md (which itself was verified against this codebase). Pitfalls 3, 4, 6, 7 are derived from CONTEXT decisions (D-06, D-14, D-16, D-18) which lock the user-approved behavior.
- Validation Architecture: HIGH — backend and frontend test commands verified by reading `Makefile` reference (test-backend skill), `package.json` test script, and existing test files in both layers.

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (30 days — stable codebase, no fast-moving deps)

---
*Phase 9 research complete. Planner can now create PLAN.md files knowing: (a) zero new dependencies, (b) every locked decision is technically achievable, (c) every requirement has at least two corresponding test scenarios (one backend, one frontend), (d) every edge case from CONTEXT D-16 / D-17 / D-18 is mapped to a test, (e) every project rule from `.claude/CLAUDE.md` is honored.*
