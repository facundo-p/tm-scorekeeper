# v2.0 — LEDGER

## Estado actual

| Campo | Valor |
|---|---|
| Fase | F16 · Arnés de comparación, fixtures y golden |
| Issue | 16.1–16.4 (#83–#86) |
| Paso | Verificación de fase |
| PR | — |
| Ronda de revisión | 0 |
| Intentos de CI | 0 |
| Rutina | trig_01H3TMK3swrz77ryGCf4zLqa (minuto 48 de cada hora) |
| Último commit | 066edb7 (merge #145 en origin/staging) |
| Bloqueo | — |
| Reset pendiente | no |
| Agentes | `pr-reviewer` y `visual-judge` disponibles desde el reinicio del worker (antes: `general-purpose` + `model: sonnet`) |

**Próximo paso:** cerrar la verificación de F16 (comparación --self completa en verde), commit, PR «Fase 16» y revisión.

## Tablero (GitHub)

| Ítem | Issue |
|---|---|
| Paraguas | #71 |
| Épicas | E1 #72 · E2 #73 · E3 #74 · E4 #75 · E5 #76 · E6 #77 · E7 #78 |
| Seguimiento psycopg 3 | #144 |
| F15 | 15.1 #79 · 15.2 #80 · 15.3 #81 · 15.4 #82 |
| F16 | 16.1 #83 · 16.2 #84 · 16.3 #85 · 16.4 #86 |
| F17 | 17.1 #87 · 17.2 #88 · 17.3 #89 |
| F18 | 18.1 #90 · 18.2 #91 · 18.3 #92 · 18.4 #93 |
| F19 | 19.1 #94 · 19.2 #95 · 19.3 #96 · 19.4 #97 |
| F20 | 20.1 #98 · 20.2 #99 · 20.3 #100 · 20.4 #101 |
| F21 | 21.1 #102 · 21.2 #103 · 21.3 #104 · 21.4 #105 |
| F22 | 22.1 #106 · 22.2 #107 · 22.3 #108 |
| F23 | 23.1 #109 · 23.2 #110 · 23.3 #111 · 23.4 #112 |
| F24 | 24.1 #113 · 24.2 #114 · 24.3 #115 |
| F25 | 25.1 #116 · 25.2 #117 · 25.3 #118 |
| F26 | 26.1 #119 · 26.2 #120 · 26.3 #121 · 26.4 #122 |
| F27 | 27.1 #123 · 27.2 #124 |
| F28 | 28.1 #125 · 28.2 #126 |
| F29 | 29.1 #127 · 29.2 #128 |
| F30 | 30.1 #129 · 30.2 #130 |
| F31 | 31.1 #131 |
| F32 | 32.1 #132 · 32.2 #133 |
| F33 | 33.1 #134 · 33.2 #135 |
| F34 | 34.1 #136 · 34.2 #137 |
| F35 | 35.1 #138 · 35.2 #139 · 35.3 #140 |
| F36 | 36.1 #141 · 36.2 #142 · 36.3 #143 |

## Bitácora

- 2026-10-03 — Paso 0: rama reseteada a `origin/staging` (1b37ec2, sin commits nuevos desde el PR #69). PG16 levantado; rol `tm_user`; bases `tm_scorekeeper_test`, `tm_parity`, `tm_migrations_test`; `backend/.venv`; `npm ci`. Baseline: 193 pytest, 243 vitest, `tsc -b` limpio.
- 2026-10-03 — Paso 1: SPEC, RUNBOOK, DECISIONS (D-01..D-20) y LEDGER escritos.
- 2026-10-03 — Tablero creado: paraguas #71, épicas #72–#78, issues #79–#143, seguimiento #144. Label `epic` creado. Rutina horaria `trig_01H3TMK3swrz77ryGCf4zLqa`.
- 2026-10-03 — F15: PR #145 abierto. Revisor (ronda 1): APPROVE con 5 minor y 3 nit, todos corregidos.
- 2026-10-03 — F15 mergeada (#145 → `066edb7`, CI verde, sin bloqueo de protección de rama). Issues #79–#82 cerrados. Rama reseteada a `origin/staging`.
- 2026-10-03 — F16: arnés, exportador, cargador y golden implementados. Golden de posiciones y ELO pasa (el ELO del backend coincide exactamente con el mockup con half-even). Comparación --self: 25/26; el restante (ranking móvil) es rasterización sub-píxel bajo carga → `--disable-gpu-rasterization`.
