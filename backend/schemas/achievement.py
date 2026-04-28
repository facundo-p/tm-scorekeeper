from datetime import date
from typing import Optional
from pydantic import BaseModel


class AchievementUnlockedDTO(BaseModel):
    code: str
    title: str
    tier: int
    is_new: bool
    is_upgrade: bool
    icon: Optional[str]
    fallback_icon: str


class AchievementsByPlayerResponseDTO(BaseModel):
    achievements_by_player: dict[str, list[AchievementUnlockedDTO]]


class ProgressDTO(BaseModel):
    current: int
    target: int


class PlayerAchievementDTO(BaseModel):
    code: str
    title: str
    description: str
    tier: int              # 0 if locked
    max_tier: int
    icon: Optional[str]
    fallback_icon: str
    unlocked: bool
    unlocked_at: Optional[date]
    progress: Optional[ProgressDTO]


class PlayerAchievementsResponseDTO(BaseModel):
    achievements: list[PlayerAchievementDTO]


class AchievementTierInfoDTO(BaseModel):
    level: int
    threshold: int
    title: str


class HolderDTO(BaseModel):
    player_id: str
    player_name: str
    tier: int
    unlocked_at: date


class AchievementCatalogItemDTO(BaseModel):
    code: str
    description: str
    icon: Optional[str]
    fallback_icon: str
    tiers: list[AchievementTierInfoDTO]
    holders: list[HolderDTO]


class AchievementCatalogResponseDTO(BaseModel):
    achievements: list[AchievementCatalogItemDTO]


class PlayerReconcileChangeDTO(BaseModel):
    code: str
    old_tier: int
    new_tier: int


class ReconcileResponseDTO(BaseModel):
    total_players: int
    players_updated: int
    achievements_applied: list[PlayerReconcileChangeDTO]
    errors: list[str]
