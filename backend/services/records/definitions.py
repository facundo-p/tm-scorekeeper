"""Los 16 récords oficiales de v2.0 (F22, STAT-03, SEMANTICS §4).

Espejo de RECORDS en docs/redesign/mockup/js/data/catalog.js. `lower_is_better` solo en
`closest_win` y `fastest_win`. Para agregar uno, ver el skill `new-record`.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class RecordDef:
    code: str
    title: str
    description: str
    unit: str
    scope: str  # "game" o "career"
    lower_is_better: bool = False


RECORD_DEFS: list[RecordDef] = [
    RecordDef("highest_single_game_score", "Emperador de Marte", "Puntaje más alto en una partida", "pts", "game"),
    RecordDef("highest_terraform_rating", "Arquitecto climático", "TR más alto en una partida", "TR", "game"),
    RecordDef("highest_card_points", "Magnate de proyectos", "Más puntos de cartas en una partida", "pts", "game"),
    RecordDef("highest_card_resource_points", "Barón de los recursos", "Más puntos por recursos de cartas en una partida", "pts", "game"),
    RecordDef("highest_greenery_points", "Rey de los bosques", "Más puntos de vegetación en una partida", "pts", "game"),
    RecordDef("highest_city_points", "Urbanista supremo", "Más puntos de ciudades en una partida", "pts", "game"),
    RecordDef("highest_turmoil_points", "Maestro de la política", "Más puntos de Turmoil en una partida", "pts", "game"),
    RecordDef("most_games_played", "Colono persistente", "Más partidas jugadas", "partidas", "career"),
    RecordDef("most_games_won", "Estratega extraordinario", "Más partidas ganadas", "victorias", "career"),
    RecordDef("biggest_margin", "Aplanadora", "Mayor diferencia entre el ganador y el segundo", "pts", "game"),
    RecordDef("closest_win", "Por un pelo", "Victoria más ajustada (menor diferencia con el segundo)", "pts", "game", lower_is_better=True),
    RecordDef("points_per_generation", "Motor perfecto", "Más puntos por generación en una partida", "pts/gen", "game"),
    RecordDef("fastest_win", "Blitz", "Victoria en la partida con menos generaciones", "gen", "game", lower_is_better=True),
    RecordDef("highest_elo", "Cima del Consejo", "ELO más alto alcanzado", "ELO", "career"),
    RecordDef("longest_streak", "Imparable", "Racha de victorias consecutivas más larga", "seguidas", "career"),
    RecordDef("richest_finish", "Tesorería", "Más M€ al terminar una partida", "M€", "game"),
]

RECORD_BY_CODE = {d.code: d for d in RECORD_DEFS}
