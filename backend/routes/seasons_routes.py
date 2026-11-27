"""Temporadas del grupo y bitácora (F25, SEAS-01, STAT-12)."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from models.game_subset import GameSubset
from routes.dependencies import table_subset
from schemas.seasons import FeedItemDTO, SeasonCategory, SeasonDTO, SeasonsDTO
from services.container import seasons_service
from services.seasons_service import UnknownSeason

router = APIRouter(tags=["Seasons"])


@router.get("/seasons", response_model=SeasonsDTO)
def list_seasons():
    """Temporadas (siempre sobre todas las partidas) e historial de campeones (D-15)."""
    items = seasons_service.seasons()
    champions = [{"number": s["number"], "end": s["end"], "player_id": s["champion"]} for s in items if s["end"]]
    return SeasonsDTO(seasons=items, champions=champions)


def _season(number: Optional[int], category: str, player_count: Optional[int]) -> dict:
    try:
        return seasons_service.season(number, category, player_count)
    except UnknownSeason:
        raise HTTPException(status_code=404, detail="Season not found")


@router.get("/seasons/current", response_model=SeasonDTO)
def get_current_season(subset: GameSubset = Depends(table_subset), category: SeasonCategory = "total"):
    """Temporada en curso; la carrera usa la categoría y la mesa pedidas (§10)."""
    return _season(None, category, subset.player_count)


@router.get("/seasons/{number}", response_model=SeasonDTO)
def get_season(number: int, subset: GameSubset = Depends(table_subset), category: SeasonCategory = "total"):
    return _season(number, category, subset.player_count)


@router.get("/feed", response_model=list[FeedItemDTO])
def get_feed(subset: GameSubset = Depends(table_subset), limit: Optional[int] = Query(None, ge=1, le=500)):
    return seasons_service.feed(subset, limit)
