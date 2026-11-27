"""RecordView (motor de récords v2) → DTOs de `GET /records`."""
from schemas.records import GlobalRecordDTO, RecordHistoryDTO, RecordHistoryEntryDTO, RecordHolderDTO
from services.records.service import RecordView


def _holder(h, names: dict) -> RecordHolderDTO:
    return RecordHolderDTO(player_id=h.player_id, player_name=names.get(h.player_id, h.player_id),
                           game_id=h.game_id, date=h.date, map=h.map)


def _entry(e, names: dict) -> RecordHistoryEntryDTO:
    return RecordHistoryEntryDTO(value=e.value, player_id=e.player_id, player_name=names.get(e.player_id, e.player_id),
                                 holders=list(e.holders), game_id=e.game_id, date=e.date, kind=e.kind)


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
        code=d.code, title=d.title, description=d.description, scope=d.scope, unit=d.unit,
        lower_is_better=d.lower_is_better, **detail.model_dump(exclude={"code"}),
    )
