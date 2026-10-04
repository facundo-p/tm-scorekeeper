import datetime as dt
from typing import Literal, Optional

from pydantic import BaseModel

SeasonCategory = Literal["total", "terraform_rating", "award_points", "milestone_points", "card_resource_points",
                         "card_points", "greenery_points", "city_points", "turmoil_points"]


class RaceRowDTO(BaseModel):
    player_id: str
    games: int
    avg: float
    best: int


class PendingRowDTO(RaceRowDTO):
    missing: int


class SeasonRaceDTO(BaseModel):
    category: SeasonCategory
    games: int
    qualified: list[RaceRowDTO]
    pending: list[PendingRowDTO]


class SeasonDTO(BaseModel):
    number: int
    start: dt.date
    end: Optional[dt.date]  # sin cerrar: la temporada en curso
    games: list[str]
    temp: float
    oxygen: float
    oceans: float
    temperature: int
    oxygen_pct: int
    ocean_count: int
    pct: float
    race: SeasonRaceDTO
    champion: Optional[str]


class ChampionDTO(BaseModel):
    number: int
    end: dt.date
    player_id: Optional[str]  # None si nadie clasificó


class SeasonsDTO(BaseModel):
    seasons: list[SeasonDTO]
    champions: list[ChampionDTO]


class FeedItemDTO(BaseModel):
    date: dt.date
    type: Literal["season", "record", "achievement", "game"]
    game_id: Optional[str] = None
    player_id: Optional[str] = None
    code: Optional[str] = None
    level: Optional[int] = None
    text: str
