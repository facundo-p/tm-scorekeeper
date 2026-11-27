import pytest

from scripts.load_fixture import DEFAULT_SEED, check_database, read_seed


@pytest.mark.parametrize("url", [
    "postgresql://u:p@localhost/tm_scorekeeper_test",
    "postgresql://u:p@localhost/tm_parity",
])
def test_accepts_test_and_parity_databases(url):
    check_database(url)


@pytest.mark.parametrize("url", [
    "postgresql://u:p@localhost/tm_scorekeeper",
    "postgresql://u:p@localhost/parity_prod",
    "postgresql://u:p@localhost",
])
def test_refuses_any_other_database(url):
    with pytest.raises(SystemExit):
        check_database(url)


def test_seed_has_players_and_games_with_ids():
    seed = read_seed(DEFAULT_SEED)
    assert {p["id"] for p in seed["players"]} >= {"p-facu", "p-pato"}
    assert seed["games"][0]["id"] == "g-001" and seed["games"][-1]["id"] == "g-063"
