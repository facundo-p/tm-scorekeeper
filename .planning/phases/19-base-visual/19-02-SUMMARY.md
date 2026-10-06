# 19-02 SUMMARY — Tokens, base, tipografías e íconos

- `frontend/src/styles/{tokens,base}.css`: port literal del mockup; `index.css` los reúne con `fonts.css` e `icons.css` (lo carga el marco nuevo, D-43).
- `frontend/src/styles/fonts.css`: única declaración de las tipografías (antes `public/fonts/fonts.css`); el arnés la sirve al mockup en lugar de Google Fonts (`FONTS_CSS` en `tools/parity/config.mjs`).
- `frontend/src/ui/icons/`: `glyphs.ts` (datos de `icons.js`), `Icon` y `MapGlyph`, `icons.css` con las clases globales del SVG (D-44).
- D-46: el mockup tenía dos claves `table` en el set de íconos; la medalla «Mesa completa» pasa a `fullTable`.
- Tests: `src/test/ui/Icon.test.tsx` (accesibilidad, ícono desconocido, D-46, MapGlyph).
