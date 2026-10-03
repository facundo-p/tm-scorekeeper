import os

from fastapi import APIRouter, Depends, HTTPException, Request

from routes.dependencies import require_auth
from schemas.auth import LoginRequestDTO, MeDTO, TokenResponseDTO
from services.auth_service import AuthNotConfigured, InvalidCredentials, TooManyAttempts
from services.container import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


def _client_ip(request: Request) -> str:
    """IP para el limitador (D-54). Con TRUSTED_PROXY_HOPS=N se toma la N-ésima entrada de
    X-Forwarded-For contando desde la derecha: las de la izquierda las puede escribir el cliente,
    las de la derecha las agregan los proxies propios. Sin proxies (0), la IP de la conexión."""
    peer = request.client.host if request.client else "unknown"
    try:
        hops = int(os.getenv("TRUSTED_PROXY_HOPS", "0"))
    except ValueError:
        hops = 0
    forwarded = [part.strip() for part in request.headers.get("x-forwarded-for", "").split(",") if part.strip()]
    if hops <= 0 or len(forwarded) < hops:
        return peer
    return forwarded[-hops]


@router.post("/login", response_model=TokenResponseDTO)
def login(body: LoginRequestDTO, request: Request):
    try:
        token, ttl = auth_service.login(body.username, body.password, _client_ip(request))
    except TooManyAttempts as e:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Esperá unos segundos.",
                            headers={"Retry-After": str(e.retry_after)})
    except AuthNotConfigured:
        raise HTTPException(status_code=503, detail="La autenticación no está configurada.")
    except InvalidCredentials:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
    return TokenResponseDTO(access_token=token, expires_in=ttl)


@router.get("/me", response_model=MeDTO)
def me(username: str = Depends(require_auth)):
    return MeDTO(username=username)
