"""Adaptadores entre las respuestas de la API y la forma de fixtures/golden.json."""


def positions_from_results(results_dto: dict) -> dict[str, dict]:
    """GET /games/{id}/results → {player_id: {position, total, mc, tied}} (tied desde F21, D-24)."""
    return {
        r["player_id"]: {"position": r["position"], "total": r["total_points"], "mc": r["mc_total"], "tied": r["tied"]}
        for r in results_dto["results"]
    }


def positions_from_golden(rows: list[dict]) -> dict[str, dict]:
    return {r["player_id"]: {"position": r["position"], "total": r["total"], "mc": r["mc"], "tied": r["tied"]} for r in rows}


def elo_from_changes(changes_dto: list[dict]) -> dict[str, dict]:
    """GET /games/{id}/elo → {player_id: {before, after, delta}}."""
    return {
        c["player_id"]: {"before": c["elo_before"], "after": c["elo_after"], "delta": c["delta"]}
        for c in changes_dto
    }


def elo_from_golden(rows: list[dict]) -> dict[str, dict]:
    return {r["player_id"]: {"before": r["before"], "after": r["after"], "delta": r["delta"]} for r in rows}
