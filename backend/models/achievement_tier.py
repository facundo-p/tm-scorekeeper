from dataclasses import dataclass


@dataclass
class AchievementTier:
    level: int       # 1, 2, 3...
    threshold: int   # 50, 75, 100...
    title: str       # "Colono", "Gran Terraformador"
