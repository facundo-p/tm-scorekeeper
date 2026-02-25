from models.player_result import PlayerResult
from schemas.player import PlayerResultDTO

from mappers.player_score_mapper import player_score_dto_to_model, player_score_model_to_dto
from mappers.player_end_stats_mapper import (
    player_end_stats_dto_to_model,
    player_end_stats_model_to_dto,
)


def player_result_dto_to_model(dto: PlayerResultDTO) -> PlayerResult:
    return PlayerResult(
        player_id=dto.player_id,
        corporation=dto.corporation,
        scores=player_score_dto_to_model(dto.scores),
        end_stats=player_end_stats_dto_to_model(dto.end_stats),
    )


def player_result_model_to_dto(model: PlayerResult) -> PlayerResultDTO:
    return PlayerResultDTO(
        player_id=model.player_id,
        corporation=model.corporation,
        scores=player_score_model_to_dto(model.scores),
        end_stats=player_end_stats_model_to_dto(model.end_stats),
    )
