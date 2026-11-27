# Phase 21: Transacciones, orden, rendimiento y empates — Context

**Milestone:** v2.0 · **Épica:** E3 (#74) · **Requisitos:** TXN-01..04 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F21.

## Objetivo
Que las escrituras sean atómicas y en serie, que el orden de las partidas sea el canónico (fecha, carga, id) en todo el backend, que listar partidas no haga N+1 y que los empates y los récords sigan la semántica nueva (D-07, D-17) antes de que los consuman las pantallas.

## Decisiones locales
- **D-55** Unidad de trabajo con `contextvars` (`db/uow.py`): los repositorios usan la sesión activa si hay una (`session_scope`) en lugar de recibir `session` por parámetro; fuera de una unidad, cada llamada confirma sola como antes. `expire_on_commit=False` para que las filas leídas sigan usables después del commit.
- **D-56** Orden canónico (fecha, `created_at`, id) con `games.created_at` (backfill: dentro de cada fecha, de a un segundo siguiendo el id). Helper `services/helpers/order.py`; el repositorio de partidas y el de ELO ordenan igual.
