"""Golden del backend (F16): carga la semilla del mockup una vez por paquete y
compara los endpoints contra fixtures/golden.json."""
import json
from pathlib import Path

import pytest
import yaml
from fastapi.testclient import TestClient

from db.models import Base
from db.session import engine
from scripts.load_fixture import read_seed, load

FIXTURES = Path(__file__).resolve().parents[3] / "fixtures"
ENABLED = Path(__file__).with_name("enabled.yaml")


@pytest.fixture(autouse=True)
def clean_tables():
    """Anula la limpieza por test: la semilla vive durante todo el paquete."""
    yield


@pytest.fixture(scope="package")
def seeded():
    load(read_seed(FIXTURES / "seed.json"))
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture(scope="package")
def golden():
    with open(FIXTURES / "golden.json", encoding="utf-8") as fh:
        return json.load(fh)


@pytest.fixture(scope="package")
def client(seeded):
    from main import app

    return TestClient(app)


def enabled_scopes(key: str) -> list[str]:
    with open(ENABLED, encoding="utf-8") as fh:
        return [str(s) for s in (yaml.safe_load(fh) or {}).get(key, [])]


def golden_scope(golden: dict, scope: str) -> dict:
    return golden["all"] if scope == "all" else golden["mesa"][scope]
