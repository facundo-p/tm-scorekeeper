"""Informe de una partida (F24, STAT-10): siempre sobre todas las partidas."""
from dataclasses import dataclass

from models.award_result import AwardResult
from models.elo_change import EloChange
from services.achievements_service import GameUnlock
from services.game_service import GameNotFound
from services.helpers.awards import stolen_awards
from services.records.service import GameRecordContext, game_record_context, near_records
from services.stats.context import GameStats, StatsContext


@dataclass(frozen=True)
class GameReport:
    stats: GameStats
    elo: list[EloChange]
    records: list[GameRecordContext]
    near: list[GameRecordContext]
    unlocks: dict[str, list[GameUnlock]]
    stolen: list[AwardResult]


def summaries(ctx: StatsContext) -> list[GameStats]:
    """Partidas del subconjunto, de la más nueva a la más vieja (orden canónico invertido)."""
    return list(reversed(ctx.games))


class GameReportService:
    def __init__(self, games_repository, elo_repository, achievements_service):
        self.games_repository = games_repository
        self.elo_repository = elo_repository
        self.achievements_service = achievements_service

    def summaries(self, subset) -> list[GameStats]:
        return summaries(StatsContext.load(self.games_repository, subset))

    def report(self, game_id: str) -> GameReport:
        ctx = StatsContext.load(self.games_repository)
        stats = ctx.get(game_id)
        if stats is None:
            raise GameNotFound("Game not found")
        records = game_record_context(ctx, game_id)
        return GameReport(
            stats=stats,
            elo=self.elo_repository.get_changes_for_game(game_id),
            records=records,
            near=near_records(records),
            unlocks=self.achievements_service.unlocked_in_game(game_id),
            stolen=stolen_awards(stats.game),
        )
