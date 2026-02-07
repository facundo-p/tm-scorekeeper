from tests.fakes import FakeGamesRepositoryForRecords, make_game, make_player
from services.records.service import RecordsService
from schemas.records import RecordDTO
from models.game import GameDTO
from models.player import PlayerDTO, ScoresDTO, EndStatsDTO





def test_most_games_played():
    # Arrange
    p1 = make_player("p1")
    p2 = make_player("p2")

    game1 = make_game("g1", [p1, p2])
    game2 = make_game("g2", [p1])
    game3 = make_game("g3", [p2])
    game4 = make_game("g4", [p1])

    games_repo = FakeGamesRepositoryForRecords([
    game1, game2, game3, game4
])

    service = RecordsService(games_repo)

    # Act
    record = service.most_games_played()

    # Assert
    assert record is not None
    assert isinstance(record, RecordDTO)
    assert record.type == "most_games_played"
    assert record.player_id == "p1"
    assert record.value == 3
    assert record.game_id is None


def test_most_games_won():
    game1 = make_game("g1", [
        make_player("p1"),
        make_player("p2")
    ])
    game1.players[0].scores.terraform_rating = 30
    game1.players[1].scores.terraform_rating = 20

    # Game 2: gana p1
    game2 = make_game("g2", [
        make_player("p1"),
        make_player("p2")
    ])
    game2.players[0].scores.terraform_rating = 25
    game2.players[1].scores.terraform_rating = 10

    # Game 3: gana p2
    game3 = make_game("g3", [
        make_player("p1"),
        make_player("p2")
    ])
    game3.players[0].scores.terraform_rating = 15
    game3.players[1].scores.terraform_rating = 40

    # Game 4: empate
    game4 = make_game("g4", [
        make_player("p1"),
        make_player("p2")
    ])
    game4.players[0].scores.terraform_rating = 50
    game4.players[1].scores.terraform_rating = 50
    game4.players[0].end_stats.mc_total = 10
    game4.players[1].end_stats.mc_total = 10

    games_repo = FakeGamesRepositoryForRecords([
        game1, game2, game3, game4
    ])

    service = RecordsService(games_repo)

    # Act
    record = service.most_games_won()

    # Assert
    assert record is not None
    assert isinstance(record, RecordDTO)
    assert record.type == "most_games_won"
    assert record.player_id == "p1"
    assert record.value == 3
    assert record.game_id is None

def test_highest_single_game_score():
    # Arrange

    # Game 1
    game1 = make_game("g1", [
        make_player("p1"),
        make_player("p2"),
    ])
    game1.players[0].scores.terraform_rating = 70
    game1.players[1].scores.terraform_rating = 60

    # Game 2 (récord)
    game2 = make_game("g2", [
        make_player("p1"),
        make_player("p2"),
    ])
    game2.players[0].scores.terraform_rating = 80
    game2.players[1].scores.terraform_rating = 95

    # Game 3
    game3 = make_game("g3", [
        make_player("p1"),
        make_player("p2"),
    ])
    game3.players[0].scores.terraform_rating = 65
    game3.players[1].scores.terraform_rating = 50

    games_repo = FakeGamesRepositoryForRecords([
        game1, game2, game3
    ])

    service = RecordsService(games_repo)

    # Act
    record = service.highest_single_game_score()

    # Assert
    assert record is not None
    assert isinstance(record, RecordDTO)
    assert record.type == "highest_single_game_score"
    assert record.player_id == "p2"
    assert record.value == 95
    assert record.game_id == "g2"