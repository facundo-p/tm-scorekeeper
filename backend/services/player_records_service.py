from backend.services.records_service import RecordsService


class PlayerRecordsService:
    def __init__(self, records_service: RecordsService):
        self.records_service = records_service

    def get_player_records(self, player_id: str) -> dict[str, bool]:
        global_records = self.records_service.get_global_records()

        return {
            record_type: record.player_id == player_id
            for record_type, record in global_records.items()
        }