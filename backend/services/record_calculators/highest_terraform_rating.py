from typing import List
from models.game import Game
from models.record_entry import RecordEntry, RecordAttribute, LABEL_PLAYER, LABEL_DATE
from services.record_calculators.base import RecordCalculator


class HighestTerraformRatingCalculator(RecordCalculator):

    code = "highest_terraform_rating"
    description = "Mayor Terraform Rating en una partida"

    def calculate(self, games: List[Game]) -> RecordEntry | None:

        if not games:
            return None

        max_tr = None
        record_player_id = None
        record_date = None

        for game in games:
            for p in game.player_results:

                tr = p.scores.terraform_rating

                if max_tr is None or tr > max_tr:
                    max_tr = tr
                    record_player_id = p.player_id
                    record_date = game.date

        if max_tr is None:
            return None

        return RecordEntry(
            value=max_tr,
            attributes=[
                RecordAttribute(label=LABEL_PLAYER, value=record_player_id),
                RecordAttribute(label=LABEL_DATE, value=str(record_date)),
            ],
        )