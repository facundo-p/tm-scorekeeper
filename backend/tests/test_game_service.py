import pytest
from unittest.mock import MagicMock
from services.game_service import GamesService
from models.player_result import PlayerResult, PlayerEndStats
from models.player_score import PlayerScore
from models.enums import Corporation


def make_player(player_id: str, corp: Corporation) -> PlayerResult:
    scores = PlayerScore(
        terraform_rating=20,
        milestone_points=0,
        milestones=[],
        award_points=0,
        card_points=0,
        card_resource_points=0,
        greenery_points=0,
        city_points=0,
        turmoil_points=0,
    )
    return PlayerResult(
        player_id=player_id,
        corporation=corp,
        scores=scores,
        end_stats=PlayerEndStats(mc_total=0),
    )


@pytest.fixture
def service():
    return GamesService(
        games_repository=MagicMock(),
        players_repository=MagicMock(),
    )


class TestValidateCorporations:
    def test_distinct_non_novel_corps_ok(self, service):
        players = [
            make_player("p1", Corporation.CREDICOR),
            make_player("p2", Corporation.ECOLINE),
        ]
        service._validate_corporations(players)  # no exception

    def test_duplicate_non_novel_raises(self, service):
        players = [
            make_player("p1", Corporation.CREDICOR),
            make_player("p2", Corporation.CREDICOR),
        ]
        with pytest.raises(ValueError, match="more than one player"):
            service._validate_corporations(players)

    def test_two_players_with_novel_ok(self, service):
        players = [
            make_player("p1", Corporation.NOVEL),
            make_player("p2", Corporation.NOVEL),
        ]
        service._validate_corporations(players)  # no exception

    def test_novel_mixed_with_duplicate_non_novel_raises(self, service):
        players = [
            make_player("p1", Corporation.NOVEL),
            make_player("p2", Corporation.CREDICOR),
            make_player("p3", Corporation.CREDICOR),
        ]
        with pytest.raises(ValueError, match="more than one player"):
            service._validate_corporations(players)
