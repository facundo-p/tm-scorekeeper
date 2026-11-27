# 19-04 SUMMARY — Dominio, marco y galería

- `frontend/src/domain/`: `catalog.ts` (mapas, expansiones, corporaciones, categorías, materiales, íconos de récords y glifos de logros), `labels.ts` (espejo de `labels.js`, con test), `format.ts` (`fmt`, `fmtDate`, half-even) y `cssVars.ts`.
- `frontend/src/ui/frame/`: `Frame` (escenario, dispositivo con container queries, `data-scroll-root`, `#overlays`, brillo de placas; carga `styles/index.css`, D-43) y `ScreenHead`.
- `frontend/src/pages/Gallery/`: `/__galeria` con los mismos átomos y datos que `#galeria`; la ruta existe solo con `MODE === 'parity'` (el build de producción no incluye el módulo).
- Mockup: `#galeria` lisa (D-42) y `__TM_PLANET__.drawRect()` devuelve `null` si el canvas no se ve (sin planeta que enmascarar).
- Comparación: `gal-atoms` y `gal-sheet` 4/4 (máximo 0,0014 %), axe sin violaciones, juez 16/16 en las cuatro composiciones.
