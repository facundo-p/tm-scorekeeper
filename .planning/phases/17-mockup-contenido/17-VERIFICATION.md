# Phase 17 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Mockup contra sí mismo | `run.mjs --self --phase 17`: 49/49 (escenarios × viewports), 181 frames, máximo 0,000 % | ✅ |
| Pantallas no tocadas idénticas | `run.mjs --self --ref mockup@750e6a2`: Ceremonia idéntica en los dos viewports. Las demás difieren solo por cambios intencionales de F17: bitácora con los récords ya oficiales (Inicio), nombres en castellano (Informe, Registrar), links reales en la navegación (árbol de accesibilidad de todas las pantallas) y «Salir» en la barra superior del móvil | ✅ |
| Golden regenerado | `node tools/fixtures/export.mjs --check` | ✅ |
| Semántica (casos borde) | `node --test tools/fixtures/*.test.mjs`: 9/9 (primera partida, quiebre único, co-poseedores, ceros, empates en el primer puesto, cerca del récord, orden del archivo) | ✅ |
| Backend | `gates.sh backend`: pytest (215) + golden de posiciones y ELO + fixtures + semántica | ✅ |
| axe sobre el mockup | sin serios ni críticos (se corrigieron `aria-prohibited-attr`, `label` y `scrollable-region-focusable`) | ✅ |
| Tamaño del PR | `pr-size.sh` < 3000 | ✅ |

## Escenarios nuevos
`login-wrong`, `gal-atoms`, `404`, `state-loading`, `state-error`, `games-sort-winner`, `games-sort-players`, `games-sort-winner-mobile`, `records-map`, `records-expansion`, `profile-facu-games`, `profile-facu-records`, `profile-facu-achievements`.
