from dataclasses import dataclass

from models.achievement_tier import AchievementTier


@dataclass(frozen=True)
class AchievementDefinition:
    """Un logro (SEMANTICS §5): `metric` nombra la métrica acumulada; `kind` es
    `max`, `sum` o `flag` (un solo nivel, sin progreso)."""
    code: str
    description: str
    fallback_icon: str  # nombre de ícono Lucide del frontend previo a F28
    glyph: str = ""     # ícono del rediseño (frontend/src/ui/icons)
    kind: str = "sum"
    metric: str = ""
    flavor: str = ""
    tiers: tuple[AchievementTier, ...] = ()
    icon: str | None = None
    show_progress: bool = False  # solo los evaluadores de v1; se retira en 23-C

    @property
    def max_tier(self) -> int:
        return max(t.level for t in self.tiers)

    def tier(self, level: int) -> AchievementTier | None:
        return next((t for t in self.tiers if t.level == level), None)
