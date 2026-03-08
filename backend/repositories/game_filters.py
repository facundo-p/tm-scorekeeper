from dataclasses import dataclass
from typing import Optional


@dataclass
class GameFilter:
    game_ids: Optional[set[str]] = None
