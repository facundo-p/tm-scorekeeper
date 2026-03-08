from schemas.game_records import RecordComparisonDTO, RecordResultDTO, RecordAttributeDTO
from models.record_entry import LABEL_PLAYER


def record_comparison_to_dto(comparison, players):

    players_by_id = {p.player_id: p for p in players}

    def entry_to_result(entry):
        attrs = []
        for attr in entry.attributes:
            if attr.label == LABEL_PLAYER:
                player = players_by_id.get(attr.value)
                attrs.append(RecordAttributeDTO(label=attr.label, value=player.name if player else attr.value))
            else:
                attrs.append(RecordAttributeDTO(label=attr.label, value=attr.value))
        return RecordResultDTO(value=entry.value, attributes=attrs)

    compared = entry_to_result(comparison.compared) if comparison.compared else None
    current = entry_to_result(comparison.current)

    return RecordComparisonDTO(
        description=comparison.description,
        achieved=comparison.achieved,
        compared=compared,
        current=current,
    )
