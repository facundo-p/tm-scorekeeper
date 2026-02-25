from models.player_result import PlayerScore
from schemas.player import PlayerScoreDTO


def player_score_dto_to_model(dto: PlayerScoreDTO) -> PlayerScore:
    return PlayerScore(
        terraform_rating=dto.terraform_rating,
        milestone_points=dto.milestone_points,
        milestones=dto.milestones,
        award_points=dto.award_points,
        card_points=dto.card_points,
        card_resource_points=dto.card_resource_points,
        greenery_points=dto.greenery_points,
        city_points=dto.city_points,
        turmoil_points=dto.turmoil_points or 0,
    )


def player_score_model_to_dto(model: PlayerScore) -> PlayerScoreDTO:
    return PlayerScoreDTO(
        terraform_rating=model.terraform_rating,
        milestone_points=model.milestone_points,
        milestones=model.milestones,
        award_points=model.award_points,
        card_points=model.card_points,
        card_resource_points=model.card_resource_points,
        greenery_points=model.greenery_points,
        city_points=model.city_points,
        turmoil_points=model.turmoil_points,
    )
