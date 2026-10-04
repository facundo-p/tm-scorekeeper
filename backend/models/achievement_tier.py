from dataclasses import dataclass


@dataclass(frozen=True)
class AchievementTier:
    level: int
    threshold: int
    title: str
