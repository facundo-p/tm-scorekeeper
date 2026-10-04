# Phase 31 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Ceremonia con secuencia, saltar y repetir (SCR-07) | Comparación `ceremony-g063` (390 y 1440); funcional `ceremony-skip` (saltar → final → informe); `Ceremony.test.tsx`, `ceremonyModel.test.ts`; «Repetir ceremonia» en el informe (F29) | ✅ |
| Reduced-motion | `useSequence` empieza en el final y el confetti no estalla (`ceremonyModel.test.ts`, `confetti.test.ts`) | ✅ |
| Gates | `GATES_PHASE=31 gates.sh all` | ✅ |
