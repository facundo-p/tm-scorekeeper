from schemas.game_records import RecordComparisonDTO, RecordResultDTO


def record_comparison_to_dto(comparison, player_repository):

    def entry_to_result(entry):

        players = {
            p.player_id: p
            for p in player_repository.get_all()
        }

        player = players[entry.player_id]

        return RecordResultDTO(
            game_id=entry.game_id,
            value=entry.value,
            player_name=player.name,
        )

    previous = None
    if comparison.previous is not None:
        previous = entry_to_result(comparison.previous)

    current = entry_to_result(comparison.current)

    return RecordComparisonDTO(
        description=comparison.description,
        achieved=comparison.achieved,
        previous=previous,
        current=current,
    )