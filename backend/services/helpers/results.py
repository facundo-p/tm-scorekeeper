from collections import Counter
from typing import List
from schemas.result import GameResultDTO, PlayerResultDTO
from models.game import Game


def _compute_total_points_from_scores(scores) -> int:
    turmoil = scores.turmoil_points if scores.turmoil_points is not None else 0
    return (
        scores.terraform_rating
        + scores.milestone_points
        + scores.award_points
        + scores.card_points
        + scores.card_resource_points
        + scores.greenery_points
        + scores.city_points
        + turmoil
    )

def _score_key(row: dict) -> tuple[int, int]:
    return row["total_points"], row["mc_total"]


def _ranked(game: Game) -> list[dict]:
    rows = [
        {"player_id": p.player_id, "total_points": _compute_total_points_from_scores(p.scores),
         "mc_total": p.end_stats.mc_total}
        for p in game.player_results
    ]
    rows.sort(key=lambda x: (-x["total_points"], -x["mc_total"]))
    return rows


def calculate_results(game: Game) -> GameResultDTO:
    """
    Posiciones de la partida (SEMANTICS §1):
     - total = suma de las categorías (sin M€); orden por (total desc, M€ desc)
     - mismo total y mismos M€ => empate: comparten posición y la siguiente se saltea (1, 1, 3)
     - tied = True para TODOS los miembros de un grupo empatado (D-17), incluido el primero
    """
    rows = _ranked(game)
    group_size = Counter(_score_key(r) for r in rows)
    results: List[PlayerResultDTO] = []
    for idx, r in enumerate(rows):
        same_as_prev = idx > 0 and _score_key(rows[idx - 1]) == _score_key(r)
        position = results[-1].position if same_as_prev else idx + 1
        results.append(PlayerResultDTO(**r, position=position, tied=group_size[_score_key(r)] > 1))
    return GameResultDTO(game_id=str(getattr(game, "id", "")), date=game.date, results=results)


def winners(result: GameResultDTO) -> list[str]:
    """Ganadores (D-07): todos los que quedaron en la posición 1; los co-ganadores cuentan todos."""
    return [r.player_id for r in result.results if r.position == 1]


def is_winner(result: GameResultDTO, player_id: str) -> bool:
    return player_id in winners(result)
