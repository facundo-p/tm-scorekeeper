# Phase 23: Logros derivados, nuevos y vista por mesa — Context

**Milestone:** v2.0 · **Épica:** E4 (#75) · **Requisitos:** STAT-04..07 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F23.

## Objetivo
Que los logros salgan del historial (D-04): cada nivel fechado con la partida que lo alcanzó, recalculados en cada escritura después del ELO, con los 6 logros nuevos del dueño y una vista por mesa que no escribe. Referencia: `achievementMetrics` y `evaluateAchievements` de `docs/redesign/mockup/js/data/derive.js`; semántica en `docs/redesign/SEMANTICS.md` §5.

## Decisiones locales
- **D-59** Motor derivado; se borran las clases de evaluadores de v1.
- **D-60** `achievement_unlocks` se regenera completa en cada escritura; las lecturas derivan al vuelo.
- **D-61** `POST /games/{id}/achievements` es una lectura repetible; progreso en todo logro no `flag`.
- **D-62** `derived_version` en el arranque (lifespan) y recálculo conjunto ELO + logros.

## Fuera de alcance
- Logros de la partida en el informe (F24) y en la bitácora (F25).
- Íconos en el frontend nuevo: `glyph` nombra los de `frontend/src/ui/icons` (F19); las pantallas los usan desde F28.

## Partición (D-63)
- **23-A**: motor derivado (`catalog`, `metrics`, `tiers`, `derive`) y golden contra el motor; el sistema de v1 sigue atendiendo la API.
- **23-B**: tabla, recálculo, `derived_version`, vista por mesa y API sobre el motor.
- **23-C**: retiro de los evaluadores de v1 y skill `new-achievement`.
