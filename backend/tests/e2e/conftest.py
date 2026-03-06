import pytest

from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def session_factory():
    from db.session import get_session
    return get_session


@pytest.fixture
def players_repo(session_factory):
    from repositories.player_repository import PlayersRepository
    return PlayersRepository(session_factory=session_factory)


@pytest.fixture
def games_repo(session_factory):
    from repositories.game_repository import GamesRepository
    return GamesRepository(session_factory=session_factory)
