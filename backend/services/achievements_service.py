"""Logros derivados del historial (F23, D-04): el estado sale siempre de las partidas; la tabla
`achievement_unlocks` guarda la vista sin filtro y se regenera en cada escritura."""
from dataclasses import dataclass, field

from models.game_subset import ALL_GAMES, GameSubset
from repositories.achievement_repository import UnlockRow
from services.achievement_evaluators.catalog import ACHIEVEMENTS
from services.achievement_evaluators.derive import PlayerAchievements, derive_achievements
from services.achievement_evaluators.tiers import AchievementState
from services.stats.context import StatsContext


@dataclass(frozen=True)
class PlayerReconcileChange:
    code: str
    old_tier: int
    new_tier: int


@dataclass
class ReconcileSummaryResult:
    total_players: int = 0
    players_updated: int = 0
    achievements_applied: list = field(default_factory=list)
    errors: list = field(default_factory=list)


@dataclass(frozen=True)
class GameUnlock:
    """Lo que una partida le dio a un jugador en un logro: el nivel más alto alcanzado ahí."""
    code: str
    tier: int
    is_new: bool


@dataclass(frozen=True)
class CatalogHolder:
    player_id: str
    player_name: str
    tier: int
    unlocked_on: object


def _rows(derived: PlayerAchievements) -> list[UnlockRow]:
    return [UnlockRow(pid, s.definition.code, u.level, u.game_id, u.date)
            for pid, states in derived.items() for s in states for u in s.unlocks]


def _max_tiers(rows: list[UnlockRow]) -> dict[tuple[str, str], int]:
    tiers: dict[tuple[str, str], int] = {}
    for r in rows:
        tiers[(r.player_id, r.code)] = max(tiers.get((r.player_id, r.code), 0), r.tier)
    return tiers


def _changes(before: list[UnlockRow], after: list[UnlockRow]) -> dict[str, list[PlayerReconcileChange]]:
    old, new = _max_tiers(before), _max_tiers(after)
    changes: dict[str, list[PlayerReconcileChange]] = {}
    for key in sorted(old.keys() | new.keys()):
        if old.get(key, 0) != new.get(key, 0):
            changes.setdefault(key[0], []).append(PlayerReconcileChange(key[1], old.get(key, 0), new.get(key, 0)))
    return changes


def _game_unlocks(rows: list[UnlockRow]) -> dict[str, list[GameUnlock]]:
    levels: dict[tuple[str, str], list[int]] = {}
    for r in rows:
        levels.setdefault((r.player_id, r.code), []).append(r.tier)
    out: dict[str, list[GameUnlock]] = {}
    for (pid, code), tiers in levels.items():
        out.setdefault(pid, []).append(GameUnlock(code, max(tiers), is_new=min(tiers) == 1))
    return out


def _holders(states: dict[str, AchievementState], names: dict[str, str]) -> list[CatalogHolder]:
    holders = [CatalogHolder(pid, names.get(pid, pid), s.tier, s.unlocked_on) for pid, s in states.items() if s.tier]
    return sorted(holders, key=lambda h: (-h.tier, h.unlocked_on))


class AchievementsService:
    def __init__(self, games_repository, achievement_repository, players_repository):
        self.games_repository = games_repository
        self.achievement_repository = achievement_repository
        self.players_repository = players_repository

    def _derive(self, subset: GameSubset, player_ids=None) -> PlayerAchievements:
        ids = player_ids or [p.player_id for p in self.players_repository.get_all()]
        return derive_achievements(StatsContext.load(self.games_repository, subset), ids)

    def recompute_all(self) -> dict[str, list[PlayerReconcileChange]]:
        """Regenera la tabla desde el historial; devuelve los cambios de nivel por jugador.
        Va dentro de la unidad de trabajo de la escritura, después del ELO (STAT-05)."""
        before = self.achievement_repository.get_all()
        after = _rows(self._derive(ALL_GAMES))
        self.achievement_repository.replace_all(after)
        return _changes(before, after)

    def reconcile_all(self) -> ReconcileSummaryResult:
        changes = self.recompute_all()
        return ReconcileSummaryResult(
            total_players=len(self.players_repository.get_all()), players_updated=len(changes),
            achievements_applied=[c for cs in changes.values() for c in cs],
        )

    def unlocked_in_game(self, game_id: str) -> dict[str, list[GameUnlock]]:
        """Lectura repetible de lo que la partida desbloqueó (STAT-05)."""
        return _game_unlocks(self.achievement_repository.get_for_game(game_id))

    def get_player_achievements(self, player_id: str, subset: GameSubset = ALL_GAMES) -> list[AchievementState]:
        return self._derive(subset, [player_id])[player_id]

    def get_catalog(self, subset: GameSubset = ALL_GAMES) -> list[tuple]:
        """[(definición, poseedores)] con poseedores por nivel desc. y fecha."""
        players = self.players_repository.get_all()
        names = {p.player_id: p.name for p in players}
        derived = self._derive(subset, [p.player_id for p in players])
        by_code = {d.code: {pid: states[i] for pid, states in derived.items()} for i, d in enumerate(ACHIEVEMENTS)}
        return [(d, _holders(by_code[d.code], names)) for d in ACHIEVEMENTS]

