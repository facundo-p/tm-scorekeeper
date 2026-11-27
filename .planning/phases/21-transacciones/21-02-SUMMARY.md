# 21-02 SUMMARY — Orden canónico

- Migración `a7b8c9d0e1f2`: `games.created_at` (backfill de a un segundo por fecha siguiendo el id; nuevas con `now()`), probada con datos.
- `services/helpers/order.py` (`chronological_key`); el repositorio de partidas lista en orden canónico y el de ELO ordena con `JOIN games` (baseline, último cambio, historial). ELO, récords por partida y rachas usan el mismo orden (D-56).
- Test: dos partidas del mismo día cargadas en orden inverso a sus ids siguen el orden de carga.
