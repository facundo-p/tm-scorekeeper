from typing import Optional

from models.enums import Corporation
from models.player_score import PlayerScore


class PlayerEndStats:
    def __init__(self, mc_total: int):
        self.mc_total = mc_total


class PlayerResult:
    def __init__(
        self,
        player_id: str,
        corporation: Corporation,
        scores: PlayerScore,
        end_stats: PlayerEndStats,
        color: Optional[str] = None,
    ):
        self.player_id = player_id
        self.corporation = corporation
        self.scores = scores
        self.end_stats = end_stats
        self.color = color  # color de cubo usado en esa partida; None: el del jugador