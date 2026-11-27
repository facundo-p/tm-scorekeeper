from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class GameFilter:
    game_ids: Optional[set[str]] = None
    date_from: Optional[date] = None
