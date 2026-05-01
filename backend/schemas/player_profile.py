from datetime import date
from pydantic import BaseModel


class PlayerStatsDTO(BaseModel):
    games_played: int
    games_won: int
    win_rate: float
    avg_milestones: float
    avg_awards: float


class PlayerGameSummaryDTO(BaseModel):
    game_id: str
    date: date
    position: int
    points: int


class PlayerProfileDTO(BaseModel):
    player_id: str
    elo: int
    stats: PlayerStatsDTO
    games: list[PlayerGameSummaryDTO]
    records: dict[str, bool]
