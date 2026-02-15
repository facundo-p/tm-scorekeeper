from typing import Optional
from pydantic import BaseModel, Field
from models.enums import Milestone, Corporation


class ScoresDTO(BaseModel):
    terraform_rating: int = Field(ge=0)

    milestone_points: int = Field(ge=0)
    milestones: list[Milestone]

    award_points: int = Field(ge=0)
    card_points: int = Field(ge=0)
    card_resource_points: int = Field(ge=0)

    greenery_points: int = Field(ge=0)
    city_points: int = Field(ge=0)
    turmoil_points: Optional[int] = Field(default=None, ge=0)

class PlayerEndStatsDTO(BaseModel):
    mc_total: int = Field(ge=0)

class PlayerDTO(BaseModel):
    player_id: str
    corporation: Corporation
    scores: ScoresDTO
    end_stats: PlayerEndStatsDTO
#Cambiar a player result(!)
