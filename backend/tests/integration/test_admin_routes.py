"""POST /admin/recompute: token + X-Admin-Secret (comparación en tiempo constante)."""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_secret(monkeypatch):
    monkeypatch.setenv("ADMIN_SECRET", "secreto-admin")


def test_recompute_with_secret(client, admin_secret):
    with patch("routes.admin_routes.derived_service.recompute_all") as recompute:
        res = client.post("/admin/recompute", headers={"X-Admin-Secret": "secreto-admin"})
    assert res.status_code == 200
    recompute.assert_called_once()


@pytest.mark.parametrize("headers", [{}, {"X-Admin-Secret": "otro"}, {"X-Admin-Secret": ""}])
def test_wrong_or_missing_secret_is_403(client, admin_secret, headers):
    with patch("routes.admin_routes.derived_service.recompute_all") as recompute:
        assert client.post("/admin/recompute", headers=headers).status_code == 403
    recompute.assert_not_called()


def test_without_admin_secret_configured_is_403(client, monkeypatch):
    monkeypatch.delenv("ADMIN_SECRET", raising=False)
    assert client.post("/admin/recompute", headers={"X-Admin-Secret": ""}).status_code == 403


def test_requires_token(real_auth, admin_secret):
    res = TestClient(app).post("/admin/recompute", headers={"X-Admin-Secret": "secreto-admin"})
    assert res.status_code == 401


def test_old_get_endpoint_is_gone(client, admin_secret):
    assert client.get("/elo/admin/recompute", params={"secret": "secreto-admin"}).status_code == 404
