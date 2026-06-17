from datetime import date
from typing import Optional
from pydantic import BaseModel


class PlayerStatsDTO(BaseModel):
    games_played: int
    games_won: int
    win_rate: float
    avg_milestones: float
    avg_awards: float
    most_claimed_milestones: Optional[list[str]] = None
    most_claimed_awards: Optional[list[str]] = None


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
