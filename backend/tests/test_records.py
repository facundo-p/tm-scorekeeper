from datetime import date

from services.records_service import RecordsService
from schemas.records import RecordDTO

from models.game import Game
from models.player_result import PlayerResult, PlayerScore, PlayerEndStats
from models.enums import Corporation, MapName

import pytest

@pytest.fixture
def session_factory():
    from db.session import get_session
    return get_session


@pytest.fixture
def games_repo(session_factory):
    from repositories.game_repository import GamesRepository
    return GamesRepository(session_factory=session_factory)


@pytest.fixture
def players_repo(session_factory):
    from repositories.player_repository import PlayersRepository
    return PlayersRepository(session_factory=session_factory)


def make_player(player_id: str) -> PlayerResult:
    return PlayerResult(
        player_id=player_id,
        corporation=Corporation.CREDICOR,
        scores=PlayerScore(
            terraform_rating=0,
            milestone_points=0,
            milestones=[],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=0,
        ),
        end_stats=PlayerEndStats(mc_total=0),
    )


def make_game(game_id: str, players: list[PlayerResult]) -> Game:
    return Game(
        game_id=game_id,
        date=date(2026, 1, 1),
        map_name=MapName.HELLAS,
        expansions=[],
        draft=False,
        generations=1,
        player_results=players,
        awards=[],
    )


def persist_games(games: list[Game], repo, players_repo):
    seen: set[str] = set()
    for g in games:
        for pr in g.player_results:
            if pr.player_id not in seen:
                from models.player import Player
                try:
                    players_repo.create(Player(player_id=pr.player_id, name=pr.player_id, is_active=True))
                except ValueError:
                    pass
                seen.add(pr.player_id)
        repo.create(g)


def test_most_games_played(games_repo, players_repo):
    p1 = make_player("p1")
    p2 = make_player("p2")

    game1 = make_game("g1", [p1, p2])
    game2 = make_game("g2", [p1])
    game3 = make_game("g3", [p2])
    game4 = make_game("g4", [p1])

    persist_games([game1, game2, game3, game4], games_repo, players_repo)

    service = RecordsService(games_repo)
    record = service.most_games_played()

    assert record is not None
    assert isinstance(record, RecordDTO)
    assert record.type == "most_games_played"
    assert record.player_id == "p1"
    assert record.value == 3
    assert record.game_id is None


def test_most_games_won(games_repo, players_repo):
    game1 = make_game("g1", [make_player("p1"), make_player("p2")])
    game1.player_results[0].scores.terraform_rating = 30
    game1.player_results[1].scores.terraform_rating = 20

    game2 = make_game("g2", [make_player("p1"), make_player("p2")])
    game2.player_results[0].scores.terraform_rating = 25
    game2.player_results[1].scores.terraform_rating = 10

    game3 = make_game("g3", [make_player("p1"), make_player("p2")])
    game3.player_results[0].scores.terraform_rating = 15
    game3.player_results[1].scores.terraform_rating = 40

    game4 = make_game("g4", [make_player("p1"), make_player("p2")])
    game4.player_results[0].scores.terraform_rating = 50
    game4.player_results[1].scores.terraform_rating = 50
    game4.player_results[0].end_stats.mc_total = 10
    game4.player_results[1].end_stats.mc_total = 10

    persist_games([game1, game2, game3, game4], games_repo, players_repo)

    service = RecordsService(games_repo)
    record = service.most_games_won()

    assert record is not None
    assert isinstance(record, RecordDTO)
    assert record.type == "most_games_won"
    assert record.player_id == "p1"
    assert record.value == 3
    assert record.game_id is None


def test_highest_single_game_score(games_repo, players_repo):
    game1 = make_game("g1", [make_player("p1"), make_player("p2")])
    game1.player_results[0].scores.terraform_rating = 70
    game1.player_results[1].scores.terraform_rating = 60

    game2 = make_game("g2", [make_player("p1"), make_player("p2")])
    game2.player_results[0].scores.terraform_rating = 80
    game2.player_results[1].scores.terraform_rating = 95

    game3 = make_game("g3", [make_player("p1"), make_player("p2")])
    game3.player_results[0].scores.terraform_rating = 65
    game3.player_results[1].scores.terraform_rating = 50

    persist_games([game1, game2, game3], games_repo, players_repo)

    service = RecordsService(games_repo)
    record = service.highest_single_game_score()

    assert record is not None
    assert isinstance(record, RecordDTO)
    assert record.type == "highest_single_game_score"
    assert record.player_id == "p2"
    assert record.value == 95
    assert record.game_id == "g2"
