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
    levels: int = 1  # niveles alcanzados en la partida (F28)
    max_tier: int = 1  # niveles que tiene el logro (F29: «Nivel 2 de 5» o «Logro único»)
    glyph: str


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
    tiers: list[AchievementTierInfoDTO]
    holders: list[HolderDTO]
    kind: str
    glyph: str
    flavor: str


class AchievementCatalogResponseDTO(BaseModel):
    achievements: list[AchievementCatalogItemDTO]
    view: AchievementView = "all"
