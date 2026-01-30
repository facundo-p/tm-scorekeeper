from datetime import date
from models import GameDTO, PlayerDTO, ScoresDTO, EndStatsDTO
from schemas.player_profile import PlayerStatsDTO
from services.player_profile.service import PlayerProfileService
from tests.fakes import FakePlayersRepository, FakeGamesRepository





def test_player_with_no_games_has_zero_stats():
    # Arrange: jugador sin partidas
    player = PlayerDTO(
    player_id="p1",
    corporation="TestCorp",
    scores=ScoresDTO(
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
    end_stats=EndStatsDTO(
        mc_total=0
    ),
)

    players_repo = FakePlayersRepository({
        "p1": player
    })

    games_repo = FakeGamesRepository({
        # p1 no tiene partidas
    })

    service = PlayerProfileService(players_repo, games_repo)

    # Act: pedir el perfil
    profile = service.get_profile("p1")

    # Assert: stats en cero
    assert profile.player_id == "p1"
    assert profile.stats.games_played == 0
    assert profile.stats.games_won == 0
    assert profile.stats.win_rate == 0.0
    assert profile.games == []


def test_player_with_one_winning_game_has_100_percent_win_rate():
    # Arrange: jugador
    player = PlayerDTO(
        player_id="p1",
        corporation="Tharsis",
        scores=ScoresDTO(
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
        end_stats=EndStatsDTO(
            mc_total=10
        ),
    )

    # Arrange: partida donde p1 gana
    game = GameDTO(
        id="game-1",
        date=date(2026, 1, 26),
        map="Hellas",
        expansions=["Prelude"],
        draft=True,
        generations=10,
        players=[
            player,
            PlayerDTO(
                player_id="p2",
                corporation="Ecoline",
                scores=ScoresDTO(
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
                end_stats=EndStatsDTO(
                    mc_total=5
                ),
            ),
        ],
        awards=[],
    )

    players_repo = FakePlayersRepository({
        "p1": player
    })

    games_repo = FakeGamesRepository({
        "p1": [game]
    })

    service = PlayerProfileService(players_repo, games_repo)

    # Act
    profile = service.get_profile("p1")

    # Assert: stats
    assert profile.stats.games_played == 1
    assert profile.stats.games_won == 1
    assert profile.stats.win_rate == 1.0

    # Assert: historial
    assert len(profile.games) == 1
    summary = profile.games[0]
    assert summary.game_id == "game-1"
    assert summary.position == 1


import pytest
from datetime import date

from models import GameDTO, PlayerDTO, ScoresDTO, EndStatsDTO
from services.player_profile.service import PlayerProfileService
from tests.fakes import FakePlayersRepository, FakeGamesRepository

def test_player_with_multiple_games_and_one_win_has_correct_win_rate():
    # Arrange: jugador base (usado como referencia en players_repo)
    player = PlayerDTO(
        player_id="p1",
        corporation="Tharsis",
        scores=ScoresDTO(
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
        end_stats=EndStatsDTO(mc_total=10),
    )

    # --- GAME 1: p1 GANA (p1 tiene más puntos que el oponente) ---
    opponent_g1 = PlayerDTO(
        player_id="p2",
        corporation="Ecoline",
        scores=ScoresDTO(
            terraform_rating=30,  # menos que p1
            milestone_points=0,
            milestones=[],
            award_points=5,
            card_points=4,
            card_resource_points=1,
            greenery_points=5,
            city_points=2,
            turmoil_points=0,
        ),
        end_stats=EndStatsDTO(mc_total=5),
    )

    game1 = GameDTO(
        id="game-1",
        date=date(2026, 1, 1),
        map="Hellas",
        expansions=[],
        draft=False,
        generations=10,
        players=[player, opponent_g1],
        awards=[],
    )

    # --- GAME 2: p1 PIERDE (p1 tiene menos puntos que el oponente) ---
    # creamos nuevas instancias con puntajes que reflejen la derrota
    losing_p1_game2 = PlayerDTO(
        player_id="p1",
        corporation="Tharsis",
        scores=ScoresDTO(
            terraform_rating=20,  # menos que el oponente en este game
            milestone_points=0,
            milestones=[],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=0,
        ),
        end_stats=EndStatsDTO(mc_total=3),
    )

    winning_opponent_game2 = PlayerDTO(
        player_id="p2",
        corporation="Ecoline",
        scores=ScoresDTO(
            terraform_rating=40,  # mayor, por eso gana
            milestone_points=5,
            milestones=["Planner"],
            award_points=8,
            card_points=6,
            card_resource_points=2,
            greenery_points=7,
            city_points=3,
            turmoil_points=0,
        ),
        end_stats=EndStatsDTO(mc_total=12),
    )

    game2 = GameDTO(
        id="game-2",
        date=date(2026, 1, 5),
        map="Hellas",
        expansions=[],
        draft=False,
        generations=10,
        players=[winning_opponent_game2, losing_p1_game2],
        awards=[],
    )

    # --- GAME 3: p1 PIERDE (tercer jugador supera a p1) ---
    third_player = PlayerDTO(
        player_id="p3",
        corporation="Credicor",
        scores=ScoresDTO(
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
        end_stats=EndStatsDTO(mc_total=15),
    )

    losing_p1_game3 = PlayerDTO(
        player_id="p1",
        corporation="Tharsis",
        scores=ScoresDTO(
            terraform_rating=25,  # menos que third_player
            milestone_points=0,
            milestones=[],
            award_points=0,
            card_points=0,
            card_resource_points=0,
            greenery_points=0,
            city_points=0,
            turmoil_points=0,
        ),
        end_stats=EndStatsDTO(mc_total=4),
    )

    game3 = GameDTO(
        id="game-3",
        date=date(2026, 1, 10),
        map="Hellas",
        expansions=[],
        draft=False,
        generations=10,
        players=[third_player, opponent_g1, losing_p1_game3],
        awards=[],
    )

    # Fake repos: players_repo devuelve el "player" principal; games_repo devuelve las 3 partidas
    players_repo = FakePlayersRepository({
        "p1": player
    })

    games_repo = FakeGamesRepository({
        "p1": [game1, game2, game3]
    })

    service = PlayerProfileService(players_repo, games_repo)

    # Act
    profile = service.get_profile("p1")

    # Assert: stats
    assert profile.stats.games_played == 3
    assert profile.stats.games_won == 1
    assert profile.stats.win_rate == pytest.approx(1 / 3)

    # Assert: historial
    assert len(profile.games) == 3
    # además podemos asegurarnos de que exactamente una de las entradas tenga position == 1
    positions = [g.position for g in profile.games]
    assert positions.count(1) == 1


