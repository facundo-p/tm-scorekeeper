from typing import List
from models.enums import Milestone


class PlayerScore:
    def __init__(
        self,
        terraform_rating: int,
        milestone_points: int,
        milestones: List[Milestone],
        award_points: int,
        card_points: int,
        card_resource_points: int,
        greenery_points: int,
        city_points: int,
        turmoil_points: int,
    ):
        self.terraform_rating = terraform_rating
        self.milestone_points = milestone_points
        self.milestones = milestones
        self.award_points = award_points
        self.card_points = card_points
        self.card_resource_points = card_resource_points
        self.greenery_points = greenery_points
        self.city_points = city_points
        self.turmoil_points = turmoil_points