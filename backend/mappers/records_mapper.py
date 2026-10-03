"""RecordView (motor de récords v2) → DTOs de `GET /records`."""
from models.record_entry import LABEL_DATE, LABEL_PLAYER
from schemas.game_records import RecordAttributeDTO, RecordResultDTO
from schemas.records import GlobalRecordDTO, RecordHistoryDTO, RecordHistoryEntryDTO, RecordHolderDTO
from services.records.service import RecordView

# Emojis del contrato viejo; los récords nuevos no tienen (el frontend nuevo usa íconos).
LEGACY_EMOJI = {
    "highest_single_game_score": "🏆", "most_games_played": "🎮", "most_games_won": "🥇",
    "highest_terraform_rating": "🌡️", "highest_card_points": "🃏", "highest_card_resource_points": "⚙️",
    "highest_greenery_points": "🌿", "highest_city_points": "🏙️", "highest_turmoil_points": "⚡",
}


def _holder(h, names: dict) -> RecordHolderDTO:
    return RecordHolderDTO(player_id=h.player_id, player_name=names.get(h.player_id, h.player_id),
                           game_id=h.game_id, date=h.date, map=h.map)


def _entry(e, names: dict) -> RecordHistoryEntryDTO:
    return RecordHistoryEntryDTO(value=e.value, player_id=e.player_id, player_name=names.get(e.player_id, e.player_id),
                                 holders=list(e.holders), game_id=e.game_id, date=e.date, kind=e.kind)


def _legacy_record(view: RecordView, holders: list[RecordHolderDTO]) -> RecordResultDTO | None:
    if not holders:
        return None
    # Misma forma que antes de v2 (`entry_to_result`): una fecha por poseedor y los nombres juntos.
    attrs = [RecordAttributeDTO(label=LABEL_DATE, value=h.date.isoformat()) for h in holders if h.date]
    attrs.append(RecordAttributeDTO(label=LABEL_PLAYER, value=", ".join(h.player_name for h in holders)))
    return RecordResultDTO(value=view.state.value, title=view.definition.title, attributes=attrs)


def record_history_to_dto(view: RecordView, names: dict) -> RecordHistoryDTO:
    return RecordHistoryDTO(
        code=view.definition.code,
        value=view.state.value,
        holders=[_holder(h, names) for h in view.state.holders],
        history=[_entry(e, names) for e in view.state.history],
    )


def record_to_dto(view: RecordView, names: dict) -> GlobalRecordDTO:
    d = view.definition
    detail = record_history_to_dto(view, names)
    return GlobalRecordDTO(
        code=d.code, title=d.title, description=d.description, emoji=LEGACY_EMOJI.get(d.code),
        record=_legacy_record(view, detail.holders), scope=d.scope, unit=d.unit,
        lower_is_better=d.lower_is_better, **detail.model_dump(exclude={"code"}),
    )
