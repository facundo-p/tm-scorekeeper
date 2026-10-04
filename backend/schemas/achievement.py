from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel

# «all»: todas las partidas; «mesa»: solo las de un tamaño de mesa, nunca se guarda (SEMANTICS §9).
AchievementView = Literal["all", "mesa"]


class AchievementUnlockedDTO(BaseModel):
    code: str
    title: str
    tier: int
    is_new: bool
    is_upgrade: bool
    icon: Optional[str]
    fallback_icon: str
    glyph: str


class AchievementsByPlayerResponseDTO(BaseModel):
    achievements_by_player: dict[str, list[AchievementUnlockedDTO]]


class ProgressDTO(BaseModel):
    current: int
    target: int


class AchievementUnlockDTO(BaseModel):
    level: int
    date: date
    game_id: str


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
    # F23: campos aditivos
    kind: str
    glyph: str
    flavor: str
    value: int
    unlocks: list[AchievementUnlockDTO]


class PlayerAchievementsResponseDTO(BaseModel):
    achievements: list[PlayerAchievementDTO]
    view: AchievementView = "all"


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
    kind: str
    glyph: str
    flavor: str


class AchievementCatalogResponseDTO(BaseModel):
    achievements: list[AchievementCatalogItemDTO]
    view: AchievementView = "all"


class PlayerReconcileChangeDTO(BaseModel):
    code: str
    old_tier: int
    new_tier: int


class ReconcileResponseDTO(BaseModel):
    total_players: int
    players_updated: int
    achievements_applied: list[PlayerReconcileChangeDTO]
    errors: list[str]
