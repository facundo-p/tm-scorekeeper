# Phase 16: Arnés de comparación, fixtures y golden — Context

**Milestone:** v2.0 · **Épica:** E1 (#72) · **Requisitos:** PAR-01..05 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F16.

## Objetivo
Tener la vara de medir antes de tocar pantallas: el arnés visual/estructural (`tools/parity/`), la semilla y el golden exportados del mockup (`tools/fixtures/`, `fixtures/`), el cargador de la semilla en el backend y los tests golden.

## Decisiones locales
- D-21: congelado del planeta y del ticker bajo reduced-motion y gancho `__TM_PLANET__` adelantados desde F17.3 (sin ellos el mockup no coincide consigo mismo).
- D-22..D-27: axe solo en modo candidata; red en reposo con contador propio; golden sin `tied` hasta F21; clave `tm_token`; subconjuntos de tipografías; `--self` hasta F18.
- El golden se genera con `buildModel({ playerCount })`: el filtro de mesa del mockup se adelanta en su forma mínima (filtrar partidas antes de derivar) para poder exportar el golden por mesa; la UI del filtro llega en F18.
- `derive.js` redondea half-even (D-06) con `js/data/round.js`; la semilla (`seed.js`) no cambia.
- Las tipografías OFL quedan en `frontend/public/fonts/` desde ya (D-12): las usa la referencia del arnés y después la app (F19).
