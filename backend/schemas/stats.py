import datetime as dt
from typing import Literal, Optional

from pydantic import BaseModel

from schemas.insights import CompositionDTO, EloPointDTO, EquityDTO, FormDTO, RivalDTO, SplitStatDTO

View = Literal["all", "mesa"]


class RankingRowDTO(BaseModel):
    player_id: str
    name: str
    color: str
    rank: int
    elo: int
    peak: Optional[int]
    last_delta: Optional[int]
    games: int
    wins: int
    win_rate: float
    equity: EquityDTO
    form: list[FormDTO]
    archetype: Optional[str]
    elo_series: list[EloPointDTO]


class LeadChangeDTO(BaseModel):
    date: dt.date
    game_id: str
    player_id: Optional[str]


class RankingDTO(BaseModel):
    """Clasificación de los activos con partidas (STAT-12); `from` recorta solo `elo_series`."""
    view: View
    players: list[RankingRowDTO]
    lead_changes: list[LeadChangeDTO]


class H2HCellDTO(BaseModel):
    games: int
    ahead: int
    behind: int
    even: int


class RivalsDTO(BaseModel):
    nemesis: Optional[RivalDTO]
    victim: Optional[RivalDTO]


class HeadToHeadDTO(BaseModel):
    view: View
    matrix: dict[str, dict[str, H2HCellDTO]]
    rivals: dict[str, RivalsDTO]


class GroupSummaryDTO(BaseModel):
    view: View
    games: int
    generations: int
    avg_winner: int
    avg_generations: float
    first: Optional[dt.date]
    last: Optional[dt.date]
    top_corp: Optional[SplitStatDTO]
    corps_used: int
    top_map: Optional[SplitStatDTO]
    maps: list[SplitStatDTO]
    composition: CompositionDTO
