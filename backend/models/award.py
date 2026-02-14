from typing import List
from models.enums import Award


class AwardResult:
    def __init__(
        self,
        award: Award,
        opened_by: str,
        first_place: List[str],
        second_place: List[str],
    ):
        self.award = award
        self.opened_by = opened_by
        self.first_place = first_place
        self.second_place = second_place