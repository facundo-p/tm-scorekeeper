from dataclasses import dataclass

from models.achievement_tier import AchievementTier


@dataclass(frozen=True)
class AchievementDefinition:
    """Un logro (SEMANTICS §5): `metric` nombra la métrica acumulada; `kind` es
    `max`, `sum` o `flag` (un solo nivel, sin progreso)."""
    code: str
    description: str
    glyph: str = ""     # ícono del rediseño (frontend/src/ui/icons)
    kind: str = "sum"
    metric: str = ""
    flavor: str = ""
    tiers: tuple[AchievementTier, ...] = ()

    @property
    def max_tier(self) -> int:
        return max(t.level for t in self.tiers)

    def tier(self, level: int) -> AchievementTier | None:
        return next((t for t in self.tiers if t.level == level), None)
