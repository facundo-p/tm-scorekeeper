from models.achievement_definition import AchievementDefinition
from schemas.achievement import (
    AchievementCatalogItemDTO,
    AchievementTierInfoDTO,
    AchievementUnlockDTO,
    AchievementUnlockedDTO,
    HolderDTO,
    PlayerAchievementDTO,
    ProgressDTO,
)
from services.achievement_evaluators.catalog import ACHIEVEMENT_BY_CODE
from services.achievement_evaluators.tiers import AchievementState


def _icons(d: AchievementDefinition) -> dict:
    return {"icon": d.icon, "fallback_icon": d.fallback_icon, "glyph": d.glyph}


def game_unlock_to_dto(unlock) -> AchievementUnlockedDTO:
    d = ACHIEVEMENT_BY_CODE[unlock.code]
    return AchievementUnlockedDTO(code=d.code, title=d.tier(unlock.tier).title, tier=unlock.tier,
                                  is_new=unlock.is_new, is_upgrade=not unlock.is_new, levels=unlock.levels, **_icons(d))


def player_achievement_to_dto(state: AchievementState) -> PlayerAchievementDTO:
    d = state.definition
    progress = state.progress
    return PlayerAchievementDTO(
        code=d.code, title=(d.tier(state.tier) or d.tiers[0]).title, description=d.description,
        tier=state.tier, max_tier=d.max_tier, unlocked=state.tier > 0, unlocked_at=state.unlocked_on,
        progress=ProgressDTO(current=progress.current, target=progress.target) if progress else None,
        kind=d.kind, flavor=d.flavor, value=state.value,
        unlocks=[AchievementUnlockDTO(level=u.level, date=u.date, game_id=u.game_id) for u in state.unlocks],
        **_icons(d),
    )


def catalog_item_to_dto(d: AchievementDefinition, holders: list) -> AchievementCatalogItemDTO:
    return AchievementCatalogItemDTO(
        code=d.code, description=d.description, kind=d.kind, flavor=d.flavor,
        tiers=[AchievementTierInfoDTO(level=t.level, threshold=t.threshold, title=t.title) for t in d.tiers],
        holders=[HolderDTO(player_id=h.player_id, player_name=h.player_name, tier=h.tier, unlocked_at=h.unlocked_on)
                 for h in holders],
        **_icons(d),
    )
