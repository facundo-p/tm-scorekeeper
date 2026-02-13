from typing import List
from models.enums import Award

from pydantic import BaseModel


class AwardResult(BaseModel):
    name: Award
    opened_by: str  # player_id
    first_place: List[str] = []   # player_ids
    second_place: List[str] = []  # player_ids