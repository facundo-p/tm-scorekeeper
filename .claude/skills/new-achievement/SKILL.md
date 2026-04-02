---
name: new-achievement
description: Add a new achievement to the achievements system with definition, evaluator, registry entry, and frontend icon mapping
argument-hint: [description of what the achievement tracks]
---

# New Achievement

Add a new achievement to the system based on: `$ARGUMENTS`

## Pre-flight

Gather all required data. If `$ARGUMENTS` provides a description, use it. Ask the user for anything missing:

1. **code** (snake_case, unique): e.g. `highest_terraform_rating`
2. **description** (Spanish, what the player must do): e.g. "Alcanzar X de terraform rating en una partida"
3. **Evaluator type**:
   - **SingleGameThreshold** — best value from a single game (e.g. "reach 100 points")
   - **Accumulated** — cumulative count across all games (e.g. "play 10 games")
   - **Custom** — complex logic needing its own class (e.g. streaks, combinations)
4. **Tiers** (at least 1): each with `level`, `threshold`, `title` (Spanish)
5. **show_progress**: `True` for accumulated/custom, `False` for single-game
6. **fallback_icon**: Lucide icon name. Currently mapped in frontend:
   - `trophy`, `flame`, `map`, `gamepad-2`, `star`, `zap`
   - Can add new ones from [lucide.dev](https://lucide.dev) — will update ICON_MAP
7. **For SingleGameThreshold**: what value to extract from game results
   - Available fields in `GameResultDTO.results[]`: `player_id`, `total_points`, `position`, `tied`
   - Available fields in `Game.player_results[]`: `scores.terraform_rating`, `scores.card_points`, `scores.greenery_points`, `scores.city_points`, `scores.milestone_points`, `scores.award_points`, `scores.card_resource_points`, `scores.turmoil_points`
   - Or a derived value via `calculate_results(game)`
8. **For Accumulated**: what to count across games (e.g. games played, wins, games with turmoil)
9. **For Custom**: describe the logic

Present a summary and confirm before generating.

## Files to modify

### 1. Definition — `backend/services/achievement_evaluators/definitions.py`

Add the new `AchievementDefinition` constant:

```python
from models.achievement_definition import AchievementDefinition
from models.achievement_tier import AchievementTier

{UPPER_CODE} = AchievementDefinition(
    code="{code}",
    description="{description}",
    icon=None,
    fallback_icon="{fallback_icon}",
    tiers=[
        AchievementTier(level=1, threshold={t1}, title="{title1}"),
        # ... more tiers
    ],
    show_progress={show_progress},
)
```

### 2. Evaluator (if Custom type)

Create `backend/services/achievement_evaluators/{code}.py`:

```python
from models.game import Game
from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from services.achievement_evaluators.base import AchievementEvaluator

class {ClassName}Evaluator(AchievementEvaluator):
    def __init__(self, definition: AchievementDefinition):
        self.definition = definition

    def compute_tier(self, player_id: str, games: list[Game]) -> int:
        # ... custom logic ...
        achieved_tier = 0
        for tier in self.definition.tiers:
            if value >= tier.threshold:
                achieved_tier = tier.level
        return achieved_tier

    def get_progress(self, player_id: str, games: list[Game], current_tier: int) -> Progress | None:
        next_tier = self._next_tier(current_tier)
        if not next_tier:
            return None
        return Progress(current=current_value, target=next_tier.threshold)
```

Reference custom evaluators:
- `backend/services/achievement_evaluators/win_streak.py`
- `backend/services/achievement_evaluators/all_maps.py`

### 3. Registry — `backend/services/achievement_evaluators/registry.py`

Add import and entry to `ALL_EVALUATORS`:

**For SingleGameThreshold:**
```python
from services.achievement_evaluators.definitions import {UPPER_CODE}

def _{code}_extractor(player_id, game, game_result):
    """Extract {what} for player from GameResultDTO."""
    for r in game_result.results:
        if r.player_id == player_id:
            return r.{field}
    return 0

# Add to ALL_EVALUATORS:
SingleGameThresholdEvaluator({UPPER_CODE}, extractor=_{code}_extractor),
```

**For Accumulated:**
```python
from services.achievement_evaluators.definitions import {UPPER_CODE}

def _{code}_counter(player_id, games):
    """Count {what} for player."""
    return sum(1 for g in games if {condition})

# Add to ALL_EVALUATORS:
AccumulatedEvaluator({UPPER_CODE}, counter=_{code}_counter),
```

**For Custom:**
```python
from services.achievement_evaluators.{code} import {ClassName}Evaluator
from services.achievement_evaluators.definitions import {UPPER_CODE}

# Add to ALL_EVALUATORS:
{ClassName}Evaluator({UPPER_CODE}),
```

### 4. Frontend icon — `frontend/src/components/AchievementIcon/AchievementIcon.tsx`

**Only if using a new Lucide icon not already in ICON_MAP.**

Add import and mapping:

```tsx
import { ..., {IconName} } from 'lucide-react'

const ICON_MAP: Record<string, IconComponent> = {
  // ... existing ...
  '{icon-name}': {IconName},
}
```

Currently mapped: `trophy`, `flame`, `map`, `gamepad-2`, `star`, `zap`, `crown`, `trees`

## Post-generation

1. Run tests: `make test-backend` (NEVER pytest on host)
2. Run frontend tests: `cd frontend && npx vitest run`
3. Verify in catalog: `GET /achievements/catalog`
4. Run reconcile to backfill for existing players: `curl -s -X POST http://localhost:8000/achievements/reconcile`

## Important notes

- No DB migration needed — `player_achievements` table is generic
- No DTO/schema changes needed — generic DTOs handle any achievement
- No service changes needed — service iterates `ALL_EVALUATORS` automatically
- No route changes needed — existing endpoints serve all achievements
- `compute_tier()` receives ALL games the player participated in, not just the latest
- For `SingleGameThresholdEvaluator`: extractor receives `(player_id, game, game_result_dto)` — use `calculate_results(game)` for computed fields like `total_points`
- For `AccumulatedEvaluator`: counter receives `(player_id, games)` — return an int
- Tier thresholds must be in ascending order matching tier levels
- `show_progress=True` only works with evaluators that implement `get_progress()`
