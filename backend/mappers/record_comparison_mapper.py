from schemas.game_records import RecordComparisonDTO, RecordResultDTO
from services.player_service import PlayerService


def record_comparison_to_dto(comparison, players):

    players_by_id = {p.player_id: p for p in players}

    def entry_to_result(entry):
        player = players_by_id[entry.player_id]
        return RecordResultDTO(
            game_id=entry.game_id,
            value=entry.value,
            player_name=player.name,
        )

    compared = entry_to_result(comparison.compared) if comparison.compared else None
    current = entry_to_result(comparison.current)

    return RecordComparisonDTO(
        description=comparison.description,
        achieved=comparison.achieved,
        compared=compared,
        current=current,
    )