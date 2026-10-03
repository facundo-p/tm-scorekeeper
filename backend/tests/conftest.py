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
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
