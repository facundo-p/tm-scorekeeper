from models.award_result import AwardResult
from schemas.award import AwardResultDTO


def award_result_dto_to_model(dto: AwardResultDTO) -> AwardResult:
    return AwardResult(
        award=dto.name,
        opened_by=dto.opened_by,
        first_place=list(dto.first_place),
        second_place=list(dto.second_place),
    )


def award_result_model_to_dto(model: AwardResult) -> AwardResultDTO:
    return AwardResultDTO(
        name=model.award,
        opened_by=model.opened_by,
        first_place=list(model.first_place),
        second_place=list(model.second_place),
    )
