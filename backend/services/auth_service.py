"""Autenticación de un solo usuario del grupo (D-03, D-49, D-50).

Credenciales en variables de entorno: AUTH_USERNAME, AUTH_PASSWORD_HASH (PBKDF2,
ver scripts/hash_password.py) y AUTH_SECRET para firmar los JWT (HS256). Sin alguna
de ellas el login se rechaza y ningún token es válido (fail-closed).
"""
import base64
import hashlib
import hmac
import math
import os
import secrets
import threading
import time
from dataclasses import dataclass
from typing import Callable, Optional

import jwt

HASH_SCHEME = "pbkdf2_sha256"
HASH_ITERATIONS = 600_000
JWT_ALGORITHM = "HS256"
DEFAULT_TTL_DAYS = 30
MAX_FAILURES = 5
BLOCK_SECONDS = 30


class AuthNotConfigured(Exception):
    """Faltan variables de entorno de autenticación."""


class InvalidCredentials(Exception):
    """Usuario o contraseña incorrectos."""


class InvalidToken(Exception):
    """Token ausente, vencido, mal firmado o de otro usuario."""


class TooManyAttempts(Exception):
    def __init__(self, retry_after: int):
        super().__init__(f"Too many attempts, retry after {retry_after}s")
        self.retry_after = retry_after


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def hash_password(password: str, *, iterations: int = HASH_ITERATIONS, salt: Optional[bytes] = None) -> str:
    """`pbkdf2_sha256$<iteraciones>$<sal>$<hash>` (D-49)."""
    salt = salt if salt is not None else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"{HASH_SCHEME}${iterations}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, encoded: str) -> bool:
    """Compara en tiempo constante; un hash mal formado nunca valida."""
    try:
        scheme, iterations, salt, expected = encoded.split("$")
        if scheme != HASH_SCHEME:
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), _unb64(salt), int(iterations))
        return hmac.compare_digest(digest, _unb64(expected))
    except (ValueError, TypeError):
        return False


@dataclass(frozen=True)
class AuthConfig:
    username: str
    password_hash: str
    secret: str
    ttl_days: int

    @classmethod
    def from_env(cls) -> Optional["AuthConfig"]:
        username = os.getenv("AUTH_USERNAME", "")
        password_hash = os.getenv("AUTH_PASSWORD_HASH", "")
        secret = os.getenv("AUTH_SECRET", "")
        if not (username and password_hash and secret):
            return None
        ttl = int(os.getenv("AUTH_TOKEN_TTL_DAYS", DEFAULT_TTL_DAYS))
        return cls(username, password_hash, secret, ttl)


class LoginLimiter:
    """Bloqueo en memoria por IP: 5 fallos seguidos bloquean 30 s (D-50)."""

    def __init__(self, clock: Callable[[], float] = time.monotonic):
        self._clock = clock
        self._failures: dict[str, int] = {}
        self._blocked_until: dict[str, float] = {}
        self._lock = threading.Lock()

    def check(self, ip: str) -> None:
        with self._lock:
            remaining = self._blocked_until.get(ip, 0.0) - self._clock()
            if remaining > 0:
                raise TooManyAttempts(math.ceil(remaining))
            self._blocked_until.pop(ip, None)

    def fail(self, ip: str) -> None:
        with self._lock:
            count = self._failures.get(ip, 0) + 1
            if count >= MAX_FAILURES:
                self._blocked_until[ip] = self._clock() + BLOCK_SECONDS
                count = 0
            self._failures[ip] = count

    def success(self, ip: str) -> None:
        with self._lock:
            self._failures.pop(ip, None)
            self._blocked_until.pop(ip, None)


class AuthService:
    def __init__(self, config_loader: Callable[[], Optional[AuthConfig]] = AuthConfig.from_env,
                 limiter: Optional[LoginLimiter] = None, clock: Callable[[], float] = time.time):
        self._config_loader = config_loader
        self.limiter = limiter or LoginLimiter()
        self._clock = clock

    def _config(self) -> AuthConfig:
        config = self._config_loader()
        if config is None:
            raise AuthNotConfigured()
        return config

    def login(self, username: str, password: str, ip: str) -> tuple[str, int]:
        """Devuelve (token, segundos de validez). El bloqueo se mira antes que la configuración."""
        self.limiter.check(ip)
        config = self._config()
        user_ok = hmac.compare_digest(username.encode(), config.username.encode())
        password_ok = verify_password(password, config.password_hash)
        if not (user_ok and password_ok):
            self.limiter.fail(ip)
            raise InvalidCredentials()
        self.limiter.success(ip)
        return self._issue(config)

    def _issue(self, config: AuthConfig) -> tuple[str, int]:
        now = int(self._clock())
        ttl = config.ttl_days * 86_400
        payload = {"sub": config.username, "iat": now, "exp": now + ttl}
        return jwt.encode(payload, config.secret, algorithm=JWT_ALGORITHM), ttl

    def verify(self, token: str) -> str:
        """Usuario del token; cualquier problema (incluida la falta de configuración) es InvalidToken."""
        config = self._config_loader()
        if config is None:
            raise InvalidToken()
        try:
            payload = jwt.decode(token, config.secret, algorithms=[JWT_ALGORITHM],
                                 options={"require": ["exp", "sub"]})
        except jwt.PyJWTError as e:
            raise InvalidToken() from e
        if not hmac.compare_digest(str(payload["sub"]).encode(), config.username.encode()):
            raise InvalidToken()
        return config.username
