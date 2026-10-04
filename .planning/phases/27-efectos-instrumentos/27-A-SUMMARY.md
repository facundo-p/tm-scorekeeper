# 27-A SUMMARY — Planeta WebGL2

- `fx/planet/` (D-71):
  - `shaders.ts` es copia literal del mockup, vigilada por un test de deriva.
  - `gl.ts`: programa, texturas y triángulo de pantalla.
  - `bake.ts`: horneado en 12 franjas, cortable.
  - `motion.ts`: objetivos estacionado/slot y suavizado. Es puro y tiene tests.
  - `drag.ts`: arrastre con inercia.
  - `stage.ts`: el motor, en un chunk aparte (~25 kB). Tiene `destroy()`, respaldo cuando no hay WebGL2 o falla la compilación, reduced-motion como imagen fija, pausa con la pestaña oculta, contexto perdido y ganchos `__TM_PLANET__` para el arnés.
- `PlanetProvider` (en `routes.tsx`), `PlanetCanvas` (en la capa `.fx` del shell) y `PlanetSlot` (con el globo CSS de respaldo).
- `fx/confetti.ts`: port del estallido, con piezas y avance testeables.
- Arnés:
  - Se quitan las exenciones de planeta de `404`, `state-loading` y `state-error`.
  - Nuevo escenario `planet-parked` (D-72).
- Tests: `planetShaders`, `planetMotion`, `PlanetSlot` y `confetti` (15).
