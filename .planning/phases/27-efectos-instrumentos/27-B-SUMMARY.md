# 27-B SUMMARY — Instrumentos SVG

- `ui/instruments/`, port de `mockup/js/ui/instruments.js`:
  - Termómetro, arco de O₂ y océanos (`Gauges.tsx`).
  - Pista de puntaje, leyenda y barras de puntaje con tabla.
  - Composición, sparkline y forma.
  - Gráfico de ELO, con tabla (`showTable`, D-73).
  - Matriz cara a cara, pista de TR y cambio de ELO.
  - Lo puro (gradientes, carriles, escalas, etiquetas, celdas, casilleros) está en funciones con tests (`eloChart.ts` y helpers exportados).
  - Estilos en `instruments.module.css`: `instruments.css`, más la pista de TR y el cambio de ELO de `screens.css`, más `dtable` de `components.css`. El tooltip `[data-tip]` queda global en `styles/base.css`.
- Datos:
  - `data/instruments.ts` lleva de la API a los instrumentos.
  - Hooks nuevos: `useGameReport`, `usePlayerInsights`, `useEloHistory` y `useHeadToHead`.
- Galería: `/__galeria?parte=instrumentos` usa datos de la API de la candidata; solo el orden de los jugadores es fijo (D-73).
- El reset global de la app vieja (`index.css`) queda acotado a `[data-legacy]`. Corría la matriz cara a cara 2 px, porque quitaba el padding de las celdas.
- Las tablas de datos son enfocables (`TableWrap`) para desplazarse con el teclado; el mockup tiene ese aviso de axe en móvil y la app no.
- Tests (18): `test/instruments/{pure,render,adapters}`.
