"""ELO reproducido sobre un subconjunto (F22, STAT-02, SEMANTICS §3 y §9).

Con un filtro (por ejemplo, «mesa de 3»), la cuenta arranca en 1000 y solo ve esas
partidas; nunca se guarda. Sin filtro reproduce exactamente el historial guardado.
"""
from dataclasses import dataclass, field

from models.elo_change import EloChange
from services.elo_service import DEFAULT_ELO, calculate_elo_changes
from services.stats.context import StatsContext


@dataclass
class EloReplay:
    per_game: dict[str, list[EloChange]] = field(default_factory=dict)
    ratings: dict[str, int] = field(default_factory=dict)
    peaks: dict[str, int] = field(default_factory=dict)

    def after(self, game_id: str, player_id: str) -> int:
        return next(c.elo_after for c in self.per_game[game_id] if c.player_id == player_id)


def replay_elo(ctx: StatsContext) -> EloReplay:
    replay = EloReplay()
    for gs in ctx.games:
        snapshot = {p.player_id: replay.ratings.get(p.player_id, DEFAULT_ELO) for p in gs.game.player_results}
        changes = calculate_elo_changes(gs.game, snapshot)
        replay.per_game[gs.id] = changes
        for c in changes:
            replay.ratings[c.player_id] = c.elo_after
            replay.peaks[c.player_id] = max(replay.peaks.get(c.player_id, c.elo_after), c.elo_after)
    return replay
