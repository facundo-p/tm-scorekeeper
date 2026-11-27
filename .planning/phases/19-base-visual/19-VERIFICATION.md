# Phase 19 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| ESLint con regla D-09 en CI | `npm run lint` (0 avisos) en el job `test-frontend`; tests de la regla con la API de ESLint (atributo y spread literal) | ✅ |
| Estilos, tipografías e íconos | `src/styles/{tokens,base,fonts}.css`, `src/ui/icons`; tests de `Icon`/`MapGlyph` | ✅ |
| Átomos, hoja y estados | `src/ui/{atoms,sheet,states}`; `vitest`: 295/295 (átomos, foco atrapado, Escape, fondo, teclado de pestañas, campos, estados) | ✅ |
| Dominio | `src/domain/{catalog,labels,format,cssVars}.ts`; `labels.ts` comparado con `labels.js` del mockup | ✅ |
| Galería solo en modo parity | build de producción sin el módulo de la galería; `dist-parity` con `Gallery-*.js` | ✅ |
| Comparación (`gal-atoms`, `gal-sheet`) | `run.mjs --phase 19 --screens galeria`: 4/4, máximo 0,0014 %, axe sin violaciones, árbol de accesibilidad igual | ✅ |
| Juez visual | 16/16 en las cuatro composiciones | ✅ |
| Mockup contra sí mismo | `run.mjs --self --phase 19`: 77/77, sin reintentos | ✅ |
| Gates | `gates.sh all`: pytest, fixtures, semántica, lint, typecheck, vitest, build | ✅ |
| Tamaño | 19-A: 1445 líneas; 19-B: 2473 líneas (D-47) | ✅ |
| Revisión 19-A | ronda 1 CHANGES_REQUESTED (teclado de tarjetas), ronda 2 APPROVE | ✅ |
