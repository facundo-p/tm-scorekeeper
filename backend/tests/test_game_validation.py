"""Validación compartida de partidas, reglas por mapa y códigos HTTP (F20, D-51, D-52)."""
import importlib.util
from datetime import date
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from main import app
from models.enums import Award, Expansion, MapName, Milestone
from models.game_rules import EXPANSION_MILESTONES, MAP_AWARDS, MAP_MILESTONES, allowed_awards, allowed_milestones
from services.game_service import GameConflict, GameNotFound, GamesService
from tests.integration._elo_helpers import _game_payload, _post_game, _pr


def payload(**overrides):
    base = _game_payload("g-val", "2026-01-10", [_pr("p1", 30), _pr("p2", 25)])
    base.update(overrides)
    return base


def with_milestone(body, milestone):
    body["player_results"][0]["scores"]["milestones"] = [milestone]
    body["player_results"][0]["scores"]["milestone_points"] = 5
    return body


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def players():
    from models.player import Player
    from repositories.container import players_repository
    for pid in ("p1", "p2"):
        players_repository.create(Player(player_id=pid, name=pid.upper(), is_active=True))


class TestRules:
    def test_every_map_has_five_milestones_and_awards(self):
        assert all(len(MAP_MILESTONES[m]) == 5 and len(MAP_AWARDS[m]) == 5 for m in MapName)

    def test_venus_adds_hoverlord_and_venuphile(self):
        assert Milestone.HOVERLORD not in allowed_milestones(MapName.THARSIS, [])
        assert Milestone.HOVERLORD in allowed_milestones(MapName.THARSIS, [Expansion.VENUS_NEXT])
        assert Award.VENUPHILE in allowed_awards(MapName.HELLAS, [Expansion.VENUS_NEXT])

    def test_expansions_without_board_items_add_nothing(self):
        assert allowed_milestones(MapName.HELLAS, [Expansion.TURMOIL]) == set(MAP_MILESTONES[MapName.HELLAS])
        assert Expansion.TURMOIL not in EXPANSION_MILESTONES


class TestBoardValidationApi:
    def test_milestone_from_another_map_is_400(self, client, players):
        res = client.post("/games/", json=with_milestone(payload(), "Terraformer"))
        assert res.status_code == 400
        assert "not available on Hellas" in res.json()["detail"]

    def test_award_from_another_map_is_400(self, client, players):
        body = payload(awards=[{"name": "Landlord", "opened_by": "p1", "first_place": ["p1"], "second_place": ["p2"]}])
        assert client.post("/games/", json=body).status_code == 400

    def test_map_milestone_is_accepted(self, client, players):
        assert _post_game(client, with_milestone(payload(), "Diversifier"))


class TestUpdate:
    def test_update_validates_like_create(self, client, players):
        game_id = _post_game(client, payload())
        bad = payload(date="2999-01-01")
        res = client.put(f"/games/{game_id}", json=bad)
        assert res.status_code == 400
        assert "future" in res.json()["detail"]

    def test_update_missing_game_is_404(self, client, players):
        assert client.put("/games/no-existe", json=payload()).status_code == 404

    def test_update_with_valid_data(self, client, players):
        game_id = _post_game(client, payload())
        assert client.put(f"/games/{game_id}", json=payload(generations=12)).status_code == 200


class TestConflicts:
    @staticmethod
    def _service(repo):
        players = MagicMock()
        return GamesService(games_repository=repo, players_repository=players)

    @staticmethod
    def _integrity():
        return IntegrityError("INSERT", {}, Exception("uq_player_result_game_player"))

    def test_integrity_error_on_create_is_conflict(self):
        from schemas.game import GameDTO
        repo = MagicMock()
        repo.create.side_effect = self._integrity()
        with pytest.raises(GameConflict):
            self._service(repo).create_game(GameDTO(**payload()))

    def test_integrity_error_on_update_is_conflict(self):
        from schemas.game import GameDTO
        repo = MagicMock()
        repo.get.return_value = SimpleNamespace(date=date(2026, 1, 1))
        repo.update.side_effect = self._integrity()
        with pytest.raises(GameConflict):
            self._service(repo).update_game("g", GameDTO(**payload()))

    def test_conflict_route_is_409(self, client, monkeypatch):
        from routes import games_routes
        def boom(*_):
            raise GameConflict("duplicado")
        monkeypatch.setattr(games_routes.games_service, "create_game", boom)
        assert client.post("/games/", json=payload()).status_code == 409

    def test_not_found_is_a_value_error_for_old_callers(self):
        assert issubclass(GameNotFound, ValueError)


class TestDatabaseConstraint:
    def test_duplicate_player_in_a_game_is_rejected_by_the_db(self, players):
        from db.models import Game as GameORM, PlayerResult as ResultORM
        from db.session import get_session
        row = dict(player_id="p1", corporation="CREDICOR", terraform_rating=20, milestone_points=0, milestones=[],
                   award_points=0, card_points=0, card_resource_points=0, greenery_points=0, city_points=0, mc_total=0)
        with get_session() as session, pytest.raises(IntegrityError):
            session.add(GameORM(id="g-dup", date=date(2026, 1, 1), map_name="HELLAS", expansions=[], draft=False,
                                generations=10, player_results=[ResultORM(**row), ResultORM(**row)]))
            session.commit()


class TestMigrationGuard:
    @staticmethod
    def _migration():
        path = Path(__file__).resolve().parents[1] / "db/migrations/versions/f6a7b8c9d0e1_unique_player_result.py"
        spec = importlib.util.spec_from_file_location("mig_unique", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_aborts_when_duplicates_exist(self, monkeypatch):
        mig = self._migration()
        dupes = [SimpleNamespace(game_id="g1", player_id="p1", n=2)]
        bind = MagicMock()
        bind.execute.return_value.fetchall.return_value = dupes
        monkeypatch.setattr(mig.op, "get_bind", lambda: bind, raising=False)
        create = MagicMock()
        monkeypatch.setattr(mig.op, "create_unique_constraint", create, raising=False)
        with pytest.raises(RuntimeError, match="g1/p1"):
            mig.upgrade()
        create.assert_not_called()


class TestFrontendMirror:
    """models/game_rules.py es espejo de frontend/src/constants/gameRules.ts (D-51)."""

    @staticmethod
    def _frontend_table(name):
        import re
        source = (Path(__file__).resolve().parents[2] / "frontend/src/constants/gameRules.ts").read_text()
        block = source[source.index(f"export const {name}"):]
        block = block[:block.index("\n}\n")]
        return {m: re.findall(r"\.(\w+),", body) for m, body in re.findall(r"\[MapName\.(\w+)\]: \[(.*?)\]", block, re.S)}

    def test_milestones_match(self):
        backend = {m.name: [x.name for x in v] for m, v in MAP_MILESTONES.items()}
        assert self._frontend_table("MAP_MILESTONES") == backend

    def test_awards_match(self):
        backend = {m.name: [x.name for x in v] for m, v in MAP_AWARDS.items()}
        assert self._frontend_table("MAP_AWARDS") == backend
