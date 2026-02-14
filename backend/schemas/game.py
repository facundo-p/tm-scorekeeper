from typing import List
from pydantic import BaseModel, Field
from datetime import date
from schemas.award import AwardResult
from models.enums import Expansion, MapName
from schemas.player import PlayerDTO


class GameDTO(BaseModel):
    id: str | None = None
    date: date
    map: MapName
    expansions: List[Expansion]
    draft: bool
    generations: int = Field(ge=1)

    players: List[PlayerDTO]
    awards: List[AwardResult]


class GameCreatedResponse(BaseModel):
    id: str
    game: GameDTO


class GameListItemDTO(BaseModel):
    id: str
    game: GameDTO