---
phase: 06-drifts-y-polish
plan: 02
subsystem: frontend-components
tags: [refactor, dead-code, drift, props-cleanup]
requirements: [ENDG-02, ENDG-03, PROF-02]
requirements-completed: [ENDG-02, ENDG-03, PROF-02]
gap_closure:
  - drift-AchievementBadgeMini-is_upgrade-unused-prop
  - drift-AchievementCard-max_tier-unused-prop
dependency_graph:
  requires:
    - frontend/src/components/AchievementBadgeMini/AchievementBadgeMini.tsx (existente)
    - frontend/src/components/AchievementCard/AchievementCard.tsx (existente)
    - frontend/src/components/AchievementModal/AchievementModal.tsx (existente)
    - frontend/src/pages/PlayerProfile/PlayerProfile.tsx (existente)
    - frontend/src/types/index.ts (DTOs intactos)
  provides:
    - Interfaz AchievementBadgeMiniProps minimal (sin is_upgrade)
    - Interfaz AchievementCardProps minimal (sin max_tier)
    - Tests reformulados con la regla real (data-type deriva de is_new)
  affects:
    - frontend/src/components/AchievementModal/AchievementModal.tsx
    - frontend/src/pages/PlayerProfile/PlayerProfile.tsx
tech_stack:
  added: []
  patterns:
    - Drift cleanup: eliminar props muertos sin alterar DTOs ni comportamiento visual
    - Test reformulation: alinear el nombre del caso con la regla real del componente
key_files:
  created: []
  modified:
    - frontend/src/components/AchievementBadgeMini/AchievementBadgeMini.tsx
    - frontend/src/components/AchievementCard/AchievementCard.tsx
    - frontend/src/components/AchievementModal/AchievementModal.tsx
    - frontend/src/pages/PlayerProfile/PlayerProfile.tsx
    - frontend/src/test/components/AchievementBadgeMini.test.tsx
    - frontend/src/test/components/AchievementCard.test.tsx
decisions:
  - DTOs (AchievementUnlockedDTO.is_upgrade, PlayerAchievementDTO.max_tier) se conservan intactos en types/index.ts y schemas backend; solo se eliminan los props del componente.
  - El test "uses data-type='upgrade' when is_upgrade=true" se reformula a "uses data-type='upgrade' when is_new=false" porque la verdad de fondo es que data-type deriva exclusivamente de is_new (el caso anterior pasaba por accidente al setear is_new=false al mismo tiempo que is_upgrade=true).
metrics:
  duration_minutes: 4
  completed_date: "2026-04-27"
  tasks: 3
  files_modified: 6
  files_created: 0
commits:
  - 589b02a: refactor(06-02) remove dead props is_upgrade and max_tier from component interfaces
  - 26135e2: refactor(06-02) stop passing removed props from callers
  - 7a60444: test(06-02) adapt vitest fixtures and reformulate data-type case
---

# Phase 06 Plan 02: Limpieza de props muertos (is_upgrade / max_tier) Summary

**One-liner:** Eliminados los dos props muertos (`AchievementBadgeMini.is_upgrade` y `AchievementCard.max_tier`) detectados como drift en el audit v1.0; DTOs intactos, callers limpios, suite vitest reformulada y verde (122/122).

## Objective Achieved

Cerrar los drifts de severidad **low** del audit `v1.0-MILESTONE-AUDIT.md` §4 (Phase 03):

1. `AchievementBadgeMini.is_upgrade` — declarado en la interfaz pero nunca leído. La derivación visual `data-type="new"|"upgrade"` se hace exclusivamente desde `is_new`. **Removido.**
2. `AchievementCard.max_tier` — declarado en la interfaz pero nunca destructurado ni renderizado. **Removido.**

Las DTOs (`AchievementUnlockedDTO.is_upgrade` en `frontend/src/types/index.ts:156` y `PlayerAchievementDTO.max_tier` en `frontend/src/types/index.ts:175`) **NO se tocaron** — son contrato del backend y siguen siendo legítimos como datos del response, aunque los componentes ya no los consuman.

## Tasks Completed

### Tarea 1: Limpiar interfaces de los componentes
- **Commit:** `589b02a`
- **Files:**
  - `frontend/src/components/AchievementBadgeMini/AchievementBadgeMini.tsx` — eliminada línea `is_upgrade: boolean` de la interfaz `AchievementBadgeMiniProps`. La destructuración del componente (que ya no la incluía) y el cuerpo (`badgeType = is_new ? 'new' : 'upgrade'`) quedaron intactos.
  - `frontend/src/components/AchievementCard/AchievementCard.tsx` — eliminada línea `max_tier: number` de la interfaz `AchievementCardProps`. La destructuración (que ya no la incluía) y el render (`NIVEL {unlocked ? tier : 0}`) quedaron intactos.
- **Diff:** 2 archivos, 2 líneas eliminadas, 0 añadidas.
- **Smoke check:** `grep -n "is_upgrade" AchievementBadgeMini.tsx` → 0 coincidencias; `grep -n "max_tier" AchievementCard.tsx` → 0 coincidencias.

### Tarea 2: Limpiar callers
- **Commit:** `26135e2`
- **Files:**
  - `frontend/src/components/AchievementModal/AchievementModal.tsx` — eliminada línea `is_upgrade={ach.is_upgrade}` del JSX `<AchievementBadgeMini ... />`.
  - `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` — eliminada línea `max_tier={ach.max_tier}` del JSX `<AchievementCard ... />`.
- **Diff:** 2 archivos, 2 líneas eliminadas, 0 añadidas.
- **Smoke check global:** `grep -rn "is_upgrade=\|max_tier=" frontend/src/` → 0 coincidencias en el repo entero después del cambio.
- **Verificación de exclusividad de callers:** Únicos consumidores fuera de tests:
  - `AchievementBadgeMini` ← `AchievementModal.tsx` (único caller fuera de tests)
  - `AchievementCard` ← `PlayerProfile.tsx` (único caller fuera de tests)

### Tarea 3: Adaptar tests vitest + validar typecheck/suite
- **Commit:** `7a60444`
- **Files:**
  - `frontend/src/test/components/AchievementBadgeMini.test.tsx`:
    - `baseProps` ya no incluye `is_upgrade: false`.
    - Test `'uses data-type="new" when is_new=true'`: eliminado el override `is_upgrade={false}`.
    - Test reformulado: `'uses data-type="upgrade" when is_upgrade=true'` → `'uses data-type="upgrade" when is_new=false'`. JSX simplificado a `<AchievementBadgeMini {...baseProps} is_new={false} />`. La regla expresada ahora coincide con la verdad de fondo del componente.
  - `frontend/src/test/components/AchievementCard.test.tsx`:
    - `baseProps` ya no incluye `max_tier: 5`. Ningún test asertaba sobre `max_tier`, así que no hubo otros cambios.
- **Diff:** 2 archivos, 3 líneas insertadas, 5 eliminadas.
- **Validación:**
  - `npm run typecheck` → exit 0.
  - `npm test -- --run --reporter=basic` → exit 0. **16 archivos, 122 tests, todos pasan.** AchievementBadgeMini conserva 5 casos (uno renombrado), AchievementCard conserva 10 casos.

## Validation Output Summary

```
$ cd frontend && npm run typecheck
> tsc -b
(exit 0, sin output de errores)

$ cd frontend && npm test -- --run --reporter=basic
✓ src/test/components/AchievementBadgeMini.test.tsx (5 tests) 47ms
✓ src/test/components/AchievementCard.test.tsx (10 tests) 501ms
... (16 archivos en total)
Test Files  16 passed (16)
     Tests  122 passed (122)
```

## Verification Checklist (from plan)

- [x] `! grep -n "is_upgrade" frontend/src/components/AchievementBadgeMini/AchievementBadgeMini.tsx` → 0
- [x] `! grep -n "max_tier" frontend/src/components/AchievementCard/AchievementCard.tsx` → 0
- [x] `! grep -n "is_upgrade=" frontend/src/components/AchievementModal/AchievementModal.tsx` → 0
- [x] `! grep -n "max_tier=" frontend/src/pages/PlayerProfile/PlayerProfile.tsx` → 0
- [x] `! grep -n "is_upgrade" frontend/src/test/components/AchievementBadgeMini.test.tsx` → 0
- [x] `! grep -n "max_tier" frontend/src/test/components/AchievementCard.test.tsx` → 0
- [x] `grep -q 'data-type="upgrade" when is_new=false' AchievementBadgeMini.test.tsx` → presente (línea 39)
- [x] `grep -q "is_new ? 'new' : 'upgrade'" AchievementBadgeMini.tsx` → presente (línea 17, regla intacta)
- [x] `! grep -rn "is_upgrade=\|max_tier=" frontend/src/` → 0 (cero pass-throughs en todo el árbol)
- [x] `cd frontend && npm run typecheck` → exit 0
- [x] `cd frontend && npm test -- --run` → exit 0 (122/122)

## Deviations from Plan

None — plan executed exactly como estaba escrito. La única observación: `AchievementModal.test.tsx` (línea 10-11) construye DTOs con `is_upgrade: false/true` como **datos de fixture** (no como prop pass-through al componente), por lo que el grep global todavía muestra coincidencias dentro de ese test. Eso es correcto y consistente con el plan ("DTOs intactos") — el test fabrica `AchievementUnlockedDTO`, no llama a `AchievementBadgeMini` directamente con el prop.

Mismo razonamiento aplica a `useGames.test.ts` y `GameRecords.test.tsx`, que usan `is_upgrade` como campo del DTO en sus fixtures de response.

## Authentication Gates

Ninguno — plan totalmente offline (edits + typecheck + vitest).

## Known Stubs

Ninguno introducido. Esta es una operación de **reducción** de superficie, no de adición.

## Threat Flags

Ninguno detectado fuera del threat_model del plan. Las tres entradas STRIDE (T-06-04, T-06-05, T-06-06) se mantienen como `accept` y la reducción de superficie no introduce nueva sensibilidad.

## Key Decisions Captured

1. **No se implementa el indicador de "tier máximo"** — el plan documenta explícitamente que el audit cataloga `max_tier` como drift, no como feature missing; agregarlo ahora caería fuera del scope cosmético de la Phase 6.
2. **Reformulación del test** — el caso "data-type='upgrade'" pasaba por accidente porque seteaba `is_new=false` y `is_upgrade=true` al mismo tiempo; la regla real es `is_new ? 'new' : 'upgrade'`. El test renombrado deja explícita esa regla.
3. **DTOs sin tocar** — un futuro consumidor de UI puede leer `is_upgrade`/`max_tier` del DTO sin que el backend tenga que volver a calcularlos; eliminar el campo del DTO sería breaking y el plan lo prohíbe.

## Self-Check: PASSED

- [x] `frontend/src/components/AchievementBadgeMini/AchievementBadgeMini.tsx` modificado (commit `589b02a`)
- [x] `frontend/src/components/AchievementCard/AchievementCard.tsx` modificado (commit `589b02a`)
- [x] `frontend/src/components/AchievementModal/AchievementModal.tsx` modificado (commit `26135e2`)
- [x] `frontend/src/pages/PlayerProfile/PlayerProfile.tsx` modificado (commit `26135e2`)
- [x] `frontend/src/test/components/AchievementBadgeMini.test.tsx` modificado (commit `7a60444`)
- [x] `frontend/src/test/components/AchievementCard.test.tsx` modificado (commit `7a60444`)
- [x] Commits `589b02a`, `26135e2`, `7a60444` presentes en `git log` del worktree
- [x] Ningún edit fuera de la lista `files_modified` del frontmatter del plan
- [x] DTOs `is_upgrade` (types/index.ts:156) y `max_tier` (types/index.ts:175) intactos
- [x] Typecheck exit 0
- [x] Vitest exit 0 (122/122)
