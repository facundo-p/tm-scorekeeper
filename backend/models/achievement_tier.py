from dataclasses import dataclass


@dataclass
class AchievementTier:
    level: int
    threshold: int
    title: str
