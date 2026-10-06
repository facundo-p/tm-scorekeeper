# Phase 25: Métricas del grupo, equidad y temporadas — Context

**Milestone:** v2.0 · **Épica:** E4 (#75) · **Requisitos:** STAT-11, STAT-12, SEAS-01 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F25.

## Objetivo
Exponer lo que el mockup calcula para el perfil, el ranking, la portada y las temporadas, con el filtro de mesa, igual al golden (`players`, `head_to_head`, `feed`, `summary`, `lead_changes`, `seasons`, `season_races`) y con p95 < 300 ms en local.

## Partición (D-67)
- **25-A** ficha del jugador (`GET /players/{id}/insights`).
- **25-B** ranking con equidad, cara a cara y rivalidades, resumen y cambios de líder.
- **25-C** temporadas y campeones, y la bitácora (que anuncia a los campeones).
