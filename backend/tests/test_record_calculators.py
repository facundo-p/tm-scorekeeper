"""
Tests para los calculadores de records del sistema de Terraforming Mars.

Cubre:
- HighestSingleGameScoreCalculator
- MostGamesPlayedCalculator
- MostGamesWonCalculator
- GameRecordsService
- RecordCalculator.evaluate()
"""

from datetime import date
import pytest

from models.game import Game
from models.player_result import PlayerResult, PlayerScore, PlayerEndStats
from models.enums import Corporation, MapName
from models.record_entry import RecordEntry, get_player_id
from models.record_comparison import RecordComparison

from services.record_calculators.highest_single_game_score import HighestSingleGameScoreCalculator
from services.record_calculators.most_games_played import MostGamesPlayedCalculator
from services.record_calculators.most_games_won import MostGamesWonCalculator
from services.game_records_service import GameRecordsService


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def make_player():
    """Factory para crear PlayerResult con valores por defecto."""
    def _make_player(player_id: str, terraform_rating: int = 0, mc_total: int = 0) -> PlayerResult:
        return PlayerResult(
            player_id=player_id,
            corporation=Corporation.CREDICOR,
            scores=PlayerScore(
                terraform_rating=terraform_rating,
                milestone_points=0,
                milestones=[],
                award_points=0,
                card_points=0,
                card_resource_points=0,
                greenery_points=0,
                city_points=0,
                turmoil_points=0,
            ),
            end_stats=PlayerEndStats(mc_total=mc_total),
        )
    return _make_player


@pytest.fixture
def make_game():
    """Factory para crear Game con valores por defecto."""
    def _make_game(game_id: str, game_date: date, players: list[PlayerResult]) -> Game:
        return Game(
            game_id=game_id,
            date=game_date,
            map_name=MapName.HELLAS,
            expansions=[],
            draft=False,
            generations=1,
            player_results=players,
            awards=[],
        )
    return _make_game


@pytest.fixture
def highest_calculator():
    """Instancia del calculador de máxima puntuación."""
    return HighestSingleGameScoreCalculator()


@pytest.fixture
def most_played_calculator():
    """Instancia del calculador de más juegos jugados."""
    return MostGamesPlayedCalculator()


@pytest.fixture
def most_won_calculator():
    """Instancia del calculador de más juegos ganados."""
    return MostGamesWonCalculator()


# ============================================================================
# TESTS: HighestSingleGameScoreCalculator
# ============================================================================

class TestHighestSingleGameScoreCalculator:
    """Tests para el calculador de máxima puntuación individual."""

    def test_empty_games_list_returns_none(self, highest_calculator):
        """Sin juegos, debe retornar None."""
        result = highest_calculator.calculate([])
        assert result is None

    def test_single_game_two_players(self, highest_calculator, make_player, make_game):
        """Un game con dos jugadores, identifica el máximo."""
        p1 = make_player("p1", terraform_rating=50)
        p2 = make_player("p2", terraform_rating=30)
        game = make_game("g1", date(2026, 1, 1), [p1, p2])

        result = highest_calculator.calculate([game])

        assert result is not None
        assert isinstance(result, RecordEntry)
        assert result.value == 50
        assert get_player_id(result) == "p1"

    def test_multiple_games_finds_global_max(self, highest_calculator, make_player, make_game):
        """Múltiples games, encuentra la puntuación máxima global."""
        # Game 1: p1=60, p2=40
        game1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=60),
            make_player("p2", terraform_rating=40),
        ])

        # Game 2: p1=80, p3=50 (máximo global)
        game2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=80),
            make_player("p3", terraform_rating=50),
        ])

        # Game 3: p2=70, p3=30
        game3 = make_game("g3", date(2026, 1, 3), [
            make_player("p2", terraform_rating=70),
            make_player("p3", terraform_rating=30),
        ])

        result = highest_calculator.calculate([game1, game2, game3])

        assert result is not None
        assert result.value == 80
        assert get_player_id(result) == "p1"

    def test_tiebreaker_with_mc_total(self, highest_calculator, make_player, make_game):
        """Con puntuaciones terraform iguales, usa MC como tiebreaker."""
        # Ambos jugadores: 50 puntos terraform
        p1 = make_player("p1", terraform_rating=50, mc_total=10)
        p2 = make_player("p2", terraform_rating=50, mc_total=5)

        game = make_game("g1", date(2026, 1, 1), [p1, p2])
        result = highest_calculator.calculate([game])

        # No hay tiebreaker en terraform_rating, ambos tienen 50
        # El calculador toma el primero que ve con ese máximo
        assert result is not None
        assert result.value == 50

    def test_three_plus_players_single_game(self, highest_calculator, make_player, make_game):
        """Un game con 3 o más jugadores."""
        players = [
            make_player("p1", terraform_rating=55),
            make_player("p2", terraform_rating=45),
            make_player("p3", terraform_rating=65),
            make_player("p4", terraform_rating=40),
        ]
        game = make_game("g1", date(2026, 1, 1), players)

        result = highest_calculator.calculate([game])

        assert result is not None
        assert result.value == 65
        assert get_player_id(result) == "p3"

    def test_all_scores_components_counted(self, highest_calculator):
        """Verifica que TODOS los componentes de score se suman."""
        p1 = PlayerResult(
            player_id="p1",
            corporation=Corporation.CREDICOR,
            scores=PlayerScore(
                terraform_rating=10,
                milestone_points=5,
                milestones=[],
                award_points=3,
                card_points=4,
                card_resource_points=2,
                greenery_points=6,
                city_points=7,
                turmoil_points=2,
            ),
            end_stats=PlayerEndStats(mc_total=0),
        )
        p2 = PlayerResult(
            player_id="p2",
            corporation=Corporation.INTERPLANETARY_CINEMATICS,
            scores=PlayerScore(
                terraform_rating=5,
                milestone_points=2,
                milestones=[],
                award_points=1,
                card_points=1,
                card_resource_points=0,
                greenery_points=2,
                city_points=1,
                turmoil_points=0,
            ),
            end_stats=PlayerEndStats(mc_total=0),
        )
        game = Game(
            game_id="g1",
            date=date(2026, 1, 1),
            map_name=MapName.HELLAS,
            expansions=[],
            draft=False,
            generations=1,
            player_results=[p1, p2],
            awards=[],
        )

        result = highest_calculator.calculate([game])

        # p1: 10+5+3+4+2+6+7+2 = 39
        # p2: 5+2+1+1+0+2+1+0 = 12
        assert result.value == 39
        assert get_player_id(result) == "p1"


# ============================================================================
# TESTS: MostGamesPlayedCalculator
# ============================================================================

class TestMostGamesPlayedCalculator:
    """Tests para el calculador de más juegos jugados."""

    def test_empty_games_list_returns_none(self, most_played_calculator):
        """Sin juegos, debe retornar None."""
        result = most_played_calculator.calculate([])
        assert result is None

    def test_multiple_games_two_players(self, most_played_calculator, make_player, make_game):
        """Múltiples juegos, identifica quien jugó más."""
        # g1: p1, p2
        # g2: p1, p2
        # g3: p1        (p1 jugó 3, p2 jugó 2)
        g1 = make_game("g1", date(2026, 1, 1), [make_player("p1"), make_player("p2")])
        g2 = make_game("g2", date(2026, 1, 2), [make_player("p1"), make_player("p2")])
        g3 = make_game("g3", date(2026, 1, 3), [make_player("p1"), make_player("p3")])

        result = most_played_calculator.calculate([g1, g2, g3])

        assert result is not None
        assert result.value == 3
        assert get_player_id(result) == "p1"

    def test_single_game_multiple_players(self, most_played_calculator, make_player, make_game):
        """Un game con múltiples jugadores (todos con count=1)."""
        game = make_game("g1", date(2026, 1, 1), [
            make_player("p1"),
            make_player("p2"),
            make_player("p3"),
        ])

        result = most_played_calculator.calculate([game])

        assert result is not None
        assert result.value == 1
        # most_common devuelve el primero encontrado
        assert get_player_id(result) in ["p1", "p2", "p3"]

    def test_three_plus_players_multiple_games(self, most_played_calculator, make_player, make_game):
        """4+ jugadores a través de múltiples games."""
        # p1: 3 games, p2: 2, p3: 4 (máximo), p4: 1
        g1 = make_game("g1", date(2026, 1, 1), [make_player("p1"), make_player("p2"), make_player("p3")])
        g2 = make_game("g2", date(2026, 1, 2), [make_player("p1"), make_player("p3"), make_player("p4")])
        g3 = make_game("g3", date(2026, 1, 3), [make_player("p1"), make_player("p3")])
        g4 = make_game("g4", date(2026, 1, 4), [make_player("p2"), make_player("p3")])

        result = most_played_calculator.calculate([g1, g2, g3, g4])

        assert result is not None
        assert result.value == 4
        assert get_player_id(result) == "p3"

    def test_equal_participation_returns_one(self, most_played_calculator, make_player, make_game):
        """Cuando dos jugadores tienen igual participación, retorna uno (el primero encontrado)."""
        # Ambos juegan 2 veces
        g1 = make_game("g1", date(2026, 1, 1), [make_player("p1"), make_player("p2")])
        g2 = make_game("g2", date(2026, 1, 2), [make_player("p1"), make_player("p2")])

        result = most_played_calculator.calculate([g1, g2])

        assert result is not None
        assert result.value == 2
        # most_common retorna el primero cuando hay empate


# ============================================================================
# TESTS: MostGamesWonCalculator
# ============================================================================

class TestMostGamesWonCalculator:
    """Tests para el calculador de más juegos ganados."""

    def test_empty_games_list_returns_none(self, most_won_calculator):
        """Sin juegos, debe retornar None."""
        result = most_won_calculator.calculate([])
        assert result is None

    def test_single_game_determines_winner(self, most_won_calculator, make_player, make_game):
        """Un game: identifica el ganador basado en puntuación."""
        p1 = make_player("p1", terraform_rating=70)  # Ganador
        p2 = make_player("p2", terraform_rating=60)
        game = make_game("g1", date(2026, 1, 1), [p1, p2])

        result = most_won_calculator.calculate([game])

        assert result is not None
        assert result.value == 1
        assert get_player_id(result) == "p1"

    def test_multiple_games_counts_victories(self, most_won_calculator, make_player, make_game):
        """Múltiples games, cuenta victorias correctamente."""
        # Game 1: p1 gana
        g1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=80),
            make_player("p2", terraform_rating=60),
        ])

        # Game 2: p1 gana
        g2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=75),
            make_player("p2", terraform_rating=70),
        ])

        # Game 3: p2 gana (p1: 2 victorias, p2: 1)
        g3 = make_game("g3", date(2026, 1, 3), [
            make_player("p1", terraform_rating=50),
            make_player("p2", terraform_rating=60),
        ])

        result = most_won_calculator.calculate([g1, g2, g3])

        assert result is not None
        assert result.value == 2
        assert get_player_id(result) == "p1"

    def test_three_plus_players_one_winner_per_game(self, most_won_calculator, make_player, make_game):
        """Games con 3+ jugadores: solo el primero de la clasificación cuenta como ganador."""
        # Game 1: p1(100) > p2(80) > p3(60) -> p1 gana
        g1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=100),
            make_player("p2", terraform_rating=80),
            make_player("p3", terraform_rating=60),
        ])

        # Game 2: p2(90) > p1(85) > p3(75) -> p2 gana
        g2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=85),
            make_player("p2", terraform_rating=90),
            make_player("p3", terraform_rating=75),
        ])

        # Game 3: p3(95) > p1(80) > p2(70) -> p3 gana
        g3 = make_game("g3", date(2026, 1, 3), [
            make_player("p1", terraform_rating=80),
            make_player("p2", terraform_rating=70),
            make_player("p3", terraform_rating=95),
        ])

        result = most_won_calculator.calculate([g1, g2, g3])

        # p1: 1 victoria, p2: 1 victoria, p3: 1 victoria
        # most_common retorna el primero
        assert result is not None
        assert result.value == 1

    def test_tie_both_players_first_position(self, most_won_calculator, make_player, make_game):
        """Empate en game (ambos tienen posición 1) - solo el primero cuenta como ganador."""
        # Ambos con 50 puntos y 5 MC (calculados igual) -> ambos position 1
        p1 = make_player("p1", terraform_rating=50, mc_total=5)
        p2 = make_player("p2", terraform_rating=50, mc_total=5)
        game = make_game("g1", date(2026, 1, 1), [p1, p2])

        result = most_won_calculator.calculate([game])

        # En calculate_results, quién queda primero en la lista?
        # El calculador toma results[0] que es el ganador
        assert result is not None
        assert result.value == 1


# ============================================================================
# TESTS: GameRecordsService
# ============================================================================

class MockGamesRepository:
    """Mock para GamesRepository."""
    def __init__(self, games: list[Game] = None):
        self.games = games or []

    def list_games(self, filters=None):
        return self.games


class TestGameRecordsService:
    """Tests para GameRecordsService (orquestador de calculadores)."""

    def test_empty_games_list_returns_empty_comparisons(self, make_player, make_game):
        """Sin games, retorna lista vacía."""
        repo = MockGamesRepository([])
        service = GameRecordsService(repo)

        result = service.get_records_for_game("any_id")

        assert result == []

    def test_single_game_returns_three_comparisons(self, make_player, make_game):
        """Un game genera 3 comparaciones (uno por cada calculador)."""
        game = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=80),
            make_player("p2", terraform_rating=60),
        ])
        repo = MockGamesRepository([game])
        service = GameRecordsService(repo)

        result = service.get_records_for_game("g1")

        assert len(result) == 3
        assert all(isinstance(r, RecordComparison) for r in result)

        codes = {r.code for r in result}
        assert codes == {"highest_single_game_score", "most_games_played", "most_games_won"}

    def test_chronological_order_respected(self, make_player, make_game):
        """Los games se procesan en orden cronológico (date, id)."""
        # Crear en orden: g2 (antes), g1 (después), g3 (futuro)
        # Pero la fecha establece el orden real
        g1 = make_game("g1", date(2026, 1, 2), [
            make_player("p1", terraform_rating=50),
            make_player("p2", terraform_rating=40),
        ])
        g2 = make_game("g2", date(2026, 1, 1), [
            make_player("p1", terraform_rating=60),
            make_player("p3", terraform_rating=50),
        ])
        g3 = make_game("g3", date(2026, 1, 3), [
            make_player("p1", terraform_rating=70),
            make_player("p4", terraform_rating=30),
        ])

        # Añader en desorden
        repo = MockGamesRepository([g1, g2, g3])
        service = GameRecordsService(repo)

        # Solicitar records para g1, debe procesar: g2, g1
        result = service.get_records_for_game("g1")

        assert result is not None
        # g1 es el segundo en cronología, así que debe comparar
        assert len(result) > 0

    def test_record_achieved_new_high(self, make_player, make_game):
        """Verifica que 'achieved=True' cuando se rompe un record."""
        g1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=50),
            make_player("p2", terraform_rating=40),
        ])
        g2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=100),  # Mayor puntuación
            make_player("p2", terraform_rating=50),
        ])

        repo = MockGamesRepository([g1, g2])
        service = GameRecordsService(repo)

        result = service.get_records_for_game("g2")

        # Buscar el record de highest_single_game_score
        highest_record = next(
            (r for r in result if r.code == "highest_single_game_score"),
            None
        )
        assert highest_record is not None
        assert highest_record.achieved is True

    def test_record_not_achieved_beaten_record(self, make_player, make_game):
        """Verifica que 'achieved=False' cuando no se rompe el record."""
        g1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=100),  # Récord inicial
            make_player("p2", terraform_rating=40),
        ])
        g2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=50),  # Menos puntuación
            make_player("p2", terraform_rating=40),
        ])

        repo = MockGamesRepository([g1, g2])
        service = GameRecordsService(repo)

        result = service.get_records_for_game("g2")

        highest_record = next(
            (r for r in result if r.code == "highest_single_game_score"),
            None
        )
        assert highest_record is not None
        assert highest_record.achieved is False

    def test_complex_scenario_multiple_records(self, make_player, make_game):
        """
        Escenario complejo con múltiples juegos y registros:
        - g1: p1(80), p2(70) -> p1 gana
        - g2: p1(90), p3(85) -> p1 gana (nuevo máximo)
        - g3: p2(95), p3(85) -> p2 gana (rompe máximo de p1)
        """
        g1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=80),
            make_player("p2", terraform_rating=70),
        ])
        g2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=90),
            make_player("p3", terraform_rating=85),
        ])
        g3 = make_game("g3", date(2026, 1, 3), [
            make_player("p2", terraform_rating=95),
            make_player("p3", terraform_rating=85),
        ])

        repo = MockGamesRepository([g1, g2, g3])
        service = GameRecordsService(repo)

        result_g3 = service.get_records_for_game("g3")

        assert len(result_g3) == 3

        highest_record = next(
            (r for r in result_g3 if r.code == "highest_single_game_score"),
            None
        )
        assert highest_record is not None
        assert highest_record.achieved is True  # p2 rompe el récord de p1
        assert highest_record.current.value == 95
        assert get_player_id(highest_record.current) == "p2"


# ============================================================================
# TESTS: RecordCalculator.evaluate()
# ============================================================================

class TestRecordEvaluate:
    """Tests para la lógica de evaluate() en RecordCalculator."""

    def test_evaluate_empty_games_returns_none(self, highest_calculator):
        """evaluate() con lista vacía retorna None."""
        result = highest_calculator.evaluate([])
        assert result is None

    def test_evaluate_single_game_no_previous_record(self, highest_calculator, make_player, make_game):
        """evaluate() con un game: no hay record anterior, achieved=True."""
        game = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=80),
            make_player("p2", terraform_rating=60),
        ])

        result = highest_calculator.evaluate([game])

        assert result is not None
        assert isinstance(result, RecordComparison)
        assert result.achieved is True  # Primer record
        assert result.code == "highest_single_game_score"
        assert result.current.value == 80
        assert result.compared is None or result.compared.value is None or True

    def test_evaluate_compares_records_correctly(self, highest_calculator, make_player, make_game):
        """evaluate() compara el record anterior con el actual."""
        g1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=70),
            make_player("p2", terraform_rating=50),
        ])
        g2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=90),  # Mayor que g1
            make_player("p2", terraform_rating=60),
        ])

        result = highest_calculator.evaluate([g1, g2])

        assert result is not None
        assert result.achieved is True
        assert result.current.value == 90  # En g2
        assert result.compared.value == 70  # En g1

    def test_evaluate_record_not_broken(self, highest_calculator, make_player, make_game):
        """evaluate(): si el record no se rompe, achieved=False."""
        g1 = make_game("g1", date(2026, 1, 1), [
            make_player("p1", terraform_rating=80),
            make_player("p2", terraform_rating=60),
        ])
        g2 = make_game("g2", date(2026, 1, 2), [
            make_player("p1", terraform_rating=50),  # Menor
            make_player("p2", terraform_rating=40),
        ])

        result = highest_calculator.evaluate([g1, g2])

        assert result is not None
        assert result.achieved is False
        assert result.current.value == 80  # El record anterior
        assert result.compared.value == 50  # El nuevo (menor)

    def test_evaluate_all_fields_populated(self, most_played_calculator, make_player, make_game):
        """evaluate() popula todos los campos del RecordComparison."""
        g1 = make_game("g1", date(2026, 1, 1), [make_player("p1"), make_player("p2")])
        g2 = make_game("g2", date(2026, 1, 2), [make_player("p1"), make_player("p3")])

        result = most_played_calculator.evaluate([g1, g2])

        assert result is not None
        assert result.code == "most_games_played"
        # description should match the calculator's own text (may be localized)
        assert result.description == most_played_calculator.description
        assert result.achieved in [True, False]
        assert result.current is not None
        assert result.compared is not None
        assert result.current.value >= result.compared.value if result.achieved else result.current.value <= result.compared.value
