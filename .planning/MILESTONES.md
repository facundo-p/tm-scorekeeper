# Milestones

## v1.0 Sistema de Logros (Shipped: 2026-04-02)

**Phases completed:** 4 phases, 8 plans

**Key accomplishments:**

- 4 achievement evaluator types (SingleGameThreshold, Accumulated, WinStreak, AllMaps) and **12 evaluator definitions** registered in `ALL_EVALUATORS` (high_score, games_played, games_won, win_streak, greenery_tiles, all_maps, milestone_master, no_milestone_win, award_master, no_award_win, stolen_awards, card_points)
- Persistence layer with atomic upsert (no-tier-downgrade enforced at DB level via `ON CONFLICT DO UPDATE`)
- 3 achievement REST endpoints wired to `AchievementsService` (POST evaluate-for-game, GET player achievements, GET catalog with holders) plus 8 TypeScript interfaces and `useGames.fetchAchievements` retry hook
- Frontend: post-game `AchievementModal`, profile tab with `AchievementCard`, `AchievementCatalog` page, `AchievementIcon` with Lucide fallback
- Reconciliation tool (POST /achievements/reconcile) for backfill and consistency repair

For details: [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

---

## v1.0-cleanup Post-ship cleanup (Shipped: 2026-04-28)

**Phases completed:** 3 phases, 7 plans (continuation of v1.0; closes audit gaps)

**Key accomplishments:**

- Closed all v1.0-MILESTONE-AUDIT.md gaps: 1 high (INT-01 singleton), 2 medium (INT-02/FLOW-01 retry contract), 4 low-severity drifts, 3 cross-cutting tech_debt items
- `AchievementsService` centralized as singleton in `services/container.py`; 3 routers refactored to consume it (closes the project-rule violation `feedback_container_per_layer`)
- Phase 02 D-09/D-10 retry contract restored to live UI path: `GameRecords.tsx` consumes `useGames.fetchAchievements` with `if (!data) return` guard; 9 new vitest cases lock the contract
- Dead-code removed: `AchievementCatalogItemDTO.title` (was duplicate of description), `AchievementBadgeMini.is_upgrade` and `AchievementCard.max_tier` (declared but never used)
- Documentation reconciled: 8 v1.0 SUMMARYs now carry standardized top-level `requirements:` / `requirements-completed:` frontmatter; "5 evaluators" drift corrected to actual 12
- Zero behavior changes for end users — DI cleanup + dead code removal + doc reconciliation

For details: [v1.0-cleanup-ROADMAP.md](milestones/v1.0-cleanup-ROADMAP.md)

---

## v2.0 Archivo de Terraformación (Shipped to staging: 2026-10-04)

**Phases completed:** 22 phases (F15–F36), 33 PRs a `staging` (#145–#177). La promoción a `main` la hace el dueño con [`docs/deploy/v2.0-checklist.md`](../docs/deploy/v2.0-checklist.md).

**Key accomplishments:**

- **Mockup como especificación (E2):**
  - semántica (`docs/redesign/SEMANTICS.md`);
  - mesa, equidad y temporadas por promedio;
  - semilla y golden exportados del mockup.
- **Seguridad e integridad (E3):**
  - login real con token y bloqueo por IP;
  - validación compartida;
  - transacciones con lock y orden canónico;
  - ≤ 3 consultas por pantalla;
  - empates para todo el grupo.
- **Estadísticas derivadas (E4):**
  - ELO de mesa;
  - 16 récords con historia;
  - 18 logros derivados con recálculo transaccional;
  - ficha del jugador, ranking con equidad, cara a cara, temporadas y bitácora;
  - todo comparado contra el golden.
- **Frontend nuevo (E5, E6):**
  - sistema visual en CSS Modules, shell y planeta WebGL2 persistente;
  - instrumentos SVG;
  - las 11 pantallas del mockup con datos reales: Acceso, Inicio, Partidas, Informe, Registrar, Ceremonia, Ranking, Perfil, Récords, Logros y 404;
  - editar y eliminar con recálculo en cascada.
- **Verificación (E1):**
  - arnés de comparación contra el mockup: 104/104 capturas, con [reporte](https://claude.ai/artifact/46LGuw3x57LcKW6TPrpC5M);
  - 16 recorridos funcionales;
  - golden del backend en 5 alcances;
  - presupuesto del bundle en CI (82,5 kB de JS inicial).
- **Cierre (E7):**
  - se borró el frontend v1, más recharts y lucide;
  - se retiró la API deprecada (D-82);
  - READMEs, checklist de despliegue y auditoría.

For details: [v2.0-MILESTONE-AUDIT.md](v2.0-MILESTONE-AUDIT.md), [v2.0/SPEC.md](v2.0/SPEC.md), [v2.0/DECISIONS.md](v2.0/DECISIONS.md)
