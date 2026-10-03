# 18-01 Summary — Filtro de mesa y equidad
- `ui/mesa.js` (`MesaFilter`, `MesaNotice`, `useMesa`, `?mesa=N` en la URL) en Partidas, Ranking, Perfil, Récords y Logros; Inicio lo usa en la carrera.
- `modelFor({ playerCount })`: ELO de mesa reproducido desde 1000, logros como vista rotulada.
- `ui/fairness.js`: Victorias vs. esperado y Posición relativa con tooltip; panel «Por tamaño de mesa» (Perfil y Ranking, D-37).
- `derive.js`: `equity` y `byTable` por jugador.
