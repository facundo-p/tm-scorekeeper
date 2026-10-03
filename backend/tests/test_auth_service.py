"""Unidad: hash PBKDF2, limitador por IP y tokens (D-49, D-50)."""
import time

import jwt
import pytest

from services.auth_service import (
    BLOCK_SECONDS, MAX_FAILURES, AuthConfig, AuthNotConfigured, AuthService, InvalidCredentials, InvalidToken,
    LoginLimiter, TooManyAttempts, hash_password, verify_password,
)

PASSWORD = "marte-rojo"
FAST_HASH = hash_password(PASSWORD, iterations=1_000)
SECRET = "clave-de-prueba-de-al-menos-32-bytes!"


class Clock:
    def __init__(self, now=None):
        self.now = time.time() if now is None else now

    def __call__(self):
        return self.now


def make_service(config=True, clock=None):
    cfg = AuthConfig("grupo", FAST_HASH, SECRET, 30) if config else None
    clock = clock or Clock()
    return AuthService(config_loader=lambda: cfg, limiter=LoginLimiter(clock=clock), clock=clock), clock


def test_hash_format_and_verify():
    encoded = hash_password(PASSWORD, iterations=1_000, salt=b"\x00" * 16)
    scheme, iterations, salt, digest = encoded.split("$")
    assert (scheme, iterations) == ("pbkdf2_sha256", "1000")
    assert "=" not in salt + digest
    assert verify_password(PASSWORD, encoded)
    assert not verify_password("otra", encoded)


@pytest.mark.parametrize("bad", ["", "texto", "md5$1$a$b", "pbkdf2_sha256$x$a$b", "pbkdf2_sha256$1000$%%$b"])
def test_malformed_hash_never_validates(bad):
    assert not verify_password(PASSWORD, bad)


def test_default_hash_uses_600k_iterations():
    assert hash_password("x", salt=b"1" * 16).split("$")[1] == "600000"


def test_login_issues_token_with_ttl():
    service, clock = make_service()
    token, ttl = service.login("grupo", PASSWORD, "1.1.1.1")
    payload = jwt.decode(token, SECRET, algorithms=["HS256"])
    assert ttl == 30 * 86_400
    assert payload["sub"] == "grupo" and payload["exp"] - payload["iat"] == ttl
    assert service.verify(token) == "grupo"


@pytest.mark.parametrize("user, password", [("grupo", "mal"), ("otro", PASSWORD), ("", "")])
def test_wrong_credentials(user, password):
    service, _ = make_service()
    with pytest.raises(InvalidCredentials):
        service.login(user, password, "1.1.1.1")


def test_not_configured_rejects_login_and_tokens():
    service, _ = make_service(config=False)
    with pytest.raises(AuthNotConfigured):
        service.login("grupo", PASSWORD, "1.1.1.1")
    with pytest.raises(InvalidToken):
        service.verify("cualquier.cosa.firmada")


def test_block_after_five_failures_and_release_after_30s():
    service, clock = make_service()
    for _ in range(MAX_FAILURES):
        with pytest.raises(InvalidCredentials):
            service.login("grupo", "mal", "9.9.9.9")
    with pytest.raises(TooManyAttempts) as blocked:
        service.login("grupo", PASSWORD, "9.9.9.9")
    assert blocked.value.retry_after == BLOCK_SECONDS
    service.login("grupo", PASSWORD, "8.8.8.8")  # otra IP no se bloquea
    clock.now += BLOCK_SECONDS
    assert service.login("grupo", PASSWORD, "9.9.9.9")[0]


def test_success_resets_failure_count():
    service, _ = make_service()
    for _ in range(MAX_FAILURES - 1):
        with pytest.raises(InvalidCredentials):
            service.login("grupo", "mal", "7.7.7.7")
    service.login("grupo", PASSWORD, "7.7.7.7")
    for _ in range(MAX_FAILURES - 1):
        with pytest.raises(InvalidCredentials):
            service.login("grupo", "mal", "7.7.7.7")


def test_expired_wrong_signature_and_foreign_subject():
    service, clock = make_service()
    token, _ = service.login("grupo", PASSWORD, "1.1.1.1")
    other = jwt.encode({"sub": "grupo", "exp": 10**10}, "otra-clave-de-prueba-de-32-bytes-o-mas", algorithm="HS256")
    stranger = jwt.encode({"sub": "intruso", "exp": 10**10}, SECRET, algorithm="HS256")
    no_exp = jwt.encode({"sub": "grupo"}, SECRET, algorithm="HS256")
    expired = jwt.encode({"sub": "grupo", "exp": 1}, SECRET, algorithm="HS256")
    for bad in (other, stranger, no_exp, expired, "no-es-un-jwt"):
        with pytest.raises(InvalidToken):
            service.verify(bad)
    assert service.verify(token) == "grupo"


def test_config_from_env(monkeypatch):
    for key in ("AUTH_USERNAME", "AUTH_PASSWORD_HASH", "AUTH_SECRET", "AUTH_TOKEN_TTL_DAYS"):
        monkeypatch.delenv(key, raising=False)
    assert AuthConfig.from_env() is None
    monkeypatch.setenv("AUTH_USERNAME", "grupo")
    monkeypatch.setenv("AUTH_PASSWORD_HASH", FAST_HASH)
    assert AuthConfig.from_env() is None
    monkeypatch.setenv("AUTH_SECRET", "s")
    monkeypatch.setenv("AUTH_TOKEN_TTL_DAYS", "7")
    assert AuthConfig.from_env().ttl_days == 7
