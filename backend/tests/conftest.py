import pytest
from db.models import Base
from db.session import DATABASE_URL, engine
from tests.db_guard import EXIT_CODE, TEST_DB_SUFFIX, database_name, is_test_database


def pytest_configure(config):
    if not is_test_database(DATABASE_URL):
        pytest.exit(
            f"DATABASE_URL apunta a la base '{database_name(DATABASE_URL)}'. "
            f"Los tests solo corren contra una base que termine en '{TEST_DB_SUFFIX}' "
            "(por ejemplo tm_scorekeeper_test), porque borran todas las tablas.",
            returncode=EXIT_CODE,
        )


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    # Se recrea en cada sesión para que el esquema siga a los modelos (restricciones nuevas
    # incluidas); la guarda de arriba garantiza que es una base *_test.
    assert is_test_database(DATABASE_URL), "drop_all solo sobre una base *_test"
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


TEST_USER = "test-user"


@pytest.fixture(autouse=True)
def authenticated():
    """D-48: las rutas protegidas ven un usuario fijo; los tests de login usan `real_auth`."""
    from main import app
    from routes.dependencies import require_auth
    app.dependency_overrides[require_auth] = lambda: TEST_USER
    yield
    app.dependency_overrides.pop(require_auth, None)


@pytest.fixture
def real_auth():
    """Quita el reemplazo de `require_auth` y arranca con el limitador limpio."""
    from main import app
    from routes.dependencies import require_auth
    from services.auth_service import LoginLimiter
    from services.container import auth_service
    app.dependency_overrides.pop(require_auth, None)
    auth_service.limiter = LoginLimiter()
    yield
