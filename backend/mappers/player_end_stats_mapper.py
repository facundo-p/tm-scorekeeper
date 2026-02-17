from models.player_result import PlayerEndStats
from schemas.player import PlayerEndStatsDTO


def player_end_stats_dto_to_model(dto: PlayerEndStatsDTO) -> PlayerEndStats:
    return PlayerEndStats(
        mc_total=dto.mc_total,
    )


def player_end_stats_model_to_dto(model: PlayerEndStats) -> PlayerEndStatsDTO:
    return PlayerEndStatsDTO(
        mc_total=model.mc_total,
    )
