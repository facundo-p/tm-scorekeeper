from fastapi import APIRouter, Depends, HTTPException, Request

from routes.dependencies import require_auth
from schemas.auth import LoginRequestDTO, MeDTO, TokenResponseDTO
from services.auth_service import AuthNotConfigured, InvalidCredentials, TooManyAttempts
from services.container import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


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
