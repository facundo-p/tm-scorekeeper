import pytest

from fastapi.testclient import TestClient
from main import app
from db.models import Base
from db.session import engine


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # create and later drop tables against whatever DATABASE_URL is configured
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


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
