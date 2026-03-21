# Requirements: Records UI Redesign

**Defined:** 2026-03-21
**Core Value:** Los records deben comunicar de un vistazo quién tiene cada logro, con identidad visual clara por record.

## v1 Requirements

### Backend

- [ ] **BACK-01**: Agregar campo `emoji` al modelo `RecordEntry` y schemas relacionados
- [ ] **BACK-02**: Poblar `emoji` en cada record calculator existente
- [ ] **BACK-03**: Asegurar que `title` y `emoji` se serialicen en todos los endpoints de records

### Frontend Types

- [ ] **TYPE-01**: Agregar campos `title` y `emoji` a `RecordResultDTO`, `RecordComparisonDTO` y `GlobalRecordDTO`

### RecordStandingCard

- [ ] **CARD-01**: Título custom + emoji como hero del card (bold, color accent)
- [ ] **CARD-02**: Atributos (jugador, fecha) en una línea separados por `·`, font grande, color principal
- [ ] **CARD-03**: Descripción + valor numérico al pie, font pequeño, color muted

### RecordComparisonCard

- [ ] **COMP-01**: Aplicar misma jerarquía visual que StandingCard (título+emoji hero, atributos protagonistas)
- [ ] **COMP-02**: Mantener diferenciación achieved/not-achieved con estilos consistentes
- [ ] **COMP-03**: Mostrar comparación (nuevo vs anterior) con layout limpio

### Consistencia

- [ ] **CONS-01**: Layout uniforme entre StandingCard y ComparisonCard (misma jerarquía, mismos tamaños de font)

## v2 Requirements

### Mejoras futuras

- **FUTURE-01**: Animación sutil al mostrar records superados
- **FUTURE-02**: Agrupación de records por categoría

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nuevas métricas (rankings, ELO, tendencias) | Milestone futuro |
| Gráficos o visualizaciones | Milestone futuro |
| Cambios en sistema de auth | No es el foco |
| Cambios en carga de partidas | No es el foco |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BACK-01 | — | Pending |
| BACK-02 | — | Pending |
| BACK-03 | — | Pending |
| TYPE-01 | — | Pending |
| CARD-01 | — | Pending |
| CARD-02 | — | Pending |
| CARD-03 | — | Pending |
| COMP-01 | — | Pending |
| COMP-02 | — | Pending |
| COMP-03 | — | Pending |
| CONS-01 | — | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 0
- Unmapped: 11 ⚠️

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after initial definition*
