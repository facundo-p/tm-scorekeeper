"""Dependencias compartidas por las rutas."""
from typing import Optional

from fastapi import Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from models.enums import Expansion, MapName
from models.game_subset import GameSubset
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


def game_subset(
    player_count: Optional[int] = Query(None, ge=2, le=5, description="Solo partidas de N jugadores"),
    map: Optional[MapName] = Query(None, description="Solo partidas en este mapa"),
    expansion: Optional[Expansion] = Query(None, description="Solo partidas con esta expansión"),
) -> GameSubset:
    """Filtro único de subconjunto (STAT-01); fuera de rango o valor desconocido → 422."""
    return GameSubset(player_count=player_count, map=map, expansion=expansion)
