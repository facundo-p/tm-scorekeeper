"""Operaciones de mantenimiento: exigen token (router protegido) y el header X-Admin-Secret."""
import os
import secrets

from fastapi import APIRouter, Header, HTTPException

from services.container import elo_service

router = APIRouter(prefix="/admin", tags=["Admin"])


def _check_admin_secret(provided: str | None) -> None:
    expected = os.getenv("ADMIN_SECRET", "")
    if not expected or not provided or not secrets.compare_digest(provided.encode(), expected.encode()):
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/recompute")
def recompute(x_admin_secret: str | None = Header(default=None)):
    """Recalcula el ELO de toda la historia."""
    _check_admin_secret(x_admin_secret)
    elo_service.recompute_all()
    return {"status": "ok", "message": "ELO recomputed from all history"}
