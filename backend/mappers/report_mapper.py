"""GameReport → GameReportDTO."""
from mappers.achievement_mapper import game_unlock_to_dto
from mappers.elo_mapper import elo_changes_to_dtos
from mappers.game_mapper import game_model_to_dto
from mappers.player_score_mapper import player_score_model_to_dto
from schemas.report import (
    GameReportDTO, GameSummaryDTO, NearRecordDTO, SummaryScoreDTO, PreviousRecordDTO, RecordBrokenDTO, RecordTiedDTO, ReportResultDTO, StolenAwardDTO,
)
from services.records.service import GameRecordContext
from services.report_service import GameReport
from services.stats.context import GameStats


def _results(report: GameReport, names: dict) -> list[ReportResultDTO]:
    stats = report.stats
    return [ReportResultDTO(
        player_id=r.player_id, player_name=names.get(r.player_id, r.player_id),
        corporation=_corporation(stats, r.player_id),
        position=r.position, tied=r.tied, total_points=r.total_points, mc_total=r.mc_total,
        scores=player_score_model_to_dto(stats.scores_of(r.player_id)),
    ) for r in stats.results]


def _broken(c: GameRecordContext) -> RecordBrokenDTO:
    prev = c.previous
    return RecordBrokenDTO(
        code=c.definition.code, title=c.definition.title, value=c.best.value, player_id=c.best.players[0],
        holders=list(c.best.players),
        previous=PreviousRecordDTO(value=prev.value, player_id=prev.holders[0].player_id,
                                   holders=[h.player_id for h in prev.holders]),
    )


def _tied(c: GameRecordContext) -> RecordTiedDTO:
    return RecordTiedDTO(code=c.definition.code, title=c.definition.title, value=c.tied.value, holders=list(c.tied.holders))


def _near(c: GameRecordContext) -> NearRecordDTO:
    return NearRecordDTO(code=c.definition.code, title=c.definition.title, gap=c.gap, value=c.best.value,
                         player_id=c.best.players[0], before=c.before.value)


def report_to_dto(report: GameReport, names: dict) -> GameReportDTO:
    stats = report.stats
    return GameReportDTO(
        game=game_model_to_dto(stats.game), results=_results(report, names), winners=stats.winners,
        margin=stats.margin, decided_by_mc=stats.decided_by_mc, elo=elo_changes_to_dtos(report.elo, names),
        records_broken=[_broken(c) for c in report.records if c.broken],
        records_tied=[_tied(c) for c in report.records if c.tied],
        near=[_near(c) for c in report.near],
        achievements_by_player={pid: [game_unlock_to_dto(u) for u in us] for pid, us in report.unlocks.items()},
        stolen_awards=[StolenAwardDTO(award=a.award.value, player_id=a.first_place[0], opened_by=a.opened_by)
                       for a in report.stolen],
    )


def _corporation(stats: GameStats, player_id: str) -> str:
    return next(p.corporation for p in stats.game.player_results if p.player_id == player_id).value


def summary_to_dto(stats: GameStats) -> GameSummaryDTO:
    g = stats.game
    return GameSummaryDTO(
        id=g.id, date=g.date, map=g.map_name.value, expansions=[e.value for e in g.expansions],
        generations=g.generations, draft=g.draft, player_count=len(stats.results), winners=stats.winners,
        margin=stats.margin, decided_by_mc=stats.decided_by_mc,
        scores=[SummaryScoreDTO(player_id=r.player_id, position=r.position, total_points=r.total_points,
                                corporation=_corporation(stats, r.player_id)) for r in stats.results],
    )
