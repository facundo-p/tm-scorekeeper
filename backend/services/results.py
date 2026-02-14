from typing import List
from schemas.game import GameDTO
from schemas.result import GameResultDTO, PlayerResultDTO
# nota: usamos game_id como str en el DTO (contrato API)


def _compute_total_points_from_scores(scores) -> int:
    # scores: instance of ScoresDTO (models.player)
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

def calculate_results(game: GameDTO) -> GameResultDTO:
    """
    Calcula GameResultDTO a partir de GameDTO (no persiste nada).
    Reglas:
     - total_points = suma de campos de scores (MC no incluido)
     - ordenar por (total_points desc, mc_total desc)
     - desempate por mc_total
     - si empatan en ambos => tie real (mismo position, tied=True)
     - positions deben poder saltar (1,2,2,4)
    """
    # 1) calcular total_points y preparar lista intermedia
    players_intermediate = []
    for p in game.players:
        total = _compute_total_points_from_scores(p.scores)
        mc = p.end_stats.mc_total
        players_intermediate.append({
            "player_id": p.player_id,
            "total_points": total,
            "mc_total": mc,
        })
    
    # 2) ordenar por total_points desc, mc_total desc
    players_intermediate.sort(key=lambda x: ( -x["total_points"], -x["mc_total"] ))

    # 3) asignar posiciones y tied
    results: List[PlayerResultDTO] = []
    prev_total = None
    prev_mc = None
    prev_position = None

    for idx, item in enumerate(players_intermediate):
        if idx == 0:
            position = 1
            tied = False
        else:
            # si coincide total y mc con anterior => mismo position (tie)
            if item["total_points"] == prev_total and item["mc_total"] == prev_mc:
                position = prev_position
                tied = True
            # tied = True indica que el jugador comparte la posición con el jugador anterior (no abre una nueva posición).
            # El primer jugador de un grupo empatado tiene tied = False.
            else:
                position = idx + 1  # salta posiciones automáticamente si hubo empates
                tied = False

        prev_total = item["total_points"]
        prev_mc = item["mc_total"]
        prev_position = position

        p_result = PlayerResultDTO(
            player_id=item["player_id"],
            total_points=item["total_points"],
            mc_total=item["mc_total"],
            position=position,
            tied=tied
        )
        results.append(p_result)

        # 4) construir GameResultDTO
    gr = GameResultDTO(
        game_id=str(getattr(game, "id", "")),  # el repo debe proveer id; puede ser "" si no existe
        date=game.date,
        results=results
    )

    return gr

    
