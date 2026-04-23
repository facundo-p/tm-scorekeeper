from models.elo_change import EloChange
from models.game import Game
from services.helpers.results import calculate_results


K_FACTOR = 32
DEFAULT_ELO = 1000


def _expected_score(rating_a: int, rating_b: int) -> float:
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400))


def _actual_score(position_a: int, position_b: int) -> float:
    if position_a < position_b:
        return 1.0
    if position_a > position_b:
        return 0.0
    return 0.5


def calculate_elo_changes(
    game: Game,
    current_elo_by_player: dict[str, int],
) -> list[EloChange]:
    """
    Calcula los cambios de ELO para todos los jugadores de una partida usando
    comparaciones por pares (cada jugador se enfrenta a todos los demás).

    Args:
        game: la partida ya rankeada (se usa calculate_results para las posiciones).
        current_elo_by_player: mapa player_id -> ELO actual antes de la partida.

    Returns:
        Lista de EloChange con elo_before, elo_after y delta por jugador.
    """
    results = calculate_results(game).results
    positions = {r.player_id: r.position for r in results}
    player_ids = [r.player_id for r in results]

    changes: list[EloChange] = []
    for player_id in player_ids:
        elo_before = current_elo_by_player[player_id]
        delta_sum = 0.0

        for opponent_id in player_ids:
            if opponent_id == player_id:
                continue

            opponent_elo = current_elo_by_player[opponent_id]
            expected = _expected_score(elo_before, opponent_elo)
            actual = _actual_score(positions[player_id], positions[opponent_id])
            delta_sum += (actual - expected)

        delta = round(K_FACTOR * delta_sum)
        changes.append(
            EloChange(
                player_id=player_id,
                elo_before=elo_before,
                elo_after=elo_before + delta,
                delta=delta,
            )
        )

    return changes
