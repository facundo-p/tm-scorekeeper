# Phase 33 — Perfil (contexto)

- **Requisitos:** SCR-10 (cabecera, lecturas y favoritos: #66, #35, #38), SCR-11 (pestañas con filtro, por mesa y equidad).
- **Issues:** 33.1 #134, 33.2 #135. **Épica:** E6.
- **Referencia:** `docs/redesign/mockup/js/screens/profile.js` y `css/screens.css` (sección «Player profile»).
- **Qué es:** `/jugadores/:id` con dos partes.
  - **Expediente:** cubo 3D, arquetipo, alta, ELO, lecturas, corporación favorita, hito y recompensa favoritos.
  - **Pestañas (`?tab=`):** resumen, partidas, récords y logros.
  - **Filtro de mesa (`?mesa=`):** todo sale de esas partidas.
- **Datos:**
  - `GET /players/{id}/insights`, que en esta fase suma `elo_series` e `history`.
  - `GET /stats/summary` (composición del grupo), `GET /players/{id}/achievements`, `GET /achievements/catalog`, `GET /records` y `GET /players/`.
- **Comparación:** `profile-{facu,juli,pato}-summary`, `profile-facu-{games,records,achievements}` y `profile-facu-mesa3`.
