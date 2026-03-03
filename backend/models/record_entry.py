from dataclasses import dataclass
from typing import Optional


@dataclass
class RecordEntry:
    code: str
    description: str
    value: int
    player_id: Optional[str]
    game_id: Optional[str]