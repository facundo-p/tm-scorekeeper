# Architecture Research

**Domain:** Achievement system integration into existing layered FastAPI + React app
**Researched:** 2026-03-23
**Confidence:** HIGH (based on direct codebase inspection + established patterns)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React + TS)                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  GameDetail  │  │ PlayerProfile│  │  AchievementCatalog  │   │
│  │  (end-game   │  │  (full badge │  │  (global view,       │   │
│  │   mini toast)│  │   grid)      │  │   who has what)      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         └─────────────────┴──────────────────────┘               │
│                             │ api/achievements.ts                 │
├─────────────────────────────┼────────────────────────────────────┤
│                        Backend (FastAPI)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │               achievements_routes.py                         │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                              │                                    │
│  ┌───────────────────────────┼────────────────────────────────┐  │
│  │           Services Layer  │                                  │  │
│  │  ┌────────────────────┐  ┌┴───────────────────────────┐    │  │
│  │  │  GamesService      │  │  AchievementsService        │    │  │
│  │  │  (existing)        │──│  evaluate_game()            │    │  │
│  │  │  create_game() ────┼─►│  get_player_achievements()  │    │  │
│  │  └────────────────────┘  │  get_catalog()              │    │  │
│  │                          └──────────┬──────────────────┘    │  │
│  │  ┌───────────────────────────────┐  │                        │  │
│  │  │  Evaluators (strategy layer)  │◄─┘                        │  │
│  │  │  ALL_EVALUATORS registry      │                           │  │
│  │  │  SingleGameThresholdEvaluator │                           │  │
│  │  │  AccumulatedEvaluator         │                           │  │
│  │  │  WinStreakEvaluator (custom)  │                           │  │
│  │  └───────────────────────────────┘                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Repositories Layer                                          │ │
│  │  GamesRepository (existing)   AchievementsRepository (new)  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Database (PostgreSQL)                                        │ │
│  │  players  games  player_results  awards  player_achievements │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Backend:**

| Component | Responsibility | Location |
|-----------|----------------|----------|
| `AchievementDefinition` | Static metadata: code, description, icon, tiers, show_progress | `services/achievement_evaluators/definitions.py` |
| `AchievementEvaluator` (ABC) | compute_tier(), get_progress(), evaluate() contract | `services/achievement_evaluators/base.py` |
| `SingleGameThresholdEvaluator` | Generic: max value in a single game vs tier thresholds | `services/achievement_evaluators/single_game.py` |
| `AccumulatedEvaluator` | Generic: count over all games vs tier thresholds + progress | `services/achievement_evaluators/accumulated.py` |
| Custom evaluators (e.g. WinStreak) | Complex logic that doesn't fit generic shapes | `services/achievement_evaluators/win_streak.py` |
| `ALL_EVALUATORS` registry | Single source of truth; iterate to evaluate all achievements | `services/achievement_evaluators/registry.py` |
| `AchievementsService` | Orchestrates evaluation + persistence + catalog assembly | `services/achievements_service.py` |
| `AchievementsRepository` | CRUD on `player_achievements` table | `repositories/achievements_repository.py` |
| `achievements_routes.py` | HTTP endpoints; injects dependencies | `routes/achievements_routes.py` |
| `PlayerAchievement` (ORM) | DB row: player_id, code, tier, unlocked_at | `db/models.py` |

**Frontend:**

| Component | Responsibility | Location |
|-----------|----------------|----------|
| `api/achievements.ts` | Typed fetch wrappers for all achievement endpoints | `src/api/achievements.ts` |
| `AchievementBadge` | Single badge: icon + tier indicator, unlocked/locked state | `src/components/AchievementBadge/` |
| `AchievementBadgeMini` | Compact badge for end-game notification (icon + title only) | `src/components/AchievementBadgeMini/` |
| `AchievementsSection` | Badge grid for player profile; groups unlocked vs locked | `src/components/AchievementsSection/` |
| `NewAchievementsToast` | Post-game modal/panel; lists newly unlocked or upgraded achievements | `src/components/NewAchievementsToast/` |
| `PlayerProfile` (modified) | Gains a third section tab: Logros | `src/pages/PlayerProfile/` |
| `AchievementCatalog` | Global page: all achievements + who holds each | `src/pages/AchievementCatalog/` |

## Recommended Project Structure

```
backend/
├── services/
│   ├── achievement_evaluators/   # mirrors record_calculators/
│   │   ├── __init__.py
│   │   ├── base.py               # AchievementEvaluator ABC + AchievementDefinition
│   │   ├── definitions.py        # AchievementDefinition instances (HIGH_SCORE, etc.)
│   │   ├── single_game.py        # SingleGameThresholdEvaluator
│   │   ├── accumulated.py        # AccumulatedEvaluator
│   │   ├── win_streak.py         # WinStreakEvaluator (custom)
│   │   └── registry.py           # ALL_EVALUATORS list
│   └── achievements_service.py   # evaluate_game(), get_player_achievements(), get_catalog()
├── repositories/
│   └── achievements_repository.py
├── schemas/
│   └── achievements.py           # PlayerAchievementDTO, AchievementCatalogItemDTO
├── routes/
│   └── achievements_routes.py
└── db/
    └── models.py                 # + PlayerAchievement ORM model

frontend/src/
├── api/
│   └── achievements.ts
├── components/
│   ├── AchievementBadge/
│   │   ├── AchievementBadge.tsx
│   │   └── AchievementBadge.module.css
│   ├── AchievementBadgeMini/
│   │   ├── AchievementBadgeMini.tsx
│   │   └── AchievementBadgeMini.module.css
│   ├── AchievementsSection/
│   │   ├── AchievementsSection.tsx
│   │   └── AchievementsSection.module.css
│   └── NewAchievementsToast/
│       ├── NewAchievementsToast.tsx
│       └── NewAchievementsToast.module.css
├── pages/
│   └── AchievementCatalog/
│       ├── AchievementCatalog.tsx
│       └── AchievementCatalog.module.css
└── types/
    └── index.ts                  # + achievement type interfaces
```

### Structure Rationale

- **`achievement_evaluators/`:** Mirrors `record_calculators/` exactly. Same separation of base/concrete/registry. Developers already understand the pattern.
- **`achievements_service.py`:** Single service for all achievement logic keeps the route layer thin and testable in isolation.
- **`AchievementBadge` vs `AchievementBadgeMini`:** Two distinct visual shapes (full profile card vs end-game toast item). Different responsibilities, different CSS. Avoid a single over-parametrized badge.

## Architectural Patterns

### Pattern 1: Post-creation side effect via service coordination

**What:** `GamesService.create_game()` calls `AchievementsService.evaluate_game()` after persisting the game. The route layer injects `AchievementsService` into `GamesService` (or the route calls both services sequentially).

**When to use:** The game creation is the trigger for achievement evaluation. The two operations are coupled by domain logic, not infrastructure.

**Trade-offs:** Injecting into GamesService keeps `create_game` the single entry point and the route stays thin. Calling both from the route is simpler but leaks orchestration concern. Recommend injection.

**Example:**
```python
# games_routes.py — route injects achievements_service
games_service = GamesService(
    games_repository=games_repository,
    players_repository=players_repository,
    achievements_service=achievements_service,   # injected
)

# game_service.py
def create_game(self, game_dto: GameDTO) -> tuple[str, list[EvaluationResult]]:
    # ... validation ...
    game_id = self.games_repository.create(game)
    unlocked = self.achievements_service.evaluate_game(game_id)
    return game_id, unlocked
```

The route then returns both the created game ID and the list of newly unlocked achievements in `GameCreatedResponseDTO`.

### Pattern 2: Definitions in code, state in DB

**What:** `AchievementDefinition` objects (with tiers, icons, descriptions) live in Python modules and are never stored in the database. Only `player_achievements` rows (player_id, code, tier, unlocked_at) are persisted.

**When to use:** Always, for this project. Consistent with how record calculators work. Avoids a "definitions migration" every time a new achievement is added.

**Trade-offs:** Changing a tier threshold requires a reconciler pass to fix stale persisted tiers. Acceptable because it's infrequent and the reconciler handles it explicitly.

### Pattern 3: On-demand progress computation

**What:** Progress toward the next tier (e.g. "7/10 games") is computed at query time in `AchievementsService.get_player_achievements()`. It is never stored. The service loads all games for the player, runs `evaluator.get_progress()`, and returns it in the DTO.

**When to use:** Progress changes with every game, so persisting it adds write overhead with no benefit.

**Trade-offs:** Requires loading all player games for the progress query. Acceptable at current scale (small number of games per player). If it becomes a bottleneck, denormalized counts could be added later.

### Pattern 4: Tier-as-upgrade, single row per achievement

**What:** Each player has at most one `player_achievements` row per achievement `code`. When a tier is upgraded, the row is updated (not a new row inserted). `unlocked_at` is set on first unlock and never changed.

**When to use:** Always. Matches the "badge evolves" UX requirement and avoids having to deduplicate multiple rows on read.

**Trade-offs:** Losing the upgrade history. Acceptable — the requirement is to show current state, not history.

## Data Flow

### Flow 1: Game creation with achievement evaluation

```
POST /games/
    │
    ▼
games_routes.create_game()
    │  injects achievements_service
    ▼
GamesService.create_game(game_dto)
    │  1. validate
    │  2. games_repository.create(game)  →  INSERT games, player_results, awards
    │  3. achievements_service.evaluate_game(game_id)
    │       │
    │       ├── games_repository.get_games_by_player(player_id)  ← all historical games
    │       │   (for each player in the new game)
    │       ├── achievements_repository.get_player_achievements(player_id)
    │       ├── for each evaluator in ALL_EVALUATORS:
    │       │       evaluator.evaluate(player_id, all_games, persisted_tier)
    │       │       if result.new_tier:
    │       │           achievements_repository.upsert(player_id, code, new_tier)
    │       └── returns list[UnlockedAchievementDTO]
    │
    ▼
GameCreatedResponseDTO { id, game, unlocked_achievements: [...] }
    │
    ▼
Frontend: GameForm receives response
    │  if unlocked_achievements.length > 0:
    │      show NewAchievementsToast
```

### Flow 2: Player profile achievements (full view with progress)

```
GET /players/{id}/achievements
    │
    ▼
achievements_routes.get_player_achievements()
    │
    ▼
AchievementsService.get_player_achievements(player_id)
    │  1. games_repository.get_games_by_player(player_id)
    │  2. achievements_repository.get_all(player_id)
    │       → dict { code: (tier, unlocked_at) }
    │  3. for each evaluator in ALL_EVALUATORS:
    │       persisted = persisted_map.get(code, tier=0)
    │       progress = evaluator.get_progress(player_id, games, persisted.tier)
    │       assemble PlayerAchievementDTO
    │
    ▼
list[PlayerAchievementDTO] {
    code, title (current tier), description, icon, fallback_icon,
    tier, max_tier, unlocked, unlocked_at, progress { current, target }
}
    │
    ▼
Frontend: AchievementsSection renders badge grid
```

### Flow 3: Global catalog

```
GET /achievements/catalog
    │
    ▼
AchievementsService.get_catalog()
    │  iterates ALL_EVALUATORS definitions only (no DB query)
    │
    ▼
list[AchievementCatalogItemDTO] {
    code, description, icon, fallback_icon, tiers: [{ level, threshold, title }]
}
```

### Flow 4: Reconciliation (manual/startup)

```
AchievementsReconciler.run()
    │
    ├── games_repository.list_all_games()
    ├── players_repository.list_all()
    ├── for each player:
    │       evaluate all evaluators over full history
    │       compare vs persisted
    │       if mismatch: achievements_repository.upsert(...)
    └── returns reconciliation report
```

### Frontend state management

```
GameForm submits → POST /games/
    ↓ response includes unlocked_achievements
GameForm sets newAchievements state
    ↓ if non-empty
NewAchievementsToast renders (local component state, no global store needed)
    ↓ user dismisses
Navigate to GameDetail

PlayerProfile mounts → GET /players/{id}/achievements
    ↓
AchievementsSection renders with fetched data (local useState, no global store)
```

No global state manager (Redux/Zustand) needed. Achievement data is page-local, fetched on mount, not shared across pages. Consistent with existing pattern in PlayerProfile.tsx and GameDetail.tsx.

## Suggested Build Order

The component graph has clear dependency layers. Build bottom-up:

```
1. DB migration (player_achievements table)
        ↓
2. AchievementDefinition dataclasses + evaluator base + generic evaluators
        ↓
3. AchievementsRepository (upsert, get_all)
        ↓
4. AchievementsService (evaluate_game, get_player_achievements, get_catalog)
        ↓
5. Wire evaluate_game into GamesService.create_game()
        ↓
6. achievements_routes.py (3 endpoints)
        ↓
7. Frontend api/achievements.ts + TypeScript types
        ↓
8. AchievementBadge + AchievementsSection (profile view)
        ↓
9. PlayerProfile: add Logros section
        ↓
10. NewAchievementsToast + wire into GameForm post-submit
        ↓
11. AchievementCatalog page
        ↓
12. AchievementsReconciler (utility, not in critical path)
```

Steps 1–6 are the backend vertical. Steps 7–12 are the frontend vertical. The reconciler (step 12) is infrastructure and can be done any time after step 4.

## Anti-Patterns

### Anti-Pattern 1: Calling achievements_service from the route layer instead of GamesService

**What people do:** Route handler calls `games_service.create_game()` and then `achievements_service.evaluate_game()` separately.

**Why it's wrong:** The route accumulates domain orchestration logic. If `create_game` succeeds but `evaluate_game` fails, the caller gets a 500 but the game was created. Error handling becomes inconsistent.

**Do this instead:** Inject `achievements_service` into `GamesService` so `create_game` owns the full transaction boundary. If achievement evaluation fails, it can be caught and logged without rolling back the game (achievements are recoverable via reconciler).

### Anti-Pattern 2: Persisting progress values to the DB

**What people do:** Store `current_count` or `progress_pct` in `player_achievements` to avoid recomputing.

**Why it's wrong:** Progress is purely derived from game history, which changes with every game. Persisted progress gets stale immediately. Adds a write to every game creation with no benefit at this scale.

**Do this instead:** Compute progress on-demand in `get_player_achievements()`. The player game history is already loaded for tier computation — progress reuses the same data.

### Anti-Pattern 3: Storing AchievementDefinitions in the database

**What people do:** Create an `achievement_definitions` table with code, description, tiers as JSON.

**Why it's wrong:** Definitions are code, not data. Adding a new achievement requires a data migration instead of just adding an evaluator to the registry. Makes it harder to test evaluators in isolation. Inconsistent with how record calculators work in this codebase.

**Do this instead:** Keep definitions as Python dataclasses in `definitions.py`, registered in `ALL_EVALUATORS`. Only the player's unlock state lives in the DB.

### Anti-Pattern 4: One badge component with too many props

**What people do:** Build one `AchievementBadge` with `variant="mini"|"full"|"catalog"` and conditional rendering internally.

**Why it's wrong:** The three display shapes (mini toast, full profile, catalog row) have different layouts, different data needs, and different CSS. Combining them causes prop explosion and makes each variant harder to evolve independently.

**Do this instead:** Build `AchievementBadgeMini` (icon + title, 2 fields) and `AchievementBadge` (full card). The catalog can reuse `AchievementBadge` with a `locked` prop. Keep CSS modules separate.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `GamesService` → `AchievementsService` | Direct Python call (injected dependency) | `evaluate_game(game_id)` returns unlocked list; errors are caught and logged, not re-raised |
| `AchievementsService` → `GamesRepository` | Existing repository interface | Service needs `get_games_by_player(player_id)` — already exists |
| `AchievementsService` → `AchievementsRepository` | New repository | `get_all(player_id)` → dict; `upsert(player_id, code, tier)` |
| `achievements_routes` → `AchievementsService` | Same injection pattern as existing routes | Instantiated at module level like `games_routes.py` |
| `GameForm` (frontend) → `NewAchievementsToast` | Parent passes `unlockedAchievements` as prop | Component handles its own show/hide state |
| `PlayerProfile` → `AchievementsSection` | Parent fetches, passes achievements array as prop | Consistent with how RecordsSection receives data |

### Schema additions

```
GameCreatedResponseDTO (modified):
  + unlocked_achievements: UnlockedAchievementDTO[]

UnlockedAchievementDTO:
  code, title, icon, fallback_icon, is_new (bool), tier

PlayerAchievementDTO (new):
  code, title, description, icon, fallback_icon,
  tier, max_tier, unlocked (bool), unlocked_at, progress?

AchievementCatalogItemDTO (new):
  code, description, icon, fallback_icon,
  tiers: [{ level, threshold, title }]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (small group, <1k games) | On-demand full history scan is fine. No optimization needed. |
| 10k+ games per player | Add `game_count` / `win_count` denormalized columns to `players` table. Evaluators use counts instead of full history scan. |
| Multiple concurrent users hitting profile | PostgreSQL query is the bottleneck; add index on `player_results.player_id`. Already should exist. |

The reconciler is the safety net that allows changing tier thresholds without manual DB patches. Its performance matters only when run in bulk — acceptable to be slow.

## Sources

- Codebase inspection: `backend/services/game_service.py`, `routes/games_routes.py`, `services/record_calculators/`, `routes/players_routes.py`, `services/player_profile_service.py`, `db/models.py`
- Frontend inspection: `pages/PlayerProfile/PlayerProfile.tsx`, `pages/GameDetail/GameDetail.tsx`, `types/index.ts`
- Project context: `.planning/PROJECT.md` (architecture decisions, implementation reference code)
- Pattern: mirrors existing `RecordCalculator` / `ALL_CALCULATORS` structure at `services/record_calculators/`

---
*Architecture research for: achievements system integration into tm-scorekeeper*
*Researched: 2026-03-23*
