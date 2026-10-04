from typing import Literal, Optional

from pydantic import BaseModel


class FavoriteDTO(BaseModel):
    names: list[str]
    count: int


class FavoritesDTO(BaseModel):
    milestone: Optional[FavoriteDTO]
    award: Optional[FavoriteDTO]


class CompositionDTO(BaseModel):
    avg: dict[str, float]
    share: dict[str, float]


class ArchetypeDTO(BaseModel):
    key: str
    name: str
    desc: str
    share: float
    group: float
    ratio: float


class SplitStatDTO(BaseModel):
    name: str
    games: int
    wins: int
    avg: int
    avg_pos: float


class StreakDTO(BaseModel):
    best: int
    current: int


class FormDTO(BaseModel):
    position: int
    n: int
    game_id: str


class RivalDTO(BaseModel):
    player_id: str
    games: int
    ahead: int
    behind: int
    even: int


class EquityDTO(BaseModel):
    expected: float
    wins_vs_expected: float
    wins_ratio: Optional[float]
    rel_pos: Optional[float]


class TableSizeDTO(EquityDTO):
    n: int
    games: int
    wins: int
    avg_points: Optional[int]


class PlayerInsightsDTO(BaseModel):
    """Ficha del jugador (STAT-11); con `?player_count=` todo sale de esa mesa (view: mesa)."""
    view: Literal["all", "mesa"]
    games: int
    wins: int
    win_rate: float
    podium_rate: float
    avg_points: int
    avg_pos: float
    best: int
    best_game: Optional[str]
    avg_milestones: float
    avg_awards: float
    points_per_gen: float
    favorites: FavoritesDTO
    composition: CompositionDTO
    archetype: Optional[ArchetypeDTO]
    corps: list[SplitStatDTO]
    maps: list[SplitStatDTO]
    streak: StreakDTO
    form: list[FormDTO]
    nemesis: Optional[RivalDTO]
    victim: Optional[RivalDTO]
    records_held: list[str]
    rank: Optional[int]
    rank_total: int
    equity: EquityDTO
    by_table: list[TableSizeDTO]
    elo: int
    peak: Optional[int]
    last_delta: Optional[int]
