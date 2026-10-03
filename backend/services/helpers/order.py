"""Orden canónico de partidas: (fecha, created_at, id) (F21, D-56).

Dentro de un mismo día manda la que se cargó antes; el id desempata partidas cargadas en
la misma transacción (por ejemplo, el cargador de fixtures).
"""
from datetime import datetime, timezone

_UNSAVED = datetime.max.replace(tzinfo=timezone.utc)


def chronological_key(game):
    """Clave de orden; una partida todavía sin guardar va al final de su día."""
    return (game.date, game.created_at or _UNSAVED, game.id or "")


def chronological(games):
    return sorted(games, key=chronological_key)
