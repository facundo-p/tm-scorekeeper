from typing import Optional
from pydantic import BaseModel, Field


class ScoresDTO(BaseModel):
    terraform_rating: int = Field(ge=0)

    milestone_points: int = Field(ge=0)
    milestones: list[str]

    award_points: int = Field(ge=0)
    card_points: int = Field(ge=0)
    card_resource_points: int = Field(ge=0)

    greenery_points: int = Field(ge=0)
    city_points: int = Field(ge=0)
    turmoil_points: Optional[int] = Field(default=None, ge=0)

class EndStatsDTO(BaseModel):
    mc_total: int = Field(ge=0)

class PlayerDTO(BaseModel):
    player_id: str
    corporation: str
    scores: ScoresDTO
    end_stats: EndStatsDTO
