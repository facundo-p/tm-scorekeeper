import os, sys
import pytest

# make backend directory importable (routes etc. are top-level inside it)
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
backend_dir = os.path.join(workspace_root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from backend.main import app
from backend.db.models import Base
from backend.db.session import engine


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
    from backend.db.session import get_session
    return get_session


@pytest.fixture
def players_repo(session_factory):
    from backend.repositories.player_repository import PlayersRepository
    return PlayersRepository(session_factory=session_factory)


@pytest.fixture
def games_repo(session_factory):
    from backend.repositories.game_repository import GamesRepository
    return GamesRepository(session_factory=session_factory)
