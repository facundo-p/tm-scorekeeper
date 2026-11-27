# Phase 26 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Shell con cielo, barra, rail, dock y container queries (SHELL-01) | `AppShell.test.tsx`, `Sky.test.tsx`; comparación `404` en escritorio y móvil | ✅ |
| Rutas D-02, redirecciones, lazy, 404, error boundary (SHELL-02) | `paths.test.ts`, `AppShell.test.tsx` (redirecciones, 404, error y recuperación al navegar) | ✅ |
| HTTP con Bearer, 15 s, abort y errores tipados; TanStack Query (SHELL-03) | `http.test.ts` (timeout, red, cancelación externa, detalle del servidor) | ✅ |
| `MesaFilter`, `useMesaParam`, aviso (SHELL-04) | `MesaFilter.test.tsx` (valor inválido, limpiar, aviso) | ✅ |
| Escenarios `404`, `state-loading`, `state-error` | `run.mjs --phase 26`: 0 % de píxeles distintos en escritorio y móvil, árbol de accesibilidad igual (hrefs normalizados, D-70); planeta exento hasta F27 | ✅ |
| Gates | `gates.sh all` | ✅ |
