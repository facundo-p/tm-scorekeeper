---
name: new-record
description: Add a new record calculator to the Strategy pattern registry with proper base class, registration, and mapper support
argument-hint: [record-name]
---

# New Record Calculator

Add a new record to the records system for `$ARGUMENTS`.

## Pre-flight

1. Ask the user for:
   - **Record name** (if not provided): snake_case code (e.g. `highest_venus_points`)
   - **Description**: what this record tracks (Spanish, e.g. "Mayor puntaje de Venus en una partida")
   - **Title**: achievement title (Spanish, e.g. "Conquistador de Venus")
   - **Emoji**: representative emoji
   - **Calculator type**:
     - **MaxScore** — highest value from a player score field (use `MaxScoreCalculator`)
     - **Accumulative** — aggregates across all games (like `MostGamesPlayedCalculator`)
     - **Custom** — unique logic needing its own class

2. Confirm before generating.

## Architecture

The records system uses a Strategy pattern:

```
base.py          → RecordCalculator (ABC) with calculate() and evaluate()
max_score_calculator.py → MaxScoreCalculator (reusable for single-field max records)
registry.py      → ALL_CALCULATORS list
```

## For MaxScore type (simplest)

Create `backend/services/record_calculators/{record_name}.py`:

```python
from services.record_calculators.max_score_calculator import MaxScoreCalculator

{RecordName}Calculator = MaxScoreCalculator(
    extractor=lambda p: p.scores.{field_name},
    code="{record_name}",
    title="{title}",
    emoji="{emoji}",
    description="{description}"
)
```

Reference: `backend/services/record_calculators/highest_city_points.py`

## For Accumulative type

Create `backend/services/record_calculators/{record_name}.py`:

```python
from typing import List
from collections import Counter
from models.game import Game
from models.record_entry import RecordEntry, RecordAttribute, LABEL_PLAYER
from services.record_calculators.base import RecordCalculator

class {RecordName}Calculator(RecordCalculator):
    code = "{record_name}"
    description = "{description}"
    title = "{title}"
    emoji = "{emoji}"

    def games_for_current(self, games_until_current):
        return games_until_current  # Uses ALL games, not just last

    def calculate(self, games: List[Game]) -> RecordEntry | None:
        if not games:
            return None
        # ... accumulation logic
        return RecordEntry(
            value=...,
            title=self.title,
            attributes=[RecordAttribute(label=LABEL_PLAYER, value=player_id)],
        )
```

Reference: `backend/services/record_calculators/most_games_played.py`

## For Custom type

Create class extending `RecordCalculator` with custom `calculate()`. Override `games_for_current()` if needed.

## Registration

Add to `backend/services/record_calculators/registry.py`:

1. Import the calculator
2. Add to `ALL_CALCULATORS` list

## Important notes

- `calculate()` receives a `List[Game]` and returns `RecordEntry | None`
- `games_for_current()` defaults to last game only; override for accumulative records
- `evaluate()` in base class handles before/after comparison automatically
- `RecordEntry` has: `value` (numeric), `title` (optional str), `attributes` (list of label/value)
- Available attributes: `LABEL_PLAYER`, `LABEL_DATE` from `models.record_entry`
- Player scores accessible via `player_result.scores.{field}` — check `models/player_score.py` for available fields
- DO NOT run tests on host — use `make test-backend`
