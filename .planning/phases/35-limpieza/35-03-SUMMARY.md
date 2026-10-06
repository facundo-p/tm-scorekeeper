# 35-03 SUMMARY — Presupuestos

- **Bundle (D-83):** el JS inicial pesa 82,49 kB gzip, con un máximo de 100. El motor del planeta va en un chunk aparte.
  - `tools/budgets/check-bundle.mjs` lo controla en CI y en `gates.sh`.
  - CI ahora compila el frontend.
- **axe:** la candidata no tiene violaciones serias ni críticas en ninguna escena del catálogo completo. La comparación lo exige desde F19.
- **Recorridos funcionales:** login, navegación, editar, eliminar, filtros y hoja de jugador, más registrar con el teclado y saltar la ceremonia. Son 16 en total (8 × 2 viewports).
- **Hallazgo (D-84):** la hoja de jugador ofrecía 9 colores y el backend admite 10. Con 9 activos no se podía dar de alta a nadie. Se corrigió en la app y en el mockup, con un test espejo.
- **Revisión:** APPROVE con 2 nit, los dos corregidos (`exact` en los botones de editar y mensaje claro en el test espejo).
