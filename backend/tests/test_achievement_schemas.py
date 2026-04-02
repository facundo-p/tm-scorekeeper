"""Tests for achievement DTOs (schemas) and mapper functions.

TDD RED phase: these tests define the expected behavior before implementation.
"""
import pytest
from datetime import date
from unittest.mock import MagicMock
from models.achievement_tier import AchievementTier
from models.achievement_definition import AchievementDefinition
from models.achievement_progress import Progress
from models.evaluation_result import EvaluationResult


# ── Helpers ────────────────────────────────────────────────────────────────────

def make_definition(
    code="high_score",
    tiers=None,
    show_progress=False,
    icon="trophy.svg",
    fallback_icon="trophy",
    description="Score high",
):
    if tiers is None:
        tiers = [
            AchievementTier(level=1, threshold=50, title="Colono"),
            AchievementTier(level=2, threshold=75, title="Gran Terraformador"),
            AchievementTier(level=3, threshold=100, title="Leyenda de Marte"),
        ]
    return AchievementDefinition(
        code=code,
        description=description,
        icon=icon,
        fallback_icon=fallback_icon,
        tiers=tiers,
        show_progress=show_progress,
    )


def make_evaluator(definition=None):
    """Create a mock evaluator with a real definition."""
    if definition is None:
        definition = make_definition()
    ev = MagicMock()
    ev.definition = definition
    ev.code = definition.code
    return ev


# ── DTO Serialization Tests ────────────────────────────────────────────────────

class TestAchievementUnlockedDTO:
    def test_serializes_with_required_fields(self):
        from schemas.achievement import AchievementUnlockedDTO
        dto = AchievementUnlockedDTO(
            code="high_score",
            title="Colono",
            tier=1,
            is_new=True,
            is_upgrade=False,
            icon="trophy.svg",
            fallback_icon="trophy",
        )
        assert dto.code == "high_score"
        assert dto.title == "Colono"
        assert dto.tier == 1
        assert dto.is_new is True
        assert dto.is_upgrade is False
        assert dto.icon == "trophy.svg"
        assert dto.fallback_icon == "trophy"

    def test_icon_can_be_none(self):
        from schemas.achievement import AchievementUnlockedDTO
        dto = AchievementUnlockedDTO(
            code="games_played",
            title="Novato",
            tier=1,
            is_new=True,
            is_upgrade=False,
            icon=None,
            fallback_icon="gamepad",
        )
        assert dto.icon is None


class TestProgressDTO:
    def test_serializes_with_current_and_target(self):
        from schemas.achievement import ProgressDTO
        dto = ProgressDTO(current=7, target=10)
        assert dto.current == 7
        assert dto.target == 10


class TestPlayerAchievementDTO:
    def test_serializes_with_all_fields(self):
        from schemas.achievement import PlayerAchievementDTO, ProgressDTO
        dto = PlayerAchievementDTO(
            code="high_score",
            title="Gran Terraformador",
            description="Score high",
            tier=3,
            max_tier=5,
            icon="trophy.svg",
            fallback_icon="trophy",
            unlocked=True,
            unlocked_at=date(2026, 3, 1),
            progress=ProgressDTO(current=108, target=125),
        )
        assert dto.code == "high_score"
        assert dto.tier == 3
        assert dto.max_tier == 5
        assert dto.unlocked is True
        assert dto.unlocked_at == date(2026, 3, 1)
        assert dto.progress is not None
        assert dto.progress.current == 108

    def test_progress_can_be_none(self):
        from schemas.achievement import PlayerAchievementDTO
        dto = PlayerAchievementDTO(
            code="high_score",
            title="Colono",
            description="Score high",
            tier=0,
            max_tier=5,
            icon=None,
            fallback_icon="trophy",
            unlocked=False,
            unlocked_at=None,
            progress=None,
        )
        assert dto.unlocked is False
        assert dto.unlocked_at is None
        assert dto.progress is None


class TestAchievementsByPlayerResponseDTO:
    def test_serializes_dict_of_player_to_list_of_unlocked(self):
        from schemas.achievement import AchievementsByPlayerResponseDTO, AchievementUnlockedDTO
        unlocked = AchievementUnlockedDTO(
            code="high_score",
            title="Colono",
            tier=1,
            is_new=True,
            is_upgrade=False,
            icon=None,
            fallback_icon="trophy",
        )
        dto = AchievementsByPlayerResponseDTO(
            achievements_by_player={"player1": [unlocked]}
        )
        assert "player1" in dto.achievements_by_player
        assert len(dto.achievements_by_player["player1"]) == 1


class TestAchievementCatalogItemDTO:
    def test_serializes_with_tiers_and_holders(self):
        from schemas.achievement import AchievementCatalogItemDTO, AchievementTierInfoDTO, HolderDTO
        tier_info = AchievementTierInfoDTO(level=1, threshold=50, title="Colono")
        holder = HolderDTO(player_id="p1", player_name="Alice", tier=1, unlocked_at=date(2026, 1, 1))
        dto = AchievementCatalogItemDTO(
            code="high_score",
            title="Colono",
            description="Score high",
            icon="trophy.svg",
            fallback_icon="trophy",
            tiers=[tier_info],
            holders=[holder],
        )
        assert dto.code == "high_score"
        assert len(dto.tiers) == 1
        assert len(dto.holders) == 1
        assert dto.holders[0].player_id == "p1"


# ── Mapper Tests ───────────────────────────────────────────────────────────────

class TestEvaluationResultToUnlockedDTO:
    def test_maps_correctly_for_new_unlock(self):
        from mappers.achievement_mapper import evaluation_result_to_unlocked_dto
        defn = make_definition(tiers=[
            AchievementTier(level=1, threshold=50, title="Colono"),
            AchievementTier(level=2, threshold=75, title="Gran Terraformador"),
        ])
        ev = make_evaluator(defn)
        result = EvaluationResult(new_tier=1, is_new=True, is_upgrade=False)

        dto = evaluation_result_to_unlocked_dto(ev, result)

        assert dto.code == "high_score"
        assert dto.title == "Colono"  # title of tier level=1
        assert dto.tier == 1
        assert dto.is_new is True
        assert dto.is_upgrade is False
        assert dto.icon == "trophy.svg"
        assert dto.fallback_icon == "trophy"

    def test_maps_correctly_for_upgrade(self):
        from mappers.achievement_mapper import evaluation_result_to_unlocked_dto
        defn = make_definition(tiers=[
            AchievementTier(level=1, threshold=50, title="Colono"),
            AchievementTier(level=2, threshold=75, title="Gran Terraformador"),
        ])
        ev = make_evaluator(defn)
        result = EvaluationResult(new_tier=2, is_new=False, is_upgrade=True)

        dto = evaluation_result_to_unlocked_dto(ev, result)

        assert dto.title == "Gran Terraformador"  # title of tier level=2
        assert dto.tier == 2
        assert dto.is_upgrade is True

    def test_maps_icon_correctly_when_none(self):
        from mappers.achievement_mapper import evaluation_result_to_unlocked_dto
        defn = make_definition(icon=None, fallback_icon="gamepad", tiers=[
            AchievementTier(level=1, threshold=5, title="Novato"),
        ])
        ev = make_evaluator(defn)
        result = EvaluationResult(new_tier=1, is_new=True, is_upgrade=False)

        dto = evaluation_result_to_unlocked_dto(ev, result)
        assert dto.icon is None
        assert dto.fallback_icon == "gamepad"


class TestBuildPlayerAchievementDTO:
    def test_locked_case_tier_0(self):
        from mappers.achievement_mapper import build_player_achievement_dto
        defn = make_definition(tiers=[
            AchievementTier(level=1, threshold=50, title="Colono"),
            AchievementTier(level=2, threshold=75, title="Gran Terraformador"),
            AchievementTier(level=3, threshold=100, title="Leyenda"),
        ])
        ev = make_evaluator(defn)

        dto = build_player_achievement_dto(ev, persisted_tier=0, unlocked_at=None, progress=None)

        assert dto.code == "high_score"
        assert dto.tier == 0
        assert dto.unlocked is False
        assert dto.unlocked_at is None
        assert dto.progress is None
        assert dto.max_tier == 3  # max level in tiers

    def test_unlocked_case_tier_greater_than_0(self):
        from mappers.achievement_mapper import build_player_achievement_dto
        defn = make_definition(tiers=[
            AchievementTier(level=1, threshold=50, title="Colono"),
            AchievementTier(level=2, threshold=75, title="Gran Terraformador"),
        ])
        ev = make_evaluator(defn)
        unlocked_at = date(2026, 3, 15)

        dto = build_player_achievement_dto(ev, persisted_tier=2, unlocked_at=unlocked_at, progress=None)

        assert dto.tier == 2
        assert dto.unlocked is True
        assert dto.unlocked_at == date(2026, 3, 15)

    def test_maps_progress_when_provided(self):
        from mappers.achievement_mapper import build_player_achievement_dto
        defn = make_definition(show_progress=True, tiers=[
            AchievementTier(level=1, threshold=5, title="Novato"),
        ])
        ev = make_evaluator(defn)
        progress = Progress(current=7, target=10)

        dto = build_player_achievement_dto(ev, persisted_tier=1, unlocked_at=date(2026, 1, 1), progress=progress)

        assert dto.progress is not None
        assert dto.progress.current == 7
        assert dto.progress.target == 10

    def test_title_uses_first_tier(self):
        """title = first tier title (canonical name per research recommendation)."""
        from mappers.achievement_mapper import build_player_achievement_dto
        defn = make_definition(tiers=[
            AchievementTier(level=1, threshold=5, title="Novato"),
            AchievementTier(level=2, threshold=10, title="Habitue"),
        ])
        ev = make_evaluator(defn)

        dto = build_player_achievement_dto(ev, persisted_tier=2, unlocked_at=date(2026, 1, 1), progress=None)

        # title should always be the first tier's title (canonical name)
        assert dto.title == "Novato"
