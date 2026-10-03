"""Carga `fixtures/seed.json` (exportado del mockup) en una base de tests o de comparación.

Uso:
    DATABASE_URL=postgresql://…/tm_parity python -m scripts.load_fixture [ruta/seed.json]

Solo corre contra bases cuyo nombre termina en `_test` o `_parity` (vacía todas
las tablas). Conserva los ids de jugadores y partidas, inserta todo en una sola
transacción y después hace un único recálculo de ELO y logros.
"""
import json
import os
import sys
import time
from pathlib import Path

from sqlalchemy.engine import make_url

ALLOWED_SUFFIXES = ("_test", "_parity")
DEFAULT_SEED = Path(__file__).resolve().parents[2] / "fixtures" / "seed.json"


def check_database(url: str) -> None:
    name = make_url(url).database or ""
    if not name.endswith(ALLOWED_SUFFIXES):
        raise SystemExit(f"load_fixture: la base '{name}' no termina en {ALLOWED_SUFFIXES}; no se toca.")


def read_seed(path: Path) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _clear(session, base) -> None:
    for table in reversed(base.metadata.sorted_tables):
        session.execute(table.delete())


def _insert(session, seed: dict) -> None:
    from db.models import Player as PlayerORM
    from mappers.game_mapper import game_dto_to_model
    from repositories.container import games_repository
    from schemas.game import GameDTO

    session.add_all(PlayerORM(id=p["id"], name=p["name"], is_active=p["is_active"], elo=1000) for p in seed["players"])
    session.flush()
    for raw in seed["games"]:
        session.add(games_repository.to_orm(game_dto_to_model(GameDTO(**raw))))


def load(seed: dict) -> None:
    """Reemplaza el contenido de la base actual por la semilla y recalcula."""
    from db.models import Base
    from db.session import SessionLocal, engine
    from services.container import achievements_service, elo_service

    check_database(str(engine.url))
    Base.metadata.create_all(bind=engine)
    with SessionLocal.begin() as session:
        _clear(session, Base)
        _insert(session, seed)
    elo_service.recompute_all()
    achievements_service.reconcile_all()


def main(argv: list[str]) -> None:
    check_database(os.getenv("DATABASE_URL", ""))
    path = Path(argv[1]) if len(argv) > 1 else DEFAULT_SEED
    started = time.perf_counter()
    seed = read_seed(path)
    load(seed)
    print(f"load_fixture: {len(seed['players'])} jugadores y {len(seed['games'])} partidas "
          f"en {time.perf_counter() - started:.1f} s")


if __name__ == "__main__":
    main(sys.argv)
