"""Colores de los cubos de los jugadores (F24, STAT-08): únicos entre los activos."""
from typing import Iterable, Literal

PLAYER_COLORS = ("rojo", "verde", "azul", "amarillo", "negro", "naranja", "violeta", "rosa", "blanco", "gris")
PlayerColor = Literal["rojo", "verde", "azul", "amarillo", "negro", "naranja", "violeta", "rosa", "blanco", "gris"]


# Los cinco colores de cubo del juego físico: el color de un jugador en una partida (D-88).
GAME_COLORS = ("negro", "verde", "azul", "rojo", "amarillo")
GameColor = Literal["negro", "verde", "azul", "rojo", "amarillo"]


class ColorTaken(ValueError):
    """Otro jugador activo ya tiene ese color (409)."""


def first_free(taken: Iterable[str]) -> str:
    """Primer color libre en el orden del catálogo; sin colores libres → ColorTaken."""
    used = set(taken)
    free = next((c for c in PLAYER_COLORS if c not in used), None)
    if free is None:
        raise ColorTaken("No free color left for an active player")
    return free
