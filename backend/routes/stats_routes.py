"""Ranking y métricas del grupo (F25, STAT-12); con `?player_count=` todo sale de esa mesa."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query

from models.game_subset import GameSubset
from routes.dependencies import table_subset, view_of
from schemas.stats import GroupSummaryDTO, HeadToHeadDTO, RankingDTO
from services.container import insights_service

router = APIRouter(tags=["Stats"])


@router.get("/ranking", response_model=RankingDTO)
def get_ranking(subset: GameSubset = Depends(table_subset),
                since: Optional[date] = Query(None, alias="from", description="Recorta la serie de ELO desde esta fecha")):
    return RankingDTO(view=view_of(subset), **insights_service.ranking(subset, since))


@router.get("/stats/head-to-head", response_model=HeadToHeadDTO)
def get_head_to_head(subset: GameSubset = Depends(table_subset)):
    return HeadToHeadDTO(view=view_of(subset), **insights_service.head_to_head(subset))


@router.get("/stats/summary", response_model=GroupSummaryDTO)
def get_group_summary(subset: GameSubset = Depends(table_subset)):
    return GroupSummaryDTO(view=view_of(subset), **insights_service.summary(subset))
