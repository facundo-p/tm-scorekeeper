from datetime import date
from models.enums import Corporation
from services.results import calculate_results
from models import GameDTO, PlayerDTO, ScoresDTO, EndStatsDTO

def test_results_are_sorted_by_total_points():
    game = GameDTO(
        id="game-1",
        date=date(2026, 1, 26),
        map="Hellas",
        expansions=["Prelude"],
        draft=True,
        generations=10,
        players=[
            PlayerDTO(
                player_id="p1",
                corporation=Corporation.THARSIS_REPUBLIC,
                scores=ScoresDTO(
                    terraform_rating=35,
                    milestone_points=5,
                    milestones=["Mayor"],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=5),
            ),
            PlayerDTO(
                player_id="p2",
                corporation=Corporation.ECOLINE,
                scores=ScoresDTO(
                    terraform_rating=45,
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
            ),
        ],
        awards=[],
    )

    result = calculate_results(game)

    assert result.results[0].player_id == "p2"
    assert result.results[0].position == 1
    assert result.results[0].tied is False

    assert result.results[1].player_id == "p1"
    assert result.results[1].position == 2
    assert result.results[1].tied is False

def test_results_are_sorted_by_mc_when_points_tie():
    game = GameDTO(
        id="game-2",
        date=date(2026, 1, 26),
        map="Hellas",
        expansions=["Prelude"],
        draft=True,
        generations=10,
        players=[
            PlayerDTO(
                player_id="p1",
                corporation=Corporation.THARSIS_REPUBLIC,
                scores=ScoresDTO(
                    terraform_rating=35,
                    milestone_points=5,
                    milestones=["Mayor"],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=10),
            ),
            PlayerDTO(
                player_id="p2",
                corporation=Corporation.ECOLINE,
                scores=ScoresDTO(
                    terraform_rating=40,
                    milestone_points=0,
                    milestones=[],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=5),
            ),
        ],
        awards=[],
    )

    result = calculate_results(game)

    assert result.results[0].player_id == "p1"
    assert result.results[0].position == 1
    assert result.results[0].tied is False

    assert result.results[1].player_id == "p2"
    assert result.results[1].position == 2
    assert result.results[1].tied is False

def test_results_are_tied_when_points_and_mc_are_equal():
    game = GameDTO(
        id="game-3",
        date=date(2026, 1, 26),
        map="Hellas",
        expansions=["Prelude"],
        draft=True,
        generations=10,
        players=[
            PlayerDTO(
                player_id="p1",
                corporation=Corporation.THARSIS_REPUBLIC,
                scores=ScoresDTO(
                    terraform_rating=35,
                    milestone_points=5,
                    milestones=["Mayor"],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=10),
            ),
            PlayerDTO(
                player_id="p2",
                corporation=Corporation.ECOLINE,
                scores=ScoresDTO(
                    terraform_rating=35,
                    milestone_points=5,
                    milestones=["Planner"],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=10),
            ),
        ],
        awards=[],
    )

    result = calculate_results(game)

    assert result.results[0].player_id == "p1"
    assert result.results[0].position == 1
    assert result.results[0].tied is False

    assert result.results[1].player_id == "p2"
    assert result.results[1].position == 1
    assert result.results[1].tied is True

def test_positions_skip_after_ties():
    game = GameDTO(
        id="game-4",
        date=date(2026, 1, 26),
        map="Hellas",
        expansions=["Prelude"],
        draft=True,
        generations=10,
        players=[
            PlayerDTO(
                player_id="p1",
                corporation=Corporation.THARSIS_REPUBLIC,
                scores=ScoresDTO(
                    terraform_rating=50,
                    milestone_points=0,
                    milestones=[],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=5),
            ),
            PlayerDTO(
                player_id="p2",
                corporation=Corporation.ECOLINE,
                scores=ScoresDTO(
                    terraform_rating=40,
                    milestone_points=0,
                    milestones=[],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=10),
            ),
            PlayerDTO(
                player_id="p3",
                corporation=Corporation.CREDICOR,
                scores=ScoresDTO(
                    terraform_rating=40,
                    milestone_points=0,
                    milestones=[],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=10),
            ),
            PlayerDTO(
                player_id="p4",
                corporation=Corporation.HELION,
                scores=ScoresDTO(
                    terraform_rating=30,
                    milestone_points=0,
                    milestones=[],
                    award_points=0,
                    card_points=0,
                    card_resource_points=0,
                    greenery_points=0,
                    city_points=0,
                    turmoil_points=0,
                ),
                end_stats=EndStatsDTO(mc_total=7),
            ),
        ],
        awards=[],
    )

    result = calculate_results(game)

    assert result.results[0].player_id == "p1"
    assert result.results[0].position == 1
    assert result.results[0].tied is False

    assert result.results[1].player_id == "p2"
    assert result.results[1].position == 2
    assert result.results[1].tied is False

    assert result.results[2].player_id == "p3"
    assert result.results[2].position == 2
    assert result.results[2].tied is True

    assert result.results[3].player_id == "p4"
    assert result.results[3].position == 4
    assert result.results[3].tied is False
    # tied = True indica que el jugador comparte la posición con el jugador anterior (no abre una nueva posición).
    # El primer jugador de un grupo empatado tiene tied = False.
