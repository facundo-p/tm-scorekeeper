from datetime import date
from typing import List, Optional

from models.enums import MapName, Expansion
from models.player_result import PlayerResult
from models.award_result import AwardResult


class Game:
    def __init__(
        self,
        game_id: Optional[str],
        date: date,
        map_name: MapName,
        expansions: List[Expansion],
        draft: bool,
        generations: int,
        player_results: List[PlayerResult],
        awards: List[AwardResult],
    ):
        self.id = game_id
        self.date = date
        self.map_name = map_name
        self.expansions = expansions
        self.draft = draft
        self.generations = generations
        self.player_results = player_results
        self.awards = awards