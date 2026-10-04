"""Logros derivados de un subconjunto de partidas: nunca escribe (SEMANTICS §5 y §9)."""
from services.achievement_evaluators.catalog import ACHIEVEMENTS
from services.achievement_evaluators.metrics import timelines
from services.achievement_evaluators.tiers import AchievementState, evaluate
from services.stats.context import StatsContext
from services.stats.elo_replay import replay_elo

PlayerAchievements = dict[str, list[AchievementState]]


def derive_achievements(ctx: StatsContext, player_ids: list[str]) -> PlayerAchievements:
    """Estado de los 18 logros de cada jugador pedido (sin partidas: todo en cero)."""
    lines = timelines(ctx, replay_elo(ctx))
    return {pid: [evaluate(d, lines.get(pid, [])) for d in ACHIEVEMENTS] for pid in player_ids}
