# Phase 35 — Limpieza y presupuestos (contexto)

- **Requisitos:** CLOSE-01 (se borra el frontend viejo), CLOSE-02 (se retira la API deprecada) y CLOSE-03 (presupuestos).
- **Issues:** 35.1 #138, 35.2 #139 y 35.3 #140. **Épica:** E7.
- **Punto de partida:** desde F34 ninguna ruta usa la app vieja.
  - Sin rutas: `pages/**`, `components/**`, `hooks/**`, `types/`, `utils/`, `constants/`, `api/{achievements,elo,games,players,records}.ts`, el envoltorio `shell/Legacy` y `src/index.css` (tokens `--color-*` y reset de `[data-legacy]`).
  - Sus tests (`test/components`, `test/hooks`, `test/unit`) y el e2e de Playwright (`test/e2e`, que recorría la app vieja) quedaron sin objeto.
  - Siguen en uso:
    - la galería de comparación (`pages/Gallery`, pasa a `screens/Gallery`);
    - `components/ProtectedRoute`, que pasa a `shell/ProtectedRoute`;
    - `api/{http,client,auth}.ts` y `context/`.
- **Tamaño:** 35.1 son unas 9500 líneas, casi todas borradas, y se parte en cuatro PR (D-81).
