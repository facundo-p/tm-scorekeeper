"""Rutas: login, /auth/me, /health y protección de toda la API (D-03, D-50)."""
import jwt
import pytest
from fastapi.testclient import TestClient

from main import app
from services.auth_service import MAX_FAILURES, hash_password

PASSWORD = "marte-rojo"
SECRET = "secreto-de-prueba-de-al-menos-32-bytes"


@pytest.fixture
def client(real_auth):
    return TestClient(app)


@pytest.fixture
def configured(monkeypatch):
    monkeypatch.setenv("AUTH_USERNAME", "grupo")
    monkeypatch.setenv("AUTH_PASSWORD_HASH", hash_password(PASSWORD, iterations=1_000))
    monkeypatch.setenv("AUTH_SECRET", SECRET)


@pytest.fixture
def unconfigured(monkeypatch):
    for key in ("AUTH_USERNAME", "AUTH_PASSWORD_HASH", "AUTH_SECRET"):
        monkeypatch.delenv(key, raising=False)


def login(client, password=PASSWORD):
    return client.post("/auth/login", json={"username": "grupo", "password": password})


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_health_is_public(client, unconfigured):
    assert client.get("/health").json() == {"status": "ok"}


def test_login_and_me(client, configured):
    res = login(client)
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer" and body["expires_in"] == 30 * 86_400
    me = client.get("/auth/me", headers=bearer(body["access_token"]))
    assert me.json() == {"username": "grupo"}


@pytest.mark.parametrize("path", ["/players/", "/games/", "/records/", "/elo/history", "/auth/me"])
def test_protected_routes_need_token(client, configured, path):
    res = client.get(path)
    assert res.status_code == 401
    assert res.headers["www-authenticate"] == "Bearer"


def test_valid_token_opens_the_api(client, configured):
    token = login(client).json()["access_token"]
    assert client.get("/players/", headers=bearer(token)).status_code == 200


@pytest.mark.parametrize("header", ["Basic abc", "Bearer", "Bearer ", "token-sin-esquema"])
def test_malformed_header(client, configured, header):
    assert client.get("/players/", headers={"Authorization": header}).status_code == 401


def test_expired_and_foreign_tokens(client, configured):
    expired = jwt.encode({"sub": "grupo", "exp": 1}, SECRET, algorithm="HS256")
    forged = jwt.encode({"sub": "grupo", "exp": 10**10}, "otra-clave-de-prueba-de-32-bytes-o-mas", algorithm="HS256")
    for token in (expired, forged):
        assert client.get("/players/", headers=bearer(token)).status_code == 401


def test_wrong_password_is_401(client, configured):
    res = login(client, "mal")
    assert res.status_code == 401
    assert res.json()["detail"] == "Usuario o contraseña incorrectos."


def test_sixth_attempt_after_five_failures_is_429(client, configured):
    for _ in range(MAX_FAILURES):
        assert login(client, "mal").status_code == 401
    res = login(client)
    assert res.status_code == 429
    assert int(res.headers["retry-after"]) == 30


def test_fail_closed_without_configuration(client, unconfigured):
    assert login(client).status_code == 503
    token = jwt.encode({"sub": "grupo", "exp": 10**10}, SECRET, algorithm="HS256")
    assert client.get("/players/", headers=bearer(token)).status_code == 401


def test_login_validates_body(client, configured):
    assert client.post("/auth/login", json={"username": "", "password": "x"}).status_code == 422
