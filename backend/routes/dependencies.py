"""Dependencias compartidas por las rutas."""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.auth_service import InvalidToken
from services.container import auth_service

_bearer = HTTPBearer(auto_error=False)
_UNAUTHORIZED = HTTPException(
    status_code=401, detail="No autenticado", headers={"WWW-Authenticate": "Bearer"},
)


def require_auth(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> str:
    """Usuario del token Bearer; 401 si falta, está vencido, mal firmado o no hay configuración (D-50)."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _UNAUTHORIZED
    try:
        return auth_service.verify(credentials.credentials)
    except InvalidToken:
        raise _UNAUTHORIZED
