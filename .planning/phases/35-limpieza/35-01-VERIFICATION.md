# 35-01 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Se borra el frontend viejo, recharts, lucide y tokens viejos (CLOSE-01, #138) | `frontend/src` sin `pages/`, `components/`, `hooks/`, `types/`, `utils/`, `constants/` ni `index.css`; `package.json` sin recharts, lucide-react ni @playwright/test; `grep -- --color-` vacío | ✅ |
| El catálogo sigue alineado con el backend | `catalogEnums.test.ts` (enums) y `TestFrontendMirror` (hitos y recompensas por mapa contra `domain/catalog.ts`) | ✅ |
| Las pantallas no cambian | Comparación completa en verde en los cuatro PR (`GATES_PHASE=35`) | ✅ |
| Gates | `GATES_PHASE=35 gates.sh all` en cada PR | ✅ |
