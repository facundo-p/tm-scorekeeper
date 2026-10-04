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


def achievements_from_api(body: dict) -> dict[str, dict]:
    """GET /players/{id}/achievements → {code: {tier, value, unlocked, progress}} del golden."""
    return {
        a["code"]: {"tier": a["tier"], "value": a["value"], "unlocked": a["unlocks"], "progress": a["progress"]}
        for a in body["achievements"]
    }


def summary_from_api(s: dict) -> dict:
    """GET /games/summaries → forma del golden."""
    return {
        "id": s["id"], "date": s["date"], "map": s["map"], "player_count": s["player_count"],
        "generations": s["generations"], "winners": s["winners"], "margin": s["margin"],
        "decided_by_mc": s["decided_by_mc"],
        "scores": [{"player_id": r["player_id"], "position": r["position"], "total": r["total_points"],
                    "corporation": r["corporation"]} for r in s["scores"]],
    }


def report_from_api(r: dict) -> dict:
    """GET /games/{id}/report → forma del golden (logros: el nivel más alto por jugador y logro)."""
    unlocks = sorted(({"player_id": pid, "code": a["code"], "level": a["tier"]}
                      for pid, items in r["achievements_by_player"].items() for a in items),
                     key=lambda a: a["player_id"] + a["code"])
    return {
        "winners": r["winners"], "margin": r["margin"], "decided_by_mc": r["decided_by_mc"],
        "records_broken": [{k: b[k] for k in ("code", "value", "player_id", "holders", "previous")}
                           for b in r["records_broken"]],
        "records_tied": [{k: t[k] for k in ("code", "value", "holders")} for t in r["records_tied"]],
        "near": [{k: n[k] for k in ("code", "gap", "value", "player_id", "before")} for n in r["near"]],
        "achievements": unlocks,
        "stolen_awards": r["stolen_awards"],
    }


# Campos de GET /players/{id}/insights cuyo nombre en el golden (mockup) está en camelCase.
_INSIGHT_KEYS = {
    "win_rate": "winRate", "podium_rate": "podiumRate", "avg_points": "avgPoints", "avg_pos": "avgPos",
    "best_game": "bestGame", "avg_milestones": "avgMilestones", "avg_awards": "avgAwards",
    "points_per_gen": "pointsPerGen", "records_held": "recordsHeld", "rank_total": "rankTotal",
    "wins_vs_expected": "winsVsExpected", "wins_ratio": "winsRatio", "rel_pos": "relPos",
    "by_table": "byTable", "last_delta": "lastDelta",
}


def insights_from_api(value):
    """Renombra los campos conocidos (no las claves de datos, como las categorías)."""
    if isinstance(value, dict):
        return {_INSIGHT_KEYS.get(k, k): insights_from_api(v) for k, v in value.items() if k != "view"}
    if isinstance(value, list):
        return [insights_from_api(v) for v in value]
    return value


_SUMMARY_KEYS = {"avg_winner": "avgWinner", "avg_generations": "avgGenerations", "top_corp": "topCorp",
                 "corps_used": "corpsUsed", "top_map": "topMap", "avg_pos": "avgPos"}


def summary_stats_from_api(value):
    """GET /stats/summary → `summary` del golden."""
    if isinstance(value, dict):
        return {_SUMMARY_KEYS.get(k, k): summary_stats_from_api(v) for k, v in value.items() if k != "view"}
    if isinstance(value, list):
        return [summary_stats_from_api(v) for v in value]
    return value


def ranking_row_from_api(row: dict) -> dict:
    """Fila de GET /ranking → los campos equivalentes de `players` del golden."""
    return insights_from_api({k: row[k] for k in ("rank", "elo", "peak", "last_delta", "games", "wins", "win_rate",
                                                  "equity", "form")})


def season_from_api(s: dict) -> dict:
    """Temporada de la API → forma del golden (sin `end` mientras está abierta)."""
    renamed = {"oxygen_pct": "oxygenPct", "ocean_count": "oceanCount"}
    return {renamed.get(k, k): v for k, v in s.items() if not (k == "end" and v is None)}


def feed_groups(items: list[dict]) -> list[list[str]]:
    """La bitácora por (fecha, tipo), sin el orden dentro de cada grupo (D-68)."""
    import json
    from itertools import groupby

    clean = [{k: v for k, v in i.items() if v is not None} for i in items]
    return [sorted(json.dumps(x, sort_keys=True) for x in grp)
            for _, grp in groupby(clean, key=lambda i: (i["date"], i["type"]))]
