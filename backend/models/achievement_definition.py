from dataclasses import dataclass
from models.achievement_tier import AchievementTier


@dataclass
class AchievementDefinition:
    code: str
    description: str
    icon: str | None
    fallback_icon: str
    tiers: list[AchievementTier]
    show_progress: bool
