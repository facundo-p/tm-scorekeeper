from typing import List
from pydantic import BaseModel, Field
from datetime import date
from schemas.award import AwardResultDTO
from models.enums import Expansion, MapName
from schemas.player import PlayerResultDTO


class GameDTO(BaseModel):
    id: str | None = None
    date: date
    map: MapName
    expansions: List[Expansion]
    draft: bool
    generations: int = Field(ge=1)

    player_results: List[PlayerResultDTO]
    awards: List[AwardResultDTO]


class GameCreatedResponseDTO(BaseModel):
    id: str
    game: GameDTO


class GameListItemDTO(BaseModel):
    id: str
    game: GameDTO