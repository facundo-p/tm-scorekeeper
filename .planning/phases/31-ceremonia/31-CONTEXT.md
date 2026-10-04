# Phase 31 — Ceremonia (contexto)

- **Requisito:** SCR-07 · **Issue:** 31.1 #131 · **Épica:** E6
- **Referencia:** `docs/redesign/mockup/js/screens/ceremony.js` y `css/screens.css` (`.cer*`, `.tally*`).
- **Qué es:** marco desnudo (sin rail ni dock, como el acceso) en `/partidas/:id/ceremonia`, protegido. Una sola secuencia: se suma categoría por categoría y las filas se reordenan; después llegan el ganador con confetti, el ELO, los récords y los logros, y al final las acciones «Ver informe completo» y «Volver al inicio».
- **Entradas:** guardar una partida nueva en Registrar (F30) y «Repetir ceremonia» en el informe (F29).
- **Datos:** `GET /games/{id}/report` (resultados, ELO, récords rotos, logros) y `GET /players/` (nombre, color y orden de alta).
- **Movimiento:** con reduced-motion se abre en el final y el confetti no estalla. «Saltar animación» lleva al final.
- **Comparación:** `ceremony-g063` (con reduced-motion, estado final). **Funcional:** `ceremony-skip` (con movimiento: saltar y volver al informe).
