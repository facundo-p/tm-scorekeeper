"""Sumas y promedios que dan los mismos floats que el mockup (D-06).

`sum()` de Python 3.12 compensa el error de redondeo y puede diferir en el último bit de la
suma de izquierda a derecha que hace JavaScript; acá se suma siempre de izquierda a derecha.
"""
from functools import reduce
from operator import add
from typing import Callable, Iterable, Optional, TypeVar

T = TypeVar("T")


def plain_sum(values: Iterable[float]) -> float:
    return reduce(add, values, 0)


def mean(items: list[T], value_of: Callable[[T], float]) -> float:
    """Promedio; 0 sin elementos (como `avg` del mockup)."""
    return plain_sum(value_of(x) for x in items) / len(items) if items else 0


def mean_or_none(items: list[T], value_of: Callable[[T], float]) -> Optional[float]:
    return mean(items, value_of) if items else None
