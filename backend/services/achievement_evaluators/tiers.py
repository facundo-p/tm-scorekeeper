"""Bucle de niveles único (F23, STAT-04, D-04): cada nivel queda fechado con la primera
partida en que la métrica alcanzó su umbral; el progreso sale del valor final."""
from dataclasses import dataclass
from datetime import date
from typing import Optional

from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from services.achievement_evaluators.metrics import AchievementMetrics, TimelineStep


@dataclass(frozen=True)
class Unlock:
    level: int
    date: date
    game_id: str


@dataclass(frozen=True)
class AchievementState:
    definition: AchievementDefinition
    tier: int
    value: int
    unlocks: tuple[Unlock, ...]
    progress: Optional[Progress]

    @property
    def unlocked_on(self) -> Optional[date]:
        return self.unlocks[-1].date if self.unlocks else None


def _unlocks(d: AchievementDefinition, timeline: list[TimelineStep]) -> tuple[Unlock, ...]:
    found = []
    for t in d.tiers:
        hit = next((s for s in timeline if s.metrics.value(d.metric) >= t.threshold), None)
        if hit:
            found.append(Unlock(t.level, hit.game.game.date, hit.game.id))
    return tuple(found)


def _progress(d: AchievementDefinition, tier: int, final: AchievementMetrics) -> Optional[Progress]:
    """Hacia el nivel siguiente; nunca en `flag`. En `win_streak` usa la racha actual."""
    nxt = d.tier(tier + 1)
    if nxt is None or d.kind == "flag":
        return None
    current = final.cur_streak if d.code == "win_streak" else final.value(d.metric)
    return Progress(current=min(current, nxt.threshold), target=nxt.threshold)


def evaluate(d: AchievementDefinition, timeline: list[TimelineStep]) -> AchievementState:
    final = timeline[-1].metrics if timeline else AchievementMetrics()
    unlocks = _unlocks(d, timeline)
    tier = unlocks[-1].level if unlocks else 0
    return AchievementState(d, tier, final.value(d.metric), unlocks, _progress(d, tier, final))
