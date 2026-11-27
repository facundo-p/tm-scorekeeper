# Phase 9: PlayerProfile ELO surface + frontend foundation - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 15 (7 new + 8 modified)
**Analogs found:** 14 / 15 (the one "no exact analog" is `frontend/src/test/components/PlayerProfile.test.tsx` — no PlayerProfile-page test currently exists in the repo)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/schemas/elo_summary.py` | schema/DTO | data-shape | `backend/schemas/elo.py` | exact |
| `backend/mappers/elo_summary_mapper.py` | mapper | transform | `backend/mappers/elo_mapper.py` | exact |
| `backend/tests/integration/test_elo_summary_endpoint.py` | test (integration) | request-response | `backend/tests/integration/test_elo_cascade.py` + `test_player_profile.py` | exact (composite) |
| `frontend/src/api/elo.ts` | api wrapper | request-response | `frontend/src/api/players.ts` + `frontend/src/api/achievements.ts` | exact |
| `frontend/src/components/EloSummaryCard/EloSummaryCard.tsx` | component (presentational) | prop-driven render | `frontend/src/components/AchievementCard/AchievementCard.tsx` | role-match |
| `frontend/src/components/EloSummaryCard/EloSummaryCard.module.css` | css module | styling | `frontend/src/components/AchievementCard/AchievementCard.module.css` + `pages/PlayerProfile/PlayerProfile.module.css` | exact |
| `frontend/src/test/components/EloSummaryCard.test.tsx` | test (component) | render+query | `frontend/src/test/components/AchievementCard.test.tsx` | exact |
| `backend/services/elo_service.py` (MODIFY) | service | composition | self (existing methods in same file `elo_service.py:84-115`) | exact |
| `backend/repositories/elo_repository.py` (MODIFY) | repository | session-scoped query | self (`get_baseline_elo_before` at `elo_repository.py:67-87`) | exact |
| `backend/repositories/player_repository.py` (MODIFY) | repository | session-scoped query | self (`get_all` at `player_repository.py:57-63`) | exact |
| `backend/routes/players_routes.py` (MODIFY) | route | request-response | self (`get_player_profile` at `players_routes.py:31-45`) | exact |
| `backend/services/container.py` (VERIFY) | DI wiring | lifecycle | self (existing `elo_service` registration at `container.py:17-21`) | no change expected |
| `frontend/src/types/index.ts` (MODIFY) | type definitions | data-shape | self (existing `PlayerProfileDTO` at `index.ts:37-42`) | exact |
| `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` (MODIFY) | page (smart container) | request-response + render | self (existing `useEffect` at `PlayerProfile.tsx:25-35`) | exact |
| `frontend/src/test/components/PlayerProfile.test.tsx` (NEW or MODIFY) | test (page) | render + mock fetch | `frontend/src/test/components/AchievementCard.test.tsx` (closest) | role-match (no page-test analog exists) |

---

## Pattern Assignments

### `backend/schemas/elo_summary.py` (NEW — schema/DTO)

**Analog:** `backend/schemas/elo.py`

**Imports + base class pattern** (`backend/schemas/elo.py:1-9`):
```python
from pydantic import BaseModel


class EloChangeDTO(BaseModel):
    player_id: str
    player_name: str
    elo_before: int
    elo_after: int
    delta: int
```

**Optional/nullable field pattern** (`backend/schemas/player.py:35-37`):
```python
class PlayerUpdateDTO(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    is_active: Optional[bool] = None
```

**Pattern to apply:** Two `BaseModel` classes (`EloRankDTO`, `PlayerEloSummaryDTO`) using `Optional[T] = None` for nullable fields per CONTEXT D-02. Imports: `from typing import Optional` + `from pydantic import BaseModel`. No `Field(...)` validators are required (no min/max constraints on raw ints).

**Note:** RESEARCH.md proposed adding these to `backend/schemas/elo.py`, but the file list specifies a new `backend/schemas/elo_summary.py`. The pattern is identical either way — single-file, multiple `BaseModel` classes, no business logic. Planner decides final file location; if separate file, mirror the imports/structure exactly.

---

### `backend/mappers/elo_summary_mapper.py` (NEW — mapper, OPTIONAL)

**Analog:** `backend/mappers/elo_mapper.py`

**Full file pattern** (`backend/mappers/elo_mapper.py:1-22`):
```python
from models.elo_change import EloChange
from schemas.elo import EloChangeDTO


def elo_change_to_dto(change: EloChange, player_name: str) -> EloChangeDTO:
    return EloChangeDTO(
        player_id=change.player_id,
        player_name=player_name,
        elo_before=change.elo_before,
        elo_after=change.elo_after,
        delta=change.delta,
    )
```

**Pattern to apply:** Module-level pure functions taking domain primitives → returning a DTO. No classes. No state. Direct kwarg construction.

**Conditional creation per RESEARCH §"Open Questions":** If `EloService.get_summary_for_player` already constructs `PlayerEloSummaryDTO` directly from primitives (current_elo, peak, last_delta, rank tuple), the transformation is genuinely 1:1 and the mapper is **unnecessary** — keep the construction inline in the service. Create this file ONLY if the service method exceeds 20 lines (project rule) and extracting the mapper helps. Either way, the mapper code below is the template:

```python
# Source: mirrors backend/mappers/elo_mapper.py:1-22 pattern exactly
from schemas.elo_summary import EloRankDTO, PlayerEloSummaryDTO


def to_summary_dto(
    current_elo: int,
    peak_elo: int | None,
    last_delta: int | None,
    rank: tuple[int, int] | None,
) -> PlayerEloSummaryDTO:
    return PlayerEloSummaryDTO(
        current_elo=current_elo,
        peak_elo=peak_elo,
        last_delta=last_delta,
        rank=EloRankDTO(position=rank[0], total=rank[1]) if rank else None,
    )
```

---

### `backend/tests/integration/test_elo_summary_endpoint.py` (NEW — integration test)

**Analog (primary):** `backend/tests/integration/test_elo_cascade.py` — TestClient + Postgres-backed pattern
**Analog (secondary):** `backend/tests/integration/test_player_profile.py` — service-level fixture + Player creation pattern
**Analog (tertiary):** `backend/tests/integration/test_achievements_routes.py` — endpoint-level GET test pattern

**TestClient + repo fixtures pattern** (`test_elo_cascade.py:7-30`):
```python
from datetime import date
import pytest
from fastapi.testclient import TestClient
from main import app
from models.player import Player


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def players_repo():
    from repositories.player_repository import PlayersRepository
    return PlayersRepository()


@pytest.fixture
def elo_repo():
    from repositories.elo_repository import EloRepository
    return EloRepository()
```

**Player seeding helper pattern** (`test_elo_cascade.py:83-87`):
```python
def _seed_three_players(players_repo) -> list[str]:
    players_repo.create(Player(player_id="p1", name="Alice"))
    players_repo.create(Player(player_id="p2", name="Bob"))
    players_repo.create(Player(player_id="p3", name="Cara"))
    return ["p1", "p2", "p3"]
```

**Game payload helpers pattern** (`test_elo_cascade.py:33-77`):
```python
_CORP_BY_PLAYER = {"p1": "Credicor", "p2": "Ecoline", "p3": "Helion"}


def _pr(player_id: str, terraform_rating: int) -> dict:
    return _player_result(player_id, terraform_rating, _CORP_BY_PLAYER[player_id])


def _game_payload(game_id: str, on_date: str, results: list[dict]) -> dict:
    return {
        "id": game_id,
        "date": on_date,
        "map": "Hellas",
        "expansions": [],
        "draft": False,
        "generations": 10,
        "player_results": results,
        "awards": [],
    }


def _post_game(client, payload: dict) -> str:
    res = client.post("/games/", json=payload)
    assert res.status_code == 200, res.json()
    return res.json()["id"]
```

**GET endpoint assertion pattern** (`test_achievements_routes.py:73-91`):
```python
def test_trigger_achievements_returns_200(client, players_repo):
    players_repo.create(Player(player_id="p1", name="Alice"))
    # ...post a game...
    response = client.get(f"/players/{player_id}/achievements")
    assert response.status_code == 200
    data = response.json()
    assert "achievements" in data
```

**Player-with-no-games branch pattern** (`test_player_profile.py:44-53`):
```python
def test_player_with_no_games_has_zero_stats(player_profile_service, players_repo):
    players_repo.create(Player(player_id="p1", name="Test", is_active=True))
    profile = player_profile_service.get_profile("p1")
    assert profile.stats.games_played == 0
    # ...
```

**`clean_tables` autouse fixture** (`backend/tests/conftest.py:12-17`) handles DB cleanup automatically — no per-test teardown needed.

**Pattern to apply:** Use `TestClient(app)` + reuse the `_seed_three_players` / `_pr` / `_game_payload` / `_post_game` helpers verbatim. Each test seeds players via `players_repo.create(Player(...))`, posts games via `client.post("/games/", ...)`, then asserts on `client.get(f"/players/{pid}/elo-summary").json()`. Cover the test scenarios enumerated in RESEARCH.md "Phase Requirements → Test Map" (lines 685-708): current_elo, last_delta after win, last_delta=null for 0-games, peak_elo, rank for active, tie-break by player_id, inactive excluded from total, inactive player gets null rank, single active player rank #1 of 1, summary reflects cascade after edit.

---

### `frontend/src/api/elo.ts` (NEW — api wrapper)

**Analog (primary):** `frontend/src/api/players.ts`
**Analog (secondary):** `frontend/src/api/achievements.ts`

**Imports + wrapper pattern** (`frontend/src/api/players.ts:1-17`):
```ts
import { api } from './client'
import type {
  PlayerResponseDTO,
  PlayerCreateDTO,
  PlayerUpdateDTO,
  PlayerCreatedResponseDTO,
  PlayerProfileDTO,
} from '@/types'

export function getPlayers(active?: boolean): Promise<PlayerResponseDTO[]> {
  const query = active == true ? `?active=${active}` : ''
  return api.get<PlayerResponseDTO[]>(`/players/${query}`)
}

export function getPlayerProfile(playerId: string): Promise<PlayerProfileDTO> {
  return api.get<PlayerProfileDTO>(`/players/${playerId}/profile`)
}
```

**Underlying `api.get<T>` typed-generic** (`frontend/src/api/client.ts:36-37`):
```ts
export const api = {
  get: <T>(path: string) => request<T>(path),
  // ...
}
```

**Pattern to apply:** Single-line wrapper exporting one function `getEloSummary(playerId: string): Promise<PlayerEloSummaryDTO>` that returns `api.get<PlayerEloSummaryDTO>(\`/players/${playerId}/elo-summary\`)`. NO retry logic. NO catching. NO caching. Imports use `@/types` alias and `./client`. The full file should be ~5 lines + import block — strictly mirrors `getPlayerProfile`.

---

### `frontend/src/components/EloSummaryCard/EloSummaryCard.tsx` (NEW — component)

**Analog:** `frontend/src/components/AchievementCard/AchievementCard.tsx`

**File-level pattern** (`AchievementCard.tsx:1-13`):
```tsx
import AchievementIcon from '@/components/AchievementIcon/AchievementIcon'
import ProgressBar from '@/components/ProgressBar/ProgressBar'
import styles from './AchievementCard.module.css'

interface AchievementCardProps {
  title: string
  description: string
  fallback_icon: string
  tier: number
  unlocked: boolean
  progress: { current: number; target: number } | null
  onClick?: () => void
}

export default function AchievementCard({
  title,
  // ...
}: AchievementCardProps) {
```

**Conditional rendering of nullable fields** (`AchievementCard.tsx:51-58`):
```tsx
{progress !== null && (
  <div className={styles.progressWrapper}>
    <ProgressBar value={progressPercentage} />
  </div>
)}
{counter !== undefined && (
  <span className={styles.counter}>{counter}</span>
)}
```

**Helper extracted above component (project rule "función >20 líneas → refactor"):** see RESEARCH §"Pattern 7" `formatDelta` and `deltaClass` helpers. Full HTML skeleton + helpers are spelled out in `09-UI-SPEC.md:251-298` — the planner should treat that as the authoritative implementation contract and use this analog only for *file structure* (default export, named interface, `import styles from './*.module.css'`).

**Pattern to apply:**
1. Default export.
2. Single Props interface declared above the component.
3. `import styles from './EloSummaryCard.module.css'`.
4. Use `import type { PlayerEloSummaryDTO } from '@/types'`.
5. Branch on each nullable with `{value !== null && (...)}` (mirror line 51 above).
6. Extract helpers above the component to keep render body ≤20 lines.

---

### `frontend/src/components/EloSummaryCard/EloSummaryCard.module.css` (NEW — CSS Module)

**Analog (primary — card chrome):** `frontend/src/pages/PlayerProfile/PlayerProfile.module.css` (`.statsCard` at lines 38-43)
**Analog (secondary — module structure):** `frontend/src/components/AchievementCard/AchievementCard.module.css`

**Card chrome pattern** (`PlayerProfile.module.css:38-43`):
```css
.statsCard {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
}
```

**Module-style class organization** (`AchievementCard.module.css:1-21`):
```css
.card {
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: default;
}

.rightColumn {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
```

**Verified design tokens to reuse** (from `frontend/src/index.css:1-44`):
- `--color-surface` (#2c1810) — card background
- `--color-border` (#4a2c1a) — 1px border
- `--color-text` (#f5e6d3) — hero number
- `--color-text-muted` (#a89080) — sub-row text + ±0 delta
- `--color-success` (#27ae60) — positive delta (verified `index.css:13`)
- `--color-error` (#e74c3c) — negative delta (verified `index.css:15`)
- `--border-radius-lg` (12px) — card corner radius
- `--spacing-xs/sm/md/lg` (4/8/16/24px) — gaps and padding
- `--font-size-base/xl/3xl` (16/20/30px) — sub-row / label+delta / hero
- `--font-weight-normal` (400) and `--font-weight-bold` (700)

**Pattern to apply:** Full CSS spelled out in `09-UI-SPEC.md:303-363` (authoritative). The card chrome (`background-color`, `border`, `border-radius`, `padding: var(--spacing-lg)`) is a **direct copy** of `.statsCard` — same design tokens, same values. Internal layout (`display: flex; flex-direction: column; gap: var(--spacing-md)` for the card; `flex-wrap: wrap` for the hero row) is novel but uses only existing tokens. **Zero new design tokens** per D-09.

---

### `frontend/src/test/components/EloSummaryCard.test.tsx` (NEW — component test)

**Analog:** `frontend/src/test/components/AchievementCard.test.tsx`

**Imports + base props pattern** (`AchievementCard.test.tsx:1-12`):
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AchievementCard from '@/components/AchievementCard/AchievementCard'

const baseProps = {
  title: 'Test Achievement',
  description: 'Test description',
  fallback_icon: 'trophy',
  tier: 2,
  unlocked: true,
  progress: null,
}
```

**Branch-coverage test pattern** (`AchievementCard.test.tsx:14-48`):
```tsx
describe('AchievementCard', () => {
  it('renders title text', () => {
    render(<AchievementCard {...baseProps} />)
    expect(screen.getByText('Test Achievement')).toBeInTheDocument()
  })

  it('shows ProgressBar when progress is not null', () => {
    render(
      <AchievementCard
        {...baseProps}
        progress={{ current: 2, target: 5 }}
      />,
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('hides progress bar and counter when progress is null', () => {
    render(<AchievementCard {...baseProps} progress={null} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
  })
})
```

**CSS class assertion pattern** (`AchievementCard.test.tsx:66-72`):
```tsx
it('applies unlocked CSS class when unlocked=true', () => {
  const { container } = render(
    <AchievementCard {...baseProps} unlocked={true} />,
  )
  const card = container.firstChild as HTMLElement
  expect(card.className).toMatch(/unlocked/)
})
```

**aria-label query pattern** (analog from `TabBar.test.tsx:15-19`):
```tsx
it('active tab has aria-selected="true"', () => {
  render(<TabBar activeTab="records" onTabChange={() => {}} />)
  const recordsTab = screen.getByText('Records').closest('button')
  expect(recordsTab?.getAttribute('aria-selected')).toBe('true')
})
```

**Pattern to apply:**
1. Top-level `baseProps` object (full `PlayerEloSummaryDTO` shape with sample non-null values).
2. One `describe('EloSummaryCard', ...)` block.
3. One `it(...)` per branch in the render contract (UI-SPEC.md table at lines 232-246):
   - `renders current_elo`, `renders em-dash for zero games (last_delta === null)`,
   - `positive delta uses success class` / `negative delta uses error class` / `zero delta uses muted class`,
   - `delta has aria-label`, `delta hidden when null`,
   - `peak equals current shows actual suffix`, `peak greater than current omits suffix`, `peak hidden when null`,
   - `renders rank "#3 de 8"`, `renders rank "#1 de 1"`, `rank hidden when null`.
4. Use `screen.getByText`, `screen.queryByText`, `container.firstChild` + `className.toMatch(/className/)` exactly as the analog does.
5. For `aria-label`: use `screen.getByLabelText('Cambio de ELO en la última partida: +23')` (already supported via Testing Library defaults — no new setup).

---

### `backend/services/elo_service.py` (MODIFY — add method)

**Analog:** the existing methods inside the same file (`backend/services/elo_service.py:84-115`).

**Composition pattern (no session held in service)** (`elo_service.py:84-97`):
```python
def recompute_from_date(self, start_date: date) -> None:
    baseline = self._build_baseline(start_date)
    self.elo_repository.delete_changes_from_date(start_date)
    games = self.games_repository.list_games_from_date(start_date)
    self._walk_and_persist(games, baseline)
    self.players_repository.bulk_update_elo(baseline)


def recompute_all(self) -> None:
    self.recompute_from_date(date.min)


def _build_baseline(self, start_date: date) -> dict[str, int]:
    baseline = {p.player_id: DEFAULT_ELO for p in self.players_repository.get_all()}
    baseline.update(self.elo_repository.get_baseline_elo_before(start_date))
    return baseline
```

**Constructor (already wired with both repos needed)** (`elo_service.py:79-82`):
```python
def __init__(self, elo_repository, players_repository, games_repository):
    self.elo_repository = elo_repository
    self.players_repository = players_repository
    self.games_repository = games_repository
```

**Pattern to apply:** Add `get_summary_for_player(self, player_id: str) -> PlayerEloSummaryDTO` as a public method on the existing `EloService` class. Mirror the composition idiom: call `self.players_repository.get(player_id)` (which raises `KeyError` → routed to 404 by the route layer — same idiom as `get_player_profile` at `players_routes.py:38-45`), then call new repository methods for peak/last-change/rank-list, then construct the DTO. **No session opened in the service.** Keep method ≤20 lines (project rule); extract helpers (`_compute_rank`, `_to_summary_dto`) if it grows. Full sketch in RESEARCH.md "Pattern 3" (lines 326-357) — including the docstring documenting tie-break per CONTEXT D-06.

---

### `backend/repositories/elo_repository.py` (MODIFY — add 2 query methods)

**Analog:** existing methods in same file (`backend/repositories/elo_repository.py:32-87`).

**Session-scoped query pattern** (`elo_repository.py:32-47`):
```python
def get_changes_for_game(self, game_id: str) -> list[EloChange]:
    with self._session_factory() as session:
        orms = (
            session.query(PlayerEloHistoryORM)
            .filter(PlayerEloHistoryORM.game_id == game_id)
            .all()
        )
        return [
            EloChange(
                player_id=o.player_id,
                elo_before=o.elo_before,
                elo_after=o.elo_after,
                delta=o.delta,
            )
            for o in orms
        ]
```

**Aggregate scalar pattern** (extends `get_baseline_elo_before` at `elo_repository.py:67-87` style — needs new `from sqlalchemy import func` import):
```python
# Source: extends backend/repositories/elo_repository.py:67-87 + adds func.max
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

**ORDER BY + first() pattern** (extends `get_baseline_elo_before` order-by idiom at `elo_repository.py:77-81`):
```python
def get_last_change_for_player(self, player_id: str) -> EloChange | None:
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

**Pattern to apply:** Add two methods to `EloRepository` mirroring the `with self._session_factory() as session: ... session.query(...).filter(...).first()/scalar()` idiom. ORM model is already imported as `PlayerEloHistoryORM` (line 4). The domain model `EloChange` is already imported (line 5). Add `from sqlalchemy import func` for the aggregate.

---

### `backend/repositories/player_repository.py` (MODIFY — add 1 query method)

**Analog:** `get_all` in same file (`backend/repositories/player_repository.py:57-63`).

**list-with-filter-and-order pattern** (`player_repository.py:57-63`):
```python
def get_all(self) -> list[Player]:
    with self._session_factory() as session:
        orms = session.query(PlayerORM).all()
        return [
            Player(player_id=o.id, name=o.name, is_active=o.is_active, elo=o.elo)
            for o in orms
        ]
```

**Pattern to apply:**
```python
# Source: extends backend/repositories/player_repository.py:57-63 with filter + order_by
def get_active_players_ranked(self) -> list[Player]:
    """Returns active players ordered by elo DESC, tie-break by player_id ASC.

    Position = index+1 in this list, total = len(this list). Order is
    deterministic (CONTEXT D-06).
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

ORM model `PlayerORM` and domain `Player` are already imported (`player_repository.py:4-5`). No new imports required.

---

### `backend/routes/players_routes.py` (MODIFY — add route)

**Analog:** `get_player_profile` route in same file (`backend/routes/players_routes.py:31-45`).

**Route + try/except KeyError → 404 pattern** (`players_routes.py:31-45`):
```python
@router.get("/{player_id}/profile", response_model=PlayerProfileDTO)
def get_player_profile(player_id: str):
    """
    Devuelve el perfil agregado de un jugador:
    - estadísticas
    - historial de partidas
    """
    try:
        return player_profile_service.get_profile(player_id)
    except KeyError:
        # El repo no encontró el jugador
        raise HTTPException(
            status_code=404,
            detail=f"Player '{player_id}' not found",
        )
```

**Service-import-from-container pattern** (`players_routes.py:8`):
```python
from services.container import achievements_service
```

**Pattern to apply:**
1. Import `elo_service` from `services.container` (the singleton already exists per `services/container.py:17-21`).
2. Import `PlayerEloSummaryDTO` from the new schema module (`backend/schemas/elo_summary.py` if separate, or `schemas.elo` if added there).
3. Add a `@router.get("/{player_id}/elo-summary", response_model=PlayerEloSummaryDTO)` decorator function at the end of the file (or after `get_player_profile`).
4. Body = single `try/except KeyError: raise HTTPException(404, ...)` block delegating to `elo_service.get_summary_for_player(player_id)` — verbatim copy of the analog idiom.

---

### `backend/services/container.py` (VERIFY — no change expected)

**Analog:** itself.

**Existing registration** (`backend/services/container.py:17-21`):
```python
elo_service = EloService(
    elo_repository=elo_repository,
    players_repository=players_repository,
    games_repository=games_repository,
)
```

`EloService` is already a singleton with all three repositories injected — no rewiring needed when adding the new `get_summary_for_player` method. Planner should add a verification checklist item: "import `elo_service` from `services.container` in `players_routes.py` — no new container entry needed."

---

### `frontend/src/types/index.ts` (MODIFY — add 4 entries + drift fixes)

**Analog:** existing DTOs in same file.

**Mirror-from-backend pattern** (`frontend/src/types/index.ts:5-9`):
```ts
export interface PlayerResponseDTO {
  player_id: string
  name: string
  is_active: boolean
}
```

(currently MISSING `elo: number` — backend has it at `backend/schemas/player.py:39-43`. This is the drift to fix.)

**`PlayerProfileDTO` current state** (`frontend/src/types/index.ts:37-42`):
```ts
export interface PlayerProfileDTO {
  player_id: string
  stats: PlayerStatsDTO
  games: PlayerGameSummaryDTO[]
  records: Record<string, boolean>
}
```

(currently MISSING `elo: number` — backend has it at `backend/schemas/player_profile.py:22`. Second drift fix.)

**Nested-DTO + nullable pattern** (`frontend/src/types/index.ts:131-139`):
```ts
export interface RecordComparisonDTO {
  code: string
  title: string | null
  emoji: string | null
  description: string
  achieved: boolean
  compared: RecordResultDTO | null
  current: RecordResultDTO
}
```

**Pattern to apply:** Apply 4 changes to `index.ts`:
1. Add `elo: number` field to `PlayerResponseDTO` (drift fix per CONTEXT D-12).
2. Add `elo: number` field to `PlayerProfileDTO` (drift fix per CONTEXT D-12).
3. Add new `EloChangeDTO` interface mirroring `backend/schemas/elo.py:4-9` exactly:
   ```ts
   export interface EloChangeDTO {
     player_id: string
     player_name: string
     elo_before: number
     elo_after: number
     delta: number
   }
   ```
4. Add new `EloRankDTO` and `PlayerEloSummaryDTO` interfaces matching CONTEXT D-02 shape (full TS shape spelled out in `09-UI-SPEC.md:218-229`):
   ```ts
   export interface EloRankDTO {
     position: number
     total: number
   }

   export interface PlayerEloSummaryDTO {
     current_elo: number
     peak_elo: number | null
     last_delta: number | null
     rank: EloRankDTO | null
   }
   ```

Place them in a new `// ---- ELO DTOs ----` section, mirroring the existing section comment style (lines 3, 44, 69, 78, 101, 117).

---

### `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` (MODIFY — extend Promise.all + render card)

**Analog:** itself (existing `useEffect` at `PlayerProfile.tsx:25-35` and Stats tab structure at `PlayerProfile.tsx:75-97`).

**Existing `Promise.all` pattern to extend** (`PlayerProfile.tsx:25-35`):
```tsx
useEffect(() => {
  if (!playerId) return
  Promise.all([getPlayerProfile(playerId), getPlayers()])
    .then(([profileData, playersData]) => {
      setProfile(profileData)
      const found = playersData.find((p) => p.player_id === playerId)
      setPlayerName(found?.name ?? playerId)
    })
    .catch(() => setError('No se pudo cargar el perfil del jugador.'))
    .finally(() => setLoading(false))
}, [playerId])
```

**Existing state-declaration idiom** (`PlayerProfile.tsx:14-23`):
```tsx
const { playerId } = useParams<{ playerId: string }>()
const [profile, setProfile] = useState<PlayerProfileDTO | null>(null)
const [playerName, setPlayerName] = useState('')
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

const [activeTab, setActiveTab] = useState<Tab>('stats')
const [achievements, setAchievements] = useState<PlayerAchievementDTO[] | null>(null)
const [loadingAchievements, setLoadingAchievements] = useState(false)
const [achievementsError, setAchievementsError] = useState('')
```

**Existing Stats-tab section ordering** (`PlayerProfile.tsx:77-97`):
```tsx
{activeTab === 'stats' && (
  <>
    <section className={styles.statsCard}>
      <h2 className={styles.sectionTitle}>Estadísticas</h2>
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          {/* ... 3-tile grid ... */}
        </div>
      </div>
    </section>
    {/* ...Historial section follows... */}
  </>
)}
```

**Lazy-load-on-tab-switch pattern (precedent for inline catch isolation)** (`PlayerProfile.tsx:38-45`):
```tsx
const handleTabChange = (tab: Tab) => {
  setActiveTab(tab)
  if (tab === 'logros' && achievements === null && !loadingAchievements) {
    setLoadingAchievements(true)
    getPlayerAchievements(playerId!)
      .then(res => setAchievements(res.achievements))
      .catch(() => setAchievementsError('No se pudo cargar los logros. Intentá de nuevo.'))
      .finally(() => setLoadingAchievements(false))
  }
}
```

This is the precedent for "inline-fetch with isolated catch" — D-14 mandates the same idiom (catch isolated so summary failure does not affect profile).

**Pattern to apply:**
1. Add `const [eloSummary, setEloSummary] = useState<PlayerEloSummaryDTO | null>(null)` next to other state at line 15.
2. Import `getEloSummary` from `@/api/elo` and `PlayerEloSummaryDTO` from `@/types`.
3. Import `EloSummaryCard` from `@/components/EloSummaryCard/EloSummaryCard`.
4. Extend the `useEffect` per CONTEXT D-14 — preferred shape per RESEARCH §"Pattern 6":
   ```tsx
   const profilePromise = Promise.all([getPlayerProfile(playerId), getPlayers()])
   const summaryPromise = getEloSummary(playerId).catch(() => null)

   Promise.all([profilePromise, summaryPromise])
     .then(([[profileData, playersData], summaryData]) => {
       setProfile(profileData)
       const found = playersData.find((p) => p.player_id === playerId)
       setPlayerName(found?.name ?? playerId)
       setEloSummary(summaryData)
     })
     .catch(() => setError('No se pudo cargar el perfil del jugador.'))
     .finally(() => setLoading(false))
   ```
5. In the Stats-tab fragment, insert `{eloSummary && <EloSummaryCard summary={eloSummary} />}` ABOVE the existing `<section className={styles.statsCard}>` (CONTEXT D-08).
6. Do NOT add cache, retry, or hooks — D-19 is load-bearing.

---

### `frontend/src/pages/PlayerProfile/PlayerProfile.module.css` (LIKELY NO CHANGE)

The new card owns its own CSS via `EloSummaryCard.module.css`. Parent `<main>` already supplies `gap: var(--spacing-lg)` between siblings (`PlayerProfile.module.css:31`) so the new card stacks naturally above the existing `.statsCard` with the same vertical rhythm. **Expected: zero changes.** If a wrapper class is needed, add it; otherwise, do not touch.

---

### `frontend/src/test/components/PlayerProfile.test.tsx` (NEW or EXTEND — page test)

**No exact analog** — `frontend/src/test/components/` has no `PlayerProfile.test.tsx` today (verified via `ls`: only AchievementCard / AchievementBadgeMini / AchievementCatalog / AchievementIcon / AchievementModal / GameRecords / Login / ProgressBar / StepAwards / StepMilestones / TabBar tests).

**Closest role-match analog:** `frontend/src/test/components/AchievementCard.test.tsx` — gives the vitest + Testing Library + describe/it idiom and the file location convention.

**Mocking gap:** None of the existing test files mock `react-router-dom` `useParams` or the `@/api/*` modules. The planner will need to introduce the standard Vitest mock pattern:
```tsx
import { vi } from 'vitest'

vi.mock('@/api/elo', () => ({
  getEloSummary: vi.fn(),
}))
vi.mock('@/api/players', () => ({
  getPlayerProfile: vi.fn(),
  getPlayers: vi.fn(),
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useParams: () => ({ playerId: 'p1' }) }
})
```

This is greenfield for the test layer — no existing precedent in `frontend/src/test/components/`. The planner should treat this test file as **optional but recommended** per RESEARCH §"Wave 0 Gaps" (line 708). Required scenario per CONTEXT D-14: assert that when `getEloSummary` rejects, profile still renders (no error banner about ELO, no card, but the profile content is visible).

**Pattern to apply (when created):**
1. Vitest + Testing Library imports from analog `AchievementCard.test.tsx:1-3`.
2. Mocks (above) at top of file.
3. Wrap `<PlayerProfile />` in `<MemoryRouter>` (standard Testing-Library + react-router idiom).
4. One `it('summary failure does not block profile')` test that resolves `getPlayerProfile` + `getPlayers` and rejects `getEloSummary`, then asserts profile content is visible AND the EloSummaryCard is absent.

---

## Shared Patterns

### Service singleton via container (backend)

**Source:** `backend/services/container.py:17-21`
**Apply to:** `backend/routes/players_routes.py` (the new endpoint imports `elo_service` from this module)

```python
elo_service = EloService(
    elo_repository=elo_repository,
    players_repository=players_repository,
    games_repository=games_repository,
)
```

**Already present** — no change needed in `services/container.py`. The route just imports it.

---

### KeyError → HTTP 404 (backend)

**Source:** `backend/routes/players_routes.py:31-45` (`get_player_profile`) and `backend/routes/players_routes.py:58-69` (`update_player`)
**Apply to:** new `get_player_elo_summary` route — repos raise `KeyError` (verified `players_repository.py:38`); the route catches and converts.

```python
try:
    return elo_service.get_summary_for_player(player_id)
except KeyError:
    raise HTTPException(
        status_code=404,
        detail=f"Player '{player_id}' not found",
    )
```

---

### Session-scoped query (backend repository)

**Source:** `backend/repositories/elo_repository.py:32-47` and `backend/repositories/player_repository.py:57-63`
**Apply to:** all 3 new repository methods (`get_peak_for_player`, `get_last_change_for_player`, `get_active_players_ranked`)

Pattern: `with self._session_factory() as session: ... session.query(ORM).filter(...).order_by(...).first()/all()/scalar()`. The session never escapes. Domain models constructed from ORM via list comprehension or direct kwarg construction.

---

### Pydantic v2 BaseModel with Optional fields (backend schemas)

**Source:** `backend/schemas/player.py:35-37` and `backend/schemas/elo.py:1-9`
**Apply to:** new `PlayerEloSummaryDTO` and `EloRankDTO` (in `backend/schemas/elo_summary.py` or appended to `backend/schemas/elo.py` per planner choice)

```python
from typing import Optional
from pydantic import BaseModel

class PlayerEloSummaryDTO(BaseModel):
    current_elo: int
    peak_elo: Optional[int] = None
    last_delta: Optional[int] = None
    rank: Optional[EloRankDTO] = None
```

`Optional[T] = None` (not `T | None`) is the convention used elsewhere in the project (`schemas/player.py:35-37`).

---

### Frontend api wrapper (no caching, no retry, typed-generic via `api.get<T>`)

**Source:** `frontend/src/api/players.ts:15-17` and `frontend/src/api/achievements.ts:8-10`
**Apply to:** new `frontend/src/api/elo.ts`

```ts
export function getEloSummary(playerId: string): Promise<PlayerEloSummaryDTO> {
  return api.get<PlayerEloSummaryDTO>(`/players/${playerId}/elo-summary`)
}
```

D-19 forbids any caching layer in the wrapper. The `api.get<T>` already throws `ApiError` on non-2xx (`client.ts:21-29`).

---

### CSS Module + design-token discipline (frontend)

**Source:** `frontend/src/components/AchievementCard/AchievementCard.module.css` and `frontend/src/pages/PlayerProfile/PlayerProfile.module.css`
**Apply to:** `EloSummaryCard.module.css`

Rules verified throughout the analogs:
- All colors use `var(--color-*)` — never hex literals.
- All spacing uses `var(--spacing-*)` — never raw pixel values (one minor exception in `AchievementCard.module.css:4` uses `gap: 12px` directly; the new CSS should NOT replicate this anti-pattern, use `var(--spacing-md)` instead).
- Border radius via `var(--border-radius-lg)` for cards.
- No inline styles in TSX (project rule).

---

### Vitest + Testing Library component tests (frontend)

**Source:** `frontend/src/test/components/AchievementCard.test.tsx`
**Apply to:** `EloSummaryCard.test.tsx` and the (new) `PlayerProfile.test.tsx`

Pattern:
- `import { describe, it, expect } from 'vitest'`
- `import { render, screen } from '@testing-library/react'`
- One `describe(ComponentName, ...)` block with one `it(...)` per branch
- `screen.getByText` / `screen.queryByText` for presence and absence
- `container.firstChild as HTMLElement` + `className.toMatch(/className/)` for CSS-class assertions
- `screen.getByLabelText('...')` for `aria-label` queries (a11y-friendly testing)

For the optional `PlayerProfile.test.tsx`: add `vi.mock(...)` for `@/api/elo`, `@/api/players`, and `react-router-dom` per the gap noted above — no precedent in the existing test directory.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `frontend/src/test/components/PlayerProfile.test.tsx` | test (page-level) | render + mocked fetch | No existing PlayerProfile-page test in the repo (`ls frontend/src/test/components/` confirmed). Closest analog is `AchievementCard.test.tsx` for the test-file scaffolding (vitest + Testing Library), but the `vi.mock(...)` of api modules and `react-router-dom` is a NEW pattern this phase introduces. Component-level tests use no mocking today — this is the first page-level test that requires it. Treat as greenfield within the test layer; planner should consult Vitest docs for the standard mock idiom. RESEARCH.md flagged this in "Wave 0 Gaps" (line 708) as optional but recommended for D-14 coverage. |

---

## Metadata

**Analog search scope:**
- `backend/{schemas,mappers,services,repositories,routes,tests/integration}/*.py`
- `frontend/src/{api,components,pages,types,test/components}/**/*.{ts,tsx,css}`
- `frontend/src/index.css` (design tokens verification)

**Files scanned:** 21 source files read directly + verified directory listings for `frontend/src/test/components/` and `backend/tests/integration/`.

**Pattern extraction date:** 2026-04-29

**Cross-references:**
- All architectural decisions (D-01..D-20) sourced from `09-CONTEXT.md`.
- All code-shape patterns sourced from RESEARCH.md "Architecture Patterns" §lines 118-505 (Patterns 1-7).
- All UI implementation contracts sourced from `09-UI-SPEC.md` (especially the CSS Module sketch at lines 303-363 and the render contract table at lines 232-246).
