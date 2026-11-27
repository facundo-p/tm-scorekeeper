# Phase 22: Subconjuntos, ELO de mesa y récords v2 — Context

**Milestone:** v2.0 · **Épica:** E4 (#75) · **Requisitos:** STAT-01..03 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F22.

## Objetivo
Una base común para todas las estadísticas nuevas: un filtro de subconjunto (mesa, mapa, expansión) que nunca escribe, un contexto que lee las partidas una vez en orden canónico, el ELO reproducido sobre el subconjunto y el motor de récords con la semántica D-05/D-18 que el mockup ya implementa (`derive.js`), verificado contra el golden.

## Decisiones locales
- **D-57** Motor de récords en `backend/services/records/` (no en `record_calculators/`); lo viejo queda para los endpoints previos hasta F24/F35.
- **D-58** `GET /records` con historial; el contexto «roto/cerca» se expone en el informe de F24; el ELO de mesa lo consumen las estadísticas de F23.

## Fuera de alcance
- Endpoints de estadísticas por jugador y de mesa (F23), temporadas y feed (F25), informe de partida (F24).
