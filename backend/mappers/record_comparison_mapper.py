from schemas.game_records import RecordComparisonDTO, RecordResultDTO, RecordAttributeDTO
from models.record_entry import LABEL_PLAYER


def entry_to_result(entry, players_by_id: dict) -> RecordResultDTO:

    player_names = []
    attrs = []

    for attr in entry.attributes:
        if attr.label == LABEL_PLAYER:
            player = players_by_id.get(attr.value)
            player_names.append(player.name if player else attr.value)
        else:
            attrs.append(
                RecordAttributeDTO(label=attr.label, value=attr.value)
            )

    if player_names:
        attrs.append(
            RecordAttributeDTO(
                label=LABEL_PLAYER,
                value=", ".join(player_names)
            )
        )

    return RecordResultDTO(
        value=entry.value,
        title=entry.title,
        attributes=attrs
    )


def record_comparison_to_dto(comparison, players) -> RecordComparisonDTO:
    players_by_id = {p.player_id: p for p in players}
    compared = entry_to_result(comparison.compared, players_by_id) if comparison.compared else None
    current = entry_to_result(comparison.current, players_by_id)
    return RecordComparisonDTO(
        code=comparison.code,
        title=comparison.title,
        emoji=comparison.emoji,
        description=comparison.description,
        achieved=comparison.achieved,
        compared=compared,
        current=current,
    )
