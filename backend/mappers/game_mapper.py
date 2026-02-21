from models.game import Game
from schemas.game import GameDTO

from mappers.player_result_mapper import (
    player_result_dto_to_model,
    player_result_model_to_dto,
)
from mappers.award_mapper import (
    award_result_dto_to_model,
    award_result_model_to_dto,
)


def game_dto_to_model(dto: GameDTO) -> Game:
    return Game(
        game_id=dto.id,
        date=dto.date,
        map_name=dto.map,
        expansions=list(dto.expansions),
        draft=dto.draft,
        generations=dto.generations,
        players=[player_result_dto_to_model(p) for p in dto.players],
        awards=[award_result_dto_to_model(a) for a in dto.awards],
    )


def game_model_to_dto(model: Game) -> GameDTO:
    return GameDTO(
        id=model.id,
        date=model.date,
        map=model.map_name,
        expansions=list(model.expansions),
        draft=model.draft,
        generations=model.generations,
        players=[player_result_model_to_dto(p) for p in model.players],
        awards=[award_result_model_to_dto(a) for a in model.awards],
    )