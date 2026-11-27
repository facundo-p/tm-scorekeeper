"""Guarda de la base de tests (REVIEW S4).

Los tests borran todas las tablas de la base apuntada por DATABASE_URL, así que
solo se permite correrlos contra una base cuyo nombre termine en `_test`.
"""
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError

TEST_DB_SUFFIX = "_test"
EXIT_CODE = 2


def database_name(url: str) -> str | None:
    """Nombre de la base de una URL de SQLAlchemy, o None si no se puede leer."""
    try:
        return make_url(url).database
    except ArgumentError:
        return None


def is_test_database(url: str) -> bool:
    name = database_name(url)
    return bool(name) and name.endswith(TEST_DB_SUFFIX)
