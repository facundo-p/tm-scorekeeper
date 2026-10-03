"""404 en partidas y jugadores inexistentes (F21, TXN-04)."""
import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.mark.parametrize("method, path", [
    ("get", "/games/no-existe/results"),
    ("get", "/games/no-existe/records"),
    ("get", "/games/no-existe/elo"),
    ("post", "/games/no-existe/achievements"),
    ("delete", "/games/no-existe"),
    ("get", "/players/no-existe/profile"),
    ("get", "/players/no-existe/elo-summary"),
    ("get", "/players/no-existe/achievements"),
])
def test_missing_resources_are_404(client, method, path):
    assert getattr(client, method)(path).status_code == 404
