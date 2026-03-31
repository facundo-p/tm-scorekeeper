import pytest
from datetime import date, timedelta
from db.models import Player as PlayerORM, PlayerAchievement
from db.session import get_session
from repositories.achievement_repository import AchievementRepository


# ── Domain model smoke tests ─────────────────────────────────────────────────

def test_domain_models():
    from models.achievement_tier import AchievementTier
    from models.achievement_definition import AchievementDefinition
    from models.achievement_progress import Progress
    from models.evaluation_result import EvaluationResult

    t = AchievementTier(level=1, threshold=50, title="Colono")
    d = AchievementDefinition(
        code="high_score",
        description="Alcanzar X puntos",
        icon=None,
        fallback_icon="trophy",
        tiers=[t],
        show_progress=False,
    )
    p = Progress(current=7, target=10)
    r = EvaluationResult(new_tier=3, is_new=True, is_upgrade=False)
    r2 = EvaluationResult(new_tier=None)

    assert t.level == 1
    assert t.threshold == 50
    assert t.title == "Colono"
    assert d.icon is None
    assert p.current == 7
    assert p.target == 10
    assert r.new_tier == 3
    assert r2.is_new is False
    assert r2.is_upgrade is False


# ── Repository fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def repo():
    return AchievementRepository()


@pytest.fixture
def db_player():
    """Create a test player in the DB and return their ID."""
    pid = "test-player-achievements"
    with get_session() as session:
        existing = session.get(PlayerORM, pid)
        if not existing:
            session.add(PlayerORM(id=pid, name="Test Player", is_active=True))
            session.commit()
    return pid


# ── Upsert tests ──────────────────────────────────────────────────────────────

class TestAchievementRepositoryUpsert:
    def test_insert_new_achievement(self, repo, db_player):
        repo.upsert(db_player, "high_score", tier=1)
        results = repo.get_for_player(db_player)
        assert len(results) == 1
        assert results[0].code == "high_score"
        assert results[0].tier == 1

    def test_upsert_upgrades_tier(self, repo, db_player):
        repo.upsert(db_player, "games_played", tier=1)
        repo.upsert(db_player, "games_played", tier=2)
        results = repo.get_for_player(db_player)
        assert len(results) == 1
        assert results[0].tier == 2

    def test_upsert_no_downgrade(self, repo, db_player):
        """Core invariant: tier never goes down."""
        repo.upsert(db_player, "win_streak", tier=3)
        repo.upsert(db_player, "win_streak", tier=1)  # attempt downgrade
        results = repo.get_for_player(db_player)
        assert results[0].tier == 3  # unchanged

    def test_upsert_same_tier_does_not_change_unlocked_at(self, repo, db_player):
        """Same tier = no-op (unlocked_at must not change)."""
        repo.upsert(db_player, "all_maps", tier=2)
        results_before = repo.get_for_player(db_player)
        original_date = results_before[0].unlocked_at
        repo.upsert(db_player, "all_maps", tier=2)  # same tier
        results_after = repo.get_for_player(db_player)
        assert results_after[0].unlocked_at == original_date

    def test_get_for_player_empty(self, repo, db_player):
        results = repo.get_for_player(db_player)
        assert results == []

    def test_get_for_player_multiple_achievements(self, repo, db_player):
        repo.upsert(db_player, "high_score", tier=1)
        repo.upsert(db_player, "games_played", tier=2)
        results = repo.get_for_player(db_player)
        codes = {r.code for r in results}
        assert codes == {"high_score", "games_played"}


class TestPlayerRelationship:
    def test_player_achievements_relationship(self, repo, db_player):
        """PERS-04: Player.achievements relationship loads correctly."""
        repo.upsert(db_player, "games_won", tier=1)
        with get_session() as session:
            player = session.get(PlayerORM, db_player)
            # Eager-load relationship within session
            achievements = list(player.achievements)
        assert len(achievements) >= 1
        assert any(a.code == "games_won" for a in achievements)
