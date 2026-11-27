# Phase 27: Efectos e instrumentos — Context

**Milestone:** v2.0 · **Épica:** E5 (#76) · **Requisitos:** FX-01..02 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F27.

## Objetivo
El planeta WebGL2 persistente del mockup (`docs/redesign/mockup/js/fx/planet.js`, `planet-shaders.js`, `ui/planet-slot.js`) y los instrumentos SVG (`js/ui/instruments.js`, `css/instruments.css`) en la app real, con la galería de instrumentos en `/__galeria?parte=instrumentos`.

## Decisiones locales
- **D-71** Partición en 27-A (planeta) y 27-B (instrumentos); motor separado en puro / WebGL, con `destroy()`.
- **D-72** Escenario `planet-parked`; fin de las exenciones de planeta del shell.

## Bordes
- Sin WebGL2 (o shaders que no compilan): `data-planet="fallback"`, los slots dibujan el globo CSS.
- Contexto WebGL perdido: el motor se detiene sin romper la pantalla.
- `prefers-reduced-motion`: imagen fija que solo se redibuja si cambia el destino (D-11).
- Pestaña oculta: no anima.
- Varios slots: manda el último montado y visible; sin slot, el planeta se estaciona abajo a la derecha.
- Desmontar el marco: se cancela el `requestAnimationFrame` y se sueltan los listeners.
