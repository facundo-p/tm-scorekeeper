import os
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from schemas.elo import PlayerEloHistoryDTO
from services.container import elo_service


router = APIRouter(prefix="/elo", tags=["Elo"])


@router.get("/history", response_model=list[PlayerEloHistoryDTO])
def get_elo_history(
    from_: Optional[date] = Query(None, alias="from"),
    player_ids: Optional[str] = Query(None),
):
    ids_set: Optional[set[str]] = (
        {p for p in player_ids.split(",") if p} if player_ids else None
    )
    return elo_service.get_history(date_from=from_, player_ids=ids_set)


@router.post("/admin/recompute")
def admin_recompute_elo(secret: str = Query(...)):
    expected = os.getenv("ADMIN_SECRET")
    if not expected or secret != expected:
        raise HTTPException(status_code=403, detail="Forbidden")
    elo_service.recompute_all()
    return {"status": "ok", "message": "ELO recomputed from all history"}
