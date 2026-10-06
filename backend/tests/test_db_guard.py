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


def test_pytest_exits_with_code_2_on_a_non_test_database():
    """La guarda corta la sesión antes de conectarse a la base (REVIEW S4)."""
    import os
    import subprocess
    import sys
    from pathlib import Path

    backend = Path(__file__).resolve().parents[1]
    env = {**os.environ, "DATABASE_URL": "postgresql://u:p@localhost:1/produccion"}
    proc = subprocess.run(
        [sys.executable, "-m", "pytest", "tests/test_db_guard.py", "-q", "-p", "no:cacheprovider"],
        cwd=backend, env=env, capture_output=True, text=True, timeout=120,
    )
    assert proc.returncode == 2
    assert "produccion" in proc.stdout + proc.stderr
