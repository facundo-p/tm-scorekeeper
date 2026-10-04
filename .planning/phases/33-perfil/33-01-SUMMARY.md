# 33-01 SUMMARY — Perfil

- **Backend:** la ficha suma `elo_series` e `history` (D-79) y el golden los compara.
- **`screens/Profile`:**
  - Expediente y resumen con ELO, ADN de puntaje contra el grupo, equidad, por mesa, rivales y rachas, mapas y corporaciones.
  - Pestañas de partidas (abren el informe), récords y logros con progreso.
  - Filtro de mesa.
- **Comparación:** las 7 escenas del perfil en verde en 390 y 1440 px desde la primera corrida, junto con todo lo anterior (85/85).
- **Tests:** `profileModel` (4), `Profile` (4) y pytest `test_history_and_elo_series_newest_first_with_the_table_elo`.
