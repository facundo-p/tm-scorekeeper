"""DTOs for the player ELO summary endpoint.

Mirrors CONTEXT D-02 shape:
    {
        "current_elo": 1523,
        "peak_elo": 1612,        # null when player has 0 games
        "last_delta": -23,       # null when player has 0 games
        "rank": {                # null when player is inactive
            "position": 3,       # 1-based, ordered by elo DESC, player_id ASC
            "total": 8           # count of active players
        }
    }
"""
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
