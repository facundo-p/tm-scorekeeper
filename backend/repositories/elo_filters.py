from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class EloHistoryFilter:
    date_from: Optional[date] = None
    player_ids: Optional[set[str]] = None
