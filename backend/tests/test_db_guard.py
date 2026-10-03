import pytest

from tests.db_guard import database_name, is_test_database


@pytest.mark.parametrize(
    "url",
    [
        "postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper_test",
        "postgresql://u:p@db_test:5432/tm_scorekeeper_test?sslmode=require",
        "postgresql+psycopg2://u:p@host/x_test",
    ],
)
def test_accepts_databases_ending_in_test(url):
    assert is_test_database(url)


@pytest.mark.parametrize(
    "url",
    [
        "postgresql://tm_user:tm_pass@localhost:5432/tm_scorekeeper",
        "postgresql://u:p@host/test_db",
        "postgresql://u:p@host/tm_test_backup",
        "postgresql://u:p@host",
        "postgresql://u:p@host/",
        "not a url",
        "",
    ],
)
def test_rejects_anything_else(url):
    assert not is_test_database(url)


def test_database_name_ignores_query_string():
    assert database_name("postgresql://u:p@h/x_test?sslmode=require") == "x_test"
