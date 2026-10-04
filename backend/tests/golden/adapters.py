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


def _holder(h: dict, scope: str) -> dict:
    keys = ("player_id", "game_id", "date", "map") if scope == "game" else ("player_id",)
    return {k: h[k] for k in keys}


def _history(entries: list[dict]) -> list[dict]:
    keys = ("value", "player_id", "holders", "game_id", "date", "kind")
    return [{k: e[k] for k in keys} for e in entries]


def record_shape(r: dict) -> dict:
    """Ítem de GET /records o del golden → forma común; en carrera los poseedores no tienen orden propio."""
    holders = [_holder(h, r["scope"]) for h in r["holders"]]
    if r["scope"] == "career":
        holders = sorted(holders, key=lambda h: h["player_id"])
    return {"code": r["code"], "scope": r["scope"], "lower_is_better": r["lower_is_better"],
            "value": r["value"], "holders": holders, "history": _history(r["history"])}


def elo_from_replay(changes: list) -> dict[str, dict]:
    """EloChange del servicio de reproducción → {player_id: {before, after, delta}}."""
    return {c.player_id: {"before": c.elo_before, "after": c.elo_after, "delta": c.delta} for c in changes}
