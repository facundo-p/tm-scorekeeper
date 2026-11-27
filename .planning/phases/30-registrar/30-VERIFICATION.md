# Phase 30 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Asistente de 5 pasos con borrador (SCR-05) | `Register.test.tsx` (pasos, errores, borrador tras recargar), `registerModel.test.ts`; comparación `register-1..5`, `register-errors` | ✅ |
| Teclado y modo edición con PUT (SCR-06, #33) | `tools/parity/functional/run.mjs`: registrar solo con teclado en 390 y 1440 px; `Register.test.tsx` (edición con PUT y aviso); comparación `register-edit` | ✅ |
| Desvío aceptado | `register-2` móvil: el mockup desborda el botón «Siguiente: Hitos y recompensas»; la app lo parte en dos líneas (umbral 2,5 % con motivo, D-76) | ✅ |
| Gates | `GATES_PHASE=30 gates.sh all` | ✅ |
