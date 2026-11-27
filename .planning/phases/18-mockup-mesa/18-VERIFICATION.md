# Phase 18 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Mockup contra sí mismo | `run.mjs --self --phase 18`: 73/73, 273 frames, máximo 0,000 %; un escenario (`register-edit` escritorio) pasó en el reintento (planeta no presentado a tiempo en el primer intento, D-40) | ✅ |
| Filtro de mesa por pantalla | escenarios `home-race-mesa3`, `games-mesa3`, `ranking-mesa5`, `profile-facu-mesa3`, `records-mesa4`, `achievements-mesa3` | ✅ |
| Temporada por promedio | `home-race-cat`, `season-rules`; tests en Node de la carrera y del campeón D-15 | ✅ |
| Corrección de partidas | `report-delete`, `register-edit` | ✅ |
| Semántica | `node --test tools/fixtures/*.test.mjs`: 17/17 (equidad, ELO de mesa desde 1000, carrera, desempates D-15, Turmoil) | ✅ |
| Golden regenerado | `export.mjs --check` | ✅ |
| Capturas y docs | 22 capturas regeneradas (`tools/parity/capture-docs.mjs`); README del rediseño y SEMANTICS al día | ✅ |
| Artifact | republicado en https://claude.ai/artifact/Mmov1ofG8XcAMN9tKA5Zf6 | ✅ |
| Tamaño del PR | `pr-size.sh` < 3000 (sin capturas ni fixtures) | ✅ |
