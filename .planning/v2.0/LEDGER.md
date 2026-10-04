# v2.0 — LEDGER

## Estado actual

| Campo | Valor |
|---|---|
| Fase | F26 · Shell, rutas, datos y filtro de mesa |
| Issue | 26.x (#119–#122) |
| Paso | Planificación |
| PR | — |
| Ronda de revisión | 0 |
| Intentos de CI | 0 |
| Rutina | trig_01H3TMK3swrz77ryGCf4zLqa (minuto 48 de cada hora) |
| Último commit | d29d100 (merge #159 en origin/staging) |
| Bloqueo | — |
| Reset pendiente | no |
| Agentes | `pr-reviewer` y `visual-judge` disponibles desde el reinicio del worker (antes: `general-purpose` + `model: sonnet`) |

**Próximo paso:** F26 — shell del frontend nuevo (rutas, capa de datos contra la API v2, filtro de mesa) según SPEC § F26; primera comparación con la candidata real.

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
- 2026-10-03 — F16 verificada: --self 26/26 (90 frames, 0 %) dos veces; juez 10×16/16; golden OK; 215 pytest; 14 tests del arnés.
- 2026-10-03 — F16 mergeada (#146 → `750e6a2`; revisión: ronda 1 CHANGES_REQUESTED por la validación de la base de la candidata, ronda 2 APPROVE). Issues #83–#86 cerrados.
- 2026-10-03 — F17 implementada: SEMANTICS.md, semántica de récords/logros en derive.js con 9 tests en Node, contenido (oficiales, castellano, #65, #66, #37, login, 404, salir en móvil), ganchos (links reales, query en el hash, reloj, galería).
- 2026-10-03 — F17 mergeada (#147 → `b630a3d`; revisión: ronda 1 CHANGES_REQUESTED con 3 major de semántica/orden, ronda 2 APPROVE). Issues #87–#89 cerrados.
- 2026-10-03 — F18 implementada: filtro de mesa (`mesa.js`), equidad y «Por tamaño de mesa» (`fairness.js`), carrera de temporada por promedio con categorías y campeón D-15, Editar/Eliminar desde el informe. `--self --phase 18`: 73/73 (273 frames, 0 %, 1 reintento). Artifact republicado (versión 4).
- 2026-10-03 — F18 mergeada (#148 → `5cd15e9`; revisión: ronda 1 APPROVE con 2 minor y 1 nit, corregidos). Issues #90–#93 cerrados. Rama reseteada a `origin/staging`.
- 2026-10-03 — F19 implementada: ESLint + D-09 en CI, estilos e íconos, dominio, átomos, hoja, estados, marco y `/__galeria`. Galería contra el mockup 4/4 (máx. 0,0014 %), juez 16/16, mockup contra sí mismo 77/77. Supera 3000 líneas: se parte en 19-A y 19-B (D-47).
- 2026-10-03 — F19-A mergeada (#149 → `45cff88`; revisión: ronda 1 CHANGES_REQUESTED por el teclado de las tarjetas, ronda 2 APPROVE). Issues #94 y #95 cerrados. Rama reseteada y 19-B rearmada encima (galería 4/4 otra vez).
- 2026-10-03 — F19-B mergeada (#150 → `f9fdf4a`; revisión: ronda 1 APPROVE con 4 minor y 1 nit: 4 corregidos, 1 se mantiene por paridad del árbol de accesibilidad). Issues #96 y #97 cerrados. F19 completa. Rama reseteada a `origin/staging`.
- 2026-10-03 — F20 implementada: login real (PBKDF2, JWT, bloqueo por IP, fail-closed), `require_auth` en toda la API, cliente con Bearer y logout ante 401, validación compartida con reglas por mapa, UNIQUE de resultados (destapó un bug del update del repositorio), `POST /admin/recompute`. Gates verdes (pytest 275, vitest 305).
- 2026-10-03 — F20 mergeada (#151 → `45a9283`; revisión: ronda 1 CHANGES_REQUESTED por la IP del limitador falsificable con X-Forwarded-For, ronda 2 APPROVE). Issues #98–#101 cerrados. Rama reseteada a `origin/staging`.
- 2026-10-03 — F21 implementada: unidad de trabajo con advisory lock, UNIQUE del historial de ELO, `created_at` y orden canónico, `selectinload` e índices, co-ganadores y `tied` de grupo, récords con todos los poseedores, Spacefarer, 404 y job de migraciones. Gates verdes (pytest 306, vitest 305). Artifact republicado (versión 6).
- 2026-10-03 — F21 mergeada (#152 → `b7f86c9`; revisión: ronda 1 APPROVE con 1 minor y 3 nit, todos corregidos). Issues #102–#105 cerrados. Rama reseteada a `origin/staging`.
- 2026-10-03 — F22 mergeada (#153 → `245e02e`; revisión: ronda 1 APPROVE con 3 minor y 2 nit: 4 corregidos, el tipo del frontend queda para F28). Golden de récords y ELO de mesa en 5 alcances; pytest 344. Issues #106–#108 cerrados. Rama reseteada a `origin/staging`.
- 2026-10-04 — F23 partida en A/B/C (D-63). F23-A mergeada (#154 → `7ce7147`; revisión: ronda 1 APPROVE con 4 minor y 2 nit, corregidos salvo el camelCase de métricas, que espeja el catálogo). Rama reseteada; 23-B encima.
- 2026-10-04 — F23-B mergeada (#155 → `c47759c`; revisión: ronda 1 APPROVE con 4 minor y 2 nit, corregidos). Issues #109, #110, #112 cerrados. Rama reseteada; 23-C encima.
- 2026-10-04 — F23-C mergeada (#156 → `7ceb5b0`; revisión: ronda 1 APPROVE con 2 minor y 1 nit de docs, corregidos). Issue #111 cerrado. F23 completa. Rama reseteada a `origin/staging`.
- 2026-10-04 — F24 mergeada (#157 → `a419b35`; revisión: ronda 1 CHANGES_REQUESTED por la carrera de colores (500) y la falta de tests de la migración, ronda 2 APPROVE con 1 nit no aplicado: el único `IntegrityError` posible en ese bloque es el del índice de colores). Golden de `summaries` y `reports` agregado al exportador. Issues #113–#115 cerrados. Rama reseteada.
- 2026-10-04 — F25-A mergeada (#158 → `67e64bc`; revisión: ronda 1 APPROVE con 2 minor y 2 nit: tests de bordes y rivales sin lambdas; el desempate por primera partida rompía el golden y queda por id). Issue #116 cerrado. Rama reseteada; 25-B encima.
- 2026-10-04 — F25-B mergeada (#159 → `d29d100`; revisión: ronda 1 APPROVE con 3 minor y 1 nit, corregidos). 25-C (temporadas y bitácora) encima; golden completo habilitado (todas las claves en 5 alcances, informe en todas las partidas). Latencias locales p95 ≤ 79 ms.
