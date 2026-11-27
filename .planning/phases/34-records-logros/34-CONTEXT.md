# Phase 34 — Récords y Logros (contexto)

- **Requisitos:** SCR-12 (récords con historia y filtros, #37) y SCR-13 (logros con vista por mesa y escalera, #44).
- **Issues:** 34.1 #136 y 34.2 #137. **Épica:** E6.
- **Referencia:** `docs/redesign/mockup/js/screens/records.js`, `achievements.js` y `css/screens.css` (secciones «Trophies»).
- **Datos:** el backend ya expone todo lo necesario.
  - `/records` y `/games/summaries` aceptan mesa, mapa y expansión.
  - `/stats/summary` devuelve los límites del archivo.
  - `/achievements/catalog` (con mesa) trae los poseedores y la fecha.
  - `/players/{id}/achievements` trae el progreso.
  - `/ranking` dice quiénes tienen partidas.
- **Comparación:** `records`, `records-map`, `records-expansion`, `records-mesa4`, `achievements`, `achievements-mesa3`, `achievement-sheet` y `achievements-player`.
