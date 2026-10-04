from datetime import date
from typing import Optional

from pydantic import BaseModel

from schemas.achievement import AchievementUnlockedDTO
from schemas.elo import EloChangeDTO
from schemas.game import GameDTO
from schemas.player import PlayerScoreDTO
from schemas.records import RecordValue


class ReportResultDTO(BaseModel):
    player_id: str
    player_name: str
    corporation: str
    position: int
    tied: bool
    total_points: int
    mc_total: int
    scores: PlayerScoreDTO


class PreviousRecordDTO(BaseModel):
    value: RecordValue
    player_id: str
    holders: list[str]


class RecordBrokenDTO(BaseModel):
    code: str
    title: str
    value: RecordValue
    player_id: str
    holders: list[str]
    previous: PreviousRecordDTO


class RecordTiedDTO(BaseModel):
    code: str
    title: str
    value: RecordValue
    holders: list[str]


class NearRecordDTO(BaseModel):
    code: str
    title: str
    gap: RecordValue
    value: RecordValue
    player_id: str
    before: RecordValue


class StolenAwardDTO(BaseModel):
    award: str
    player_id: str
    opened_by: str


class GameReportDTO(BaseModel):
    game: GameDTO
    results: list[ReportResultDTO]
    winners: list[str]
    margin: int
    decided_by_mc: bool
    elo: list[EloChangeDTO]
    records_broken: list[RecordBrokenDTO]
    records_tied: list[RecordTiedDTO]
    near: list[NearRecordDTO]
    achievements_by_player: dict[str, list[AchievementUnlockedDTO]]
    stolen_awards: list[StolenAwardDTO]


class GameWriteResponseDTO(BaseModel):
    """Respuesta de crear y editar: conserva `id`/`game` (crear) y `message` (editar) y suma el informe."""
    id: str
    game: GameDTO
    report: GameReportDTO
    message: Optional[str] = None


class SummaryScoreDTO(BaseModel):
    player_id: str
    position: int
    total_points: int
    corporation: str


class GameSummaryDTO(BaseModel):
    """Una fila del archivo (STAT-09): lo que necesitan la lista y su pista de puntajes."""
    id: str
    date: date
    map: str
    expansions: list[str]
    generations: int
    draft: bool
    player_count: int
    winners: list[str]
    margin: int
    decided_by_mc: bool
    scores: list[SummaryScoreDTO]
