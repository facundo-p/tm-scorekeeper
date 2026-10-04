# 32-01 SUMMARY — Ranking y jugadores

- **`screens/Ranking`**: port del ranking del mockup con datos de la API.
  - Clasificación por ELO o por ELO de mesa, con pico, partidas, victorias, vs. esperado, posición relativa, forma y últimos 12.
  - Evolución del ELO con rangos de fechas y jugadores resaltados.
  - Por tamaño de mesa.
  - Cara a cara: matriz y rivalidades.
  - Plantel en orden de alta, con la hoja de alta y edición.
- **`ui/fairness`**: las lecturas de equidad, compartidas con el perfil.
- **Backend:** `players.joined_on` (D-78); `since` es la fecha de alta.
- **Arnés:**
  - Acción `select`.
  - Cuatro escenarios nuevos.
  - La candidata se niega a arrancar si un servidor viejo ocupa sus puertos.
- **Tests:** `rankingModel` (4), `Ranking` (5) y pytest `test_player_colors` y `test_player_joined_on_migration`.
