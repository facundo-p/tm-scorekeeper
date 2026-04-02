from datetime import date
from typing import Optional

from models.achievement_progress import Progress
from models.evaluation_result import EvaluationResult
from services.achievement_evaluators.base import AchievementEvaluator
from schemas.achievement import (
    AchievementUnlockedDTO,
    AchievementCatalogItemDTO,
    AchievementTierInfoDTO,
    HolderDTO,
    PlayerAchievementDTO,
    ProgressDTO,
)


def evaluation_result_to_unlocked_dto(
    evaluator: AchievementEvaluator,
    result: EvaluationResult,
) -> AchievementUnlockedDTO:
    """Map an EvaluationResult + AchievementEvaluator to AchievementUnlockedDTO."""
    title = next(
        t.title for t in evaluator.definition.tiers if t.level == result.new_tier
    )
    return AchievementUnlockedDTO(
        code=evaluator.code,
        title=title,
        tier=result.new_tier,
        is_new=result.is_new,
        is_upgrade=result.is_upgrade,
        icon=evaluator.definition.icon,
        fallback_icon=evaluator.definition.fallback_icon,
    )


def build_player_achievement_dto(
    evaluator: AchievementEvaluator,
    persisted_tier: int,
    unlocked_at: Optional[date],
    progress: Optional[Progress],
) -> PlayerAchievementDTO:
    """Build a full PlayerAchievementDTO from evaluator state and persisted data."""
    title = next(
        (t.title for t in evaluator.definition.tiers if t.level == persisted_tier),
        evaluator.definition.tiers[0].title,
    )
    max_tier = max(t.level for t in evaluator.definition.tiers)
    progress_dto = (
        ProgressDTO(current=progress.current, target=progress.target)
        if progress is not None
        else None
    )
    return PlayerAchievementDTO(
        code=evaluator.code,
        title=title,
        description=evaluator.definition.description,
        tier=persisted_tier,
        max_tier=max_tier,
        icon=evaluator.definition.icon,
        fallback_icon=evaluator.definition.fallback_icon,
        unlocked=persisted_tier > 0,
        unlocked_at=unlocked_at,
        progress=progress_dto,
    )


def build_catalog_item_dto(
    evaluator: AchievementEvaluator,
    holders: list[tuple],  # (player_id, player_name, tier, unlocked_at)
) -> AchievementCatalogItemDTO:
    """Build an AchievementCatalogItemDTO from evaluator and holders list."""
    tiers = [
        AchievementTierInfoDTO(level=t.level, threshold=t.threshold, title=t.title)
        for t in evaluator.definition.tiers
    ]
    holder_dtos = [
        HolderDTO(player_id=h[0], player_name=h[1], tier=h[2], unlocked_at=h[3])
        for h in holders
    ]
    return AchievementCatalogItemDTO(
        code=evaluator.code,
        title=evaluator.definition.description,
        description=evaluator.definition.description,
        icon=evaluator.definition.icon,
        fallback_icon=evaluator.definition.fallback_icon,
        tiers=tiers,
        holders=holder_dtos,
    )
