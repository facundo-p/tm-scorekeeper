"""Bitácora del grupo (F25, STAT-12, SEMANTICS §11): partidas, récords rotos, logros desde el
nivel 2 (o únicos) y temporadas completas, de la más nueva a la más vieja."""
from services.records.definitions import RECORD_BY_CODE
from services.records.tracker import game_best, track_game_records
from services.stats.context import GameStats, StatsContext

TYPE_ORDER = {"season": 0, "record": 1, "achievement": 2, "game": 3}


def js_number(value) -> str:
    """Como JavaScript: 10.0 → «10», 10.3 → «10.3»."""
    return str(int(value)) if isinstance(value, float) and value.is_integer() else str(value)


def _names(ids, names: dict) -> str:
    return " y ".join(names.get(i, i) for i in ids)


def _game_item(gs: GameStats, names: dict) -> dict:
    winner = gs.results[0].player_id
    how = "por desempate de M€" if gs.decided_by_mc else f"por {gs.margin} {'punto' if gs.margin == 1 else 'puntos'}"
    text = f"{names.get(winner, winner)} ganó en {gs.game.map_name.value} {how}"
    return {"date": gs.game.date, "type": "game", "game_id": gs.id, "player_id": winner, "text": text}


def _record_items(gs: GameStats, broken: dict, names: dict) -> list[dict]:
    items = []
    for code, previous in broken.items():
        rec, best = RECORD_BY_CODE[code], game_best(RECORD_BY_CODE[code], gs)
        before = [h.player_id for h in previous.holders]
        text = (f"{_names(best.players, names)} rompió «{rec.title}»: {js_number(best.value)} "
                f"(antes {js_number(previous.value)}, {_names(before, names)})")
        items.append({"date": gs.game.date, "type": "record", "game_id": gs.id, "player_id": best.players[0],
                      "code": code, "text": text})
    return items


def _shown(state, unlock) -> bool:
    """Logros con niveles: desde el nivel 2 y solo el más alto que dio cada partida."""
    if unlock.level < 2 and len(state.definition.tiers) > 1:
        return False
    return not any(o.game_id == unlock.game_id and o.level > unlock.level for o in state.unlocks)


def _achievement_items(achievements: dict, names: dict) -> list[dict]:
    items = []
    for pid, states in achievements.items():
        for state in states:
            for u in (u for u in state.unlocks if _shown(state, u)):
                d = state.definition
                level = f" (nivel {u.level})" if len(d.tiers) > 1 else ""
                items.append({"date": u.date, "type": "achievement", "game_id": u.game_id, "player_id": pid,
                              "code": d.code, "level": u.level,
                              "text": f"{names.get(pid, pid)} desbloqueó {d.tier(u.level).title}{level}"})
    return items


def _season_items(seasons: list[dict], names: dict) -> list[dict]:
    return [{"date": s["end"], "type": "season", "player_id": s["champion"],
             "text": f"Temporada {s['number']} completa: Marte terraformado. Campeón: {names.get(s['champion'], s['champion'])}"}
            for s in seasons if s["end"]]


def build_feed(ctx: StatsContext, achievements: dict, seasons: list[dict], names: dict) -> list[dict]:
    broken = track_game_records(ctx).broken
    items = []
    for gs in ctx.games:
        items += [_game_item(gs, names), *_record_items(gs, broken.get(gs.id, {}), names)]
    items += _achievement_items(achievements, names) + _season_items(seasons, names)
    items.sort(key=lambda i: TYPE_ORDER[i["type"]])
    return sorted(items, key=lambda i: i["date"], reverse=True)  # estable: dentro del día manda el tipo
