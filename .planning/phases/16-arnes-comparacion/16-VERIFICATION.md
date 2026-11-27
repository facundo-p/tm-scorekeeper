# Phase 16 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Mockup contra sí mismo ≤ 0,01 % | `node tools/parity/run.mjs --self --phase 16`: 26/26 (13 escenarios × 2 viewports), 90 frames, máximo 0,000 % fuera del planeta y 0,00 % en el planeta; dos corridas seguidas idénticas | ✅ |
| Juez visual | `visual-judge` sobre 10 composiciones: 10 × 16/16, APPROVE | ✅ |
| 63 partidas cargan en < 30 s | `scripts.load_fixture` contra `tm_parity`: 1,1 s | ✅ |
| Golden de posiciones y ELO | `pytest backend/tests/golden`: 4 tests (posiciones, ELO por partida, ELO final, cantidad de partidas) | ✅ |
| Fixtures al día | `node tools/fixtures/export.mjs --check` (también en CI, job `test-tools`) | ✅ |
| Tests del arnés | `npm --prefix tools/parity test`: 14/14 | ✅ |
| pytest completo | 215 passed | ✅ |
| Candidata de punta a punta | `run.mjs --phase 16 --ids home`: tm_parity + alembic + semilla + uvicorn + vite preview; escenario no exigido (la app vieja no tiene planeta) | ✅ |
| Tamaño del PR | `pr-size.sh`: 1549 líneas (sin fixtures, tipografías ni lockfiles) | ✅ |

## Hallazgos para fases siguientes
- axe sobre el mockup (informativo en `--self`, D-22): `aria-prohibited-attr` (serious) y `label` (critical). Se corrigen en F17 en el mockup y la app no los hereda.
- Inestabilidades encontradas y resueltas: planeta en bucle (D-21), ticker (D-21), `networkidle` (D-23), rasterización sub-píxel (D-28), paralaje del cielo (D-29).
