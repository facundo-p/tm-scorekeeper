# Roadmap: Records UI Redesign

## Overview

El rediseno de la UI de records ocurre en dos fases naturales: primero establecer el contrato de datos completo (campo emoji en backend y tipos sincronizados en frontend), luego aplicar la nueva jerarquía visual en ambos componentes de cards. La Fase 1 desbloquea la Fase 2 — no se puede mostrar emoji ni título hasta que el dato fluya de punta a punta.

## Phases

- [ ] **Phase 1: Data Pipeline** - Agregar campo `emoji` al backend y sincronizar tipos del frontend
- [ ] **Phase 2: Visual Redesign** - Redisenar RecordStandingCard y RecordComparisonCard con nueva jerarquía visual

## Phase Details

### Phase 1: Data Pipeline
**Goal**: El campo `emoji` existe en el backend y ambos tipos de DTO del frontend exponen `title` y `emoji`
**Depends on**: Nothing (first phase)
**Requirements**: BACK-01, BACK-02, BACK-03, TYPE-01
**Success Criteria** (what must be TRUE):
  1. Los endpoints de records devuelven `title` y `emoji` en cada record entry
  2. Todos los record calculators tienen un emoji asignado (no null/vacío)
  3. Los tipos TypeScript `RecordResultDTO`, `RecordComparisonDTO` y `GlobalRecordDTO` incluyen `title` y `emoji`
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Agregar campo emoji a modelos de dominio y schemas Pydantic (BACK-01, BACK-03)
- [ ] 01-02-PLAN.md — Poblar emoji en los 9 record calculators existentes (BACK-02)
- [ ] 01-03-PLAN.md — Sincronizar tipos TypeScript del frontend con los DTOs del backend (TYPE-01)

### Phase 2: Visual Redesign
**Goal**: Los cards de records muestran título+emoji como hero, atributos en una línea, y descripción+valor al pie — con layout uniforme entre StandingCard y ComparisonCard
**Depends on**: Phase 1
**Requirements**: CARD-01, CARD-02, CARD-03, COMP-01, COMP-02, COMP-03, CONS-01
**Success Criteria** (what must be TRUE):
  1. El título custom y emoji aparecen en la parte superior del card, en bold con color accent, como elemento más prominente
  2. Jugador y fecha se muestran en una sola línea separados por `·`, con font grande y color principal
  3. La descripción del record y el valor numérico aparecen al pie del card en font pequeño y color muted
  4. RecordComparisonCard sigue la misma jerarquía visual que RecordStandingCard, manteniendo diferenciación achieved/not-achieved
  5. El layout es visualmente uniforme al comparar cualquier StandingCard con cualquier ComparisonCard en pantalla
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Pipeline | 0/3 | Not started | - |
| 2. Visual Redesign | 0/? | Not started | - |
