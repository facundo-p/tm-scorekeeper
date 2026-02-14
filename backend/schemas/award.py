from typing import List

from pydantic import BaseModel


class AwardResult(BaseModel):
    name: str
    opened_by: str  # player_id
    first_place: List[str] = []   # player_ids
    second_place: List[str] = []  # player_ids