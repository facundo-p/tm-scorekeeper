"""Unidad de trabajo: una sesión y una transacción por operación (F21, TXN-01, D-55).

    with unit_of_work(lock=True):
        games_repository.create(game)
        elo_service.recompute_from_date(game.date)

Dentro del bloque, los repositorios usan la sesión activa (`session_scope`) y solo hacen
flush; el commit (o el rollback ante una excepción) ocurre una vez al salir. Con
`lock=True` se toma `pg_advisory_xact_lock`: las escrituras de partidas y los recálculos
de ELO quedan en serie aunque lleguen a la vez, y el lock se libera con la transacción.
Fuera de una unidad de trabajo, cada llamada de repositorio abre, confirma y cierra su
propia sesión como antes.
"""
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Callable, Iterator, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from db.session import SessionLocal

# Clave fija del advisory lock de partidas y ELO ("tmgm" en ASCII).
GAMES_LOCK_KEY = 0x746D676D

_active: ContextVar[Optional[Session]] = ContextVar("tm_active_session", default=None)


def active_session() -> Optional[Session]:
    return _active.get()


@contextmanager
def unit_of_work(lock: bool = False, session_factory: Callable[[], Session] = SessionLocal) -> Iterator[Session]:
    """Abre una transacción, o se suma a la que ya está abierta en este contexto."""
    current = _active.get()
    if current is not None:
        if lock:
            _take_lock(current)
        yield current
        return
    session = session_factory()
    token = _active.set(session)
    try:
        if lock:
            _take_lock(session)
        yield session
        session.commit()
    except BaseException:
        session.rollback()
        raise
    finally:
        _active.reset(token)
        session.close()


def _take_lock(session: Session) -> None:
    session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": GAMES_LOCK_KEY})


@contextmanager
def session_scope(session_factory: Callable[[], Session]) -> Iterator[Session]:
    """Sesión para un repositorio: la de la unidad de trabajo activa (con flush) o una propia
    que se confirma al salir."""
    current = _active.get()
    if current is not None:
        yield current
        current.flush()
        return
    with session_factory() as session:
        yield session
        session.commit()
