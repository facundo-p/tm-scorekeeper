"""Métricas de logros de un jugador después de cada partida (SEMANTICS §5).

Se recorren sus partidas del subconjunto en orden canónico; «ganó» = posición 1 (D-07).
"""
from dataclasses import dataclass, field, replace

from services.helpers.awards import stolen_awards
from services.stats.context import GameStats, StatsContext
from services.stats.elo_replay import EloReplay


@dataclass(frozen=True)
class AchievementMetrics:
    score: int = 0
    games: int = 0
    wins: int = 0
    streak: int = 0
    cur_streak: int = 0
    greenery: int = 0
    maps: frozenset = field(default_factory=frozenset)
    corps: frozenset = field(default_factory=frozenset)
    stolen: int = 0
    cards: int = 0
    cities: int = 0
    allMilestonesWin: int = 0
    noMilestoneWin: int = 0
    allAwardsWin: int = 0
    noAwardWin: int = 0
    photoFinish: int = 0
    blitz: int = 0
    giantKills: int = 0
    fullTableWin: int = 0

    def value(self, metric: str) -> int:
        v = getattr(self, metric)
        return len(v) if isinstance(v, frozenset) else v


@dataclass(frozen=True)
class TimelineStep:
    game: GameStats
    metrics: AchievementMetrics


def _stolen(gs: GameStats, pid: str) -> int:
    """Recompensas donde quedó 1.º solo y que financió otro."""
    return sum(1 for a in stolen_awards(gs.game) if a.first_place == [pid])


def _giant_kill(elo_before: dict[str, int], pid: str) -> int:
    """D-08: ELO previo estrictamente menor que el máximo ELO previo de la mesa."""
    return int(elo_before[pid] < max(elo_before.values()))


def _win_flags(m: AchievementMetrics, gs: GameStats, pid: str, elo_before: dict[str, int]) -> AchievementMetrics:
    milestones = len(gs.scores_of(pid).milestones)
    firsts = sum(1 for a in gs.game.awards if pid in a.first_place)
    return replace(
        m, wins=m.wins + 1, giantKills=m.giantKills + _giant_kill(elo_before, pid),
        allMilestonesWin=m.allMilestonesWin or int(milestones == 3),
        noMilestoneWin=m.noMilestoneWin or int(milestones == 0),
        allAwardsWin=m.allAwardsWin or int(len(gs.game.awards) == 3 and firsts == 3),
        noAwardWin=m.noAwardWin or int(firsts == 0),
        photoFinish=m.photoFinish or int(len(gs.winners) == 1 and gs.margin <= 2),
        blitz=m.blitz or int(gs.game.generations <= 9),
        fullTableWin=m.fullTableWin or int(len(gs.results) == 5),
    )


def step(m: AchievementMetrics, gs: GameStats, pid: str, elo_before: dict[str, int]) -> AchievementMetrics:
    result = next(r for r in gs.results if r.player_id == pid)
    scores, won = gs.scores_of(pid), result.position == 1
    cur = m.cur_streak + 1 if won else 0
    player = next(p for p in gs.game.player_results if p.player_id == pid)
    m = replace(
        m, score=max(m.score, result.total_points), games=m.games + 1, cur_streak=cur, streak=max(m.streak, cur),
        greenery=m.greenery + scores.greenery_points, maps=m.maps | {gs.game.map_name},
        corps=m.corps | {player.corporation}, cards=max(m.cards, scores.card_points),
        cities=max(m.cities, scores.city_points), stolen=max(m.stolen, _stolen(gs, pid)),
    )
    return _win_flags(m, gs, pid, elo_before) if won else m


def _elo_before(replay: EloReplay, gs: GameStats) -> dict[str, int]:
    return {c.player_id: c.elo_before for c in replay.per_game[gs.id]}


def timelines(ctx: StatsContext, replay: EloReplay) -> dict[str, list[TimelineStep]]:
    """Línea de tiempo de cada jugador que aparece en el subconjunto."""
    current: dict[str, AchievementMetrics] = {}
    out: dict[str, list[TimelineStep]] = {}
    for gs in ctx.games:
        before = _elo_before(replay, gs)
        for r in gs.results:
            current[r.player_id] = step(current.get(r.player_id, AchievementMetrics()), gs, r.player_id, before)
            out.setdefault(r.player_id, []).append(TimelineStep(gs, current[r.player_id]))
    return out
