# Phase 32 — Ranking y jugadores (contexto)

- **Requisitos:** SCR-08 (ranking), SCR-09 (alta y edición de jugadores) · **Issues:** 32.1 #132, 32.2 #133 · **Épica:** E6
- **Referencia:** `docs/redesign/mockup/js/screens/ranking.js`, `js/ui/fairness.js` y `css/screens.css` (`.ranking-grid`, `.lb*`, `.elo-panel*`, `.h2h-panel*`, `.rivals*`, `.roster*`, `.pform`, `.cubepick*`, `.infotip`, `.vsexp`, `.bytable*`).
- **Qué es:** una sola pantalla, `/ranking`, con:
  - Clasificación: ELO o ELO de mesa, pico, partidas, victorias, vs. esperado, posición relativa, forma y últimos 12.
  - Evolución del ELO, con rango de fechas y jugadores resaltados.
  - Por tamaño de mesa de un jugador.
  - Cara a cara, con matriz y rivalidades.
  - Plantel con alta y edición: hoja con nombre y color de cubo; desactivar o reactivar.
  - Filtro de mesa en la cabecera (`?mesa=`).
- **Datos:** todo existe en el backend:
  - `GET /ranking?player_count&from`, con `equity` por fila.
  - `GET /elo/history`.
  - `GET /stats/head-to-head`.
  - `GET /players/{id}/insights` para `by_table`.
  - `GET /players/`, `POST /players/` (409 si el color está tomado) y `PATCH /players/{id}`.
- **Rutas:** `/jugadores` (lista vieja) redirige a `/ranking`; el plantel vive en el ranking, como en el mockup.
- **Piezas compartidas con el perfil (F33):** `ui/fairness` (InfoTip, VsExpected, RelPos, ByTablePanel).
- **Comparación:** `ranking`, `ranking-mesa5`, `ranking-h2h`, `ranking-by-table`, `player-new` y `player-edit`.
