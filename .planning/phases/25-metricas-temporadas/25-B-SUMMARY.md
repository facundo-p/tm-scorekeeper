# 25-B SUMMARY — Ranking y métricas del grupo

- `services/insights_service.py` pasa a una `GroupView` compartida (filas, ELO reproducido, ranking; cara a cara y composición del grupo perezosos) que usan la ficha y el ranking.
- `services/stats/group.py`: resumen del grupo y cambios de líder (a igual ELO, el que apareció primero, como el mockup).
- Rutas `GET /ranking`, `GET /stats/head-to-head`, `GET /stats/summary` (`routes/stats_routes.py`).
- Golden: `summary`, `head_to_head` (más némesis/víctima contra `players`), `lead_changes` y las filas del ranking contra `players` y `elo.perGame`, en 5 alcances.
- Tests: `tests/integration/test_stats_routes.py` (8).
