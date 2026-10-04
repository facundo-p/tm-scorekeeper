"""Orden de alta de los jugadores (F28, D-74): las listas no cambian con las actualizaciones."""
from fastapi.testclient import TestClient

from main import app
from services.achievements_service import _game_unlocks
from repositories.achievement_repository import UnlockRow
from repositories.player_repository import PlayersRepository


def test_players_come_in_signup_order_even_after_updates():
    client = TestClient(app)
    ids = [client.post("/players/", json={"name": n}).json()["player_id"] for n in ("Zoe", "Ana", "Memo")]
    client.patch(f"/players/{ids[0]}", json={"name": "Zoe B"})
    # GET /players/ sigue ordenado por nombre (contrato viejo); el orden de alta lo da el repositorio.
    assert [p.player_id for p in PlayersRepository().get_all()] == ids


def test_a_game_can_give_several_levels_of_one_achievement():
    rows = [UnlockRow("p", "games_played", 2, "g", None), UnlockRow("p", "games_played", 3, "g", None), UnlockRow("p", "blitz", 1, "g", None)]
    by_code = {u.code: u for u in _game_unlocks(rows)["p"]}
    assert (by_code["games_played"].tier, by_code["games_played"].levels, by_code["games_played"].is_new) == (3, 2, False)
    assert (by_code["blitz"].levels, by_code["blitz"].is_new) == (1, True)
