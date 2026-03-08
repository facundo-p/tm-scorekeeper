from datetime import date
from schemas.game import GameDTO, PlayerResultDTO
from schemas.player import PlayerScoreDTO, PlayerEndStatsDTO
from services.player_profile_service import PlayerProfileService
from models.enums import Corporation
from models.player import Player
from mappers.game_mapper import game_dto_to_model

import pytest


@pytest.fixture
def session_factory():
    from db.session import get_session
    return get_session


@pytest.fixture
def players_repo(session_factory):
    from repositories.player_repository import PlayersRepository
    return PlayersRepository(session_factory=session_factory)


@pytest.fixture
def games_repo(session_factory):
    from repositories.game_repository import GamesRepository
    return GamesRepository(session_factory=session_factory)


@pytest.fixture
def player_profile_service(players_repo, games_repo):
    # PlayerRecordsService no longer requires a separate RecordsService.
    from services.player_records_service import PlayerRecordsService

    player_records_service = PlayerRecordsService(games_repository=games_repo)

    return PlayerProfileService(
        players_repository=players_repo,
        games_repository=games_repo,
        player_records_service=player_records_service,
    )


def test_player_with_no_games_has_zero_stats(player_profile_service, players_repo):
    # arrange: register player but do not insert any game
    players_repo.create(Player(player_id="p1", name="Test", is_active=True))
    profile = player_profile_service.get_profile("p1")

    assert profile.player_id == "p1"
    assert profile.stats.games_played == 0
    assert profile.stats.games_won == 0
    assert profile.stats.win_rate == 0.0
    assert profile.games == []


def test_player_with_one_winning_game_has_100_percent_win_rate(
    player_profile_service, players_repo, games_repo
):
    # prepare players
    players_repo.create(Player(player_id="p1", name="Test", is_active=True))
    players_repo.create(Player(player_id="p2", name="Opponent", is_active=True))

    player_pl = PlayerResultDTO(
        player_id="p1",
        corporation=Corporation.THARSIS_REPUBLIC,
        scores=PlayerScoreDTO(
            terraform_rating=35,
            milestone_points=5,
            milestones=["Mayor"],
            award_points=8,
            card_points=6,
            card_resource_points=2,
            greenery_points=7,
            city_points=3,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=10),
    )

    opponent = PlayerResultDTO(
        player_id="p2",
        corporation=Corporation.ECOLINE,
        scores=PlayerScoreDTO(
            terraform_rating=30,
            milestone_points=0,
            milestones=[],
            award_points=5,
            card_points=4,
            card_resource_points=1,
            greenery_points=5,
            city_points=2,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=5),
    )

    game = GameDTO(
        id="game-1",
        date=date(2026, 1, 26),
        map="Hellas",
        expansions=["Prelude"],
        draft=True,
        generations=10,
        player_results=[player_pl, opponent],
        awards=[],
    )

    games_repo.create(game_dto_to_model(game))

    profile = player_profile_service.get_profile("p1")

    assert profile.stats.games_played == 1
    assert profile.stats.games_won == 1
    assert profile.stats.win_rate == 1.0
    assert len(profile.games) == 1
    summary = profile.games[0]
    assert summary.game_id == "game-1"
    assert summary.position == 1


def test_player_with_multiple_games_and_one_win_has_correct_win_rate(
    player_profile_service, players_repo, games_repo
):
    # register all participants so foreign key constraints are satisfied
    players_repo.create(Player(player_id="p1", name="Test", is_active=True))
    players_repo.create(Player(player_id="p2", name="Opponent", is_active=True))
    players_repo.create(Player(player_id="p3", name="Third", is_active=True))

    base_player = PlayerResultDTO(
        player_id="p1",
        corporation=Corporation.THARSIS_REPUBLIC,
        scores=PlayerScoreDTO(
            terraform_rating=35,
            milestone_points=5,
            milestones=["Mayor"],
            award_points=8,
            card_points=6,
            card_resource_points=2,
            greenery_points=7,
            city_points=3,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=10),
    )

    opponent_g1 = PlayerResultDTO(
        player_id="p2",
        corporation=Corporation.ECOLINE,
        scores=PlayerScoreDTO(
            terraform_rating=30,
            milestone_points=0,
            milestones=[],
            award_points=5,
            card_points=4,
            card_resource_points=1,
            greenery_points=5,
            city_points=2,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=5),
    )

    game1 = GameDTO(
        id="game-1",
        date=date(2026, 1, 1),
        map="Hellas",
        expansions=[],
        draft=False,
        generations=10,
        player_results=[base_player, opponent_g1],
        awards=[],
    )

    losing_p1_game2 = PlayerResultDTO(
        player_id="p1",
        corporation=Corporation.THARSIS_REPUBLIC,
        scores=PlayerScoreDTO(
            terraform_rating=20,
            milestone_points=0,
            milestones=[],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=3),
    )

    winning_opponent_game2 = PlayerResultDTO(
        player_id="p2",
        corporation=Corporation.ECOLINE,
        scores=PlayerScoreDTO(
            terraform_rating=40,
            milestone_points=5,
            milestones=["Planner"],
            award_points=8,
            card_points=6,
            card_resource_points=2,
            greenery_points=7,
            city_points=3,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=12),
    )

    game2 = GameDTO(
        id="game-2",
        date=date(2026, 1, 5),
        map="Hellas",
        expansions=[],
        draft=False,
        generations=10,
        player_results=[winning_opponent_game2, losing_p1_game2],
        awards=[],
    )

    third_player = PlayerResultDTO(
        player_id="p3",
        corporation=Corporation.CREDICOR,
        scores=PlayerScoreDTO(
            terraform_rating=45,
            milestone_points=5,
            milestones=["Builder"],
            award_points=8,
            card_points=7,
            card_resource_points=3,
            greenery_points=8,
            city_points=4,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=15),
    )

    losing_p1_game3 = PlayerResultDTO(
        player_id="p1",
        corporation=Corporation.THARSIS_REPUBLIC,
        scores=PlayerScoreDTO(
            terraform_rating=25,
            milestone_points=0,
            milestones=[],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStatsDTO(mc_total=4),
    )

    game3 = GameDTO(
        id="game-3",
        date=date(2026, 1, 10),
        map="Hellas",
        expansions=[],
        draft=False,
        generations=10,
        player_results=[third_player, opponent_g1, losing_p1_game3],
        awards=[],
    )

    games_repo.create(game_dto_to_model(game1))
    games_repo.create(game_dto_to_model(game2))
    games_repo.create(game_dto_to_model(game3))

    profile = player_profile_service.get_profile("p1")

    assert profile.stats.games_played == 3
    assert profile.stats.games_won == 1
    assert profile.stats.win_rate == pytest.approx(1 / 3)

    assert len(profile.games) == 3
    positions = [g.position for g in profile.games]
    assert positions.count(1) == 1


