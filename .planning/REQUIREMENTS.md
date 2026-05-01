# Requirements: Terraforming Mars Stats — v1.1 Visualización de ELO en Frontend

**Defined:** 2026-04-28
**Core Value:** Hacer visible el sistema ELO ya existente en backend, comunicando rating actual, evolución por partida, y comparativas históricas entre jugadores.

## v1.1 Requirements

Requirements for this milestone. Each maps to a roadmap phase. Backend ELO ya está implementado y mergeado vía PR #42 — esta entrega es principalmente de frontend con un único endpoint adicional.

### ELO Backend API

- [x] **ELO-API-01**: API expone `GET /elo/history` con filtros opcionales `from` (fecha) y `player_ids` (lista), devolviendo serie temporal de ELO por jugador para alimentar el chart de Ranking

### PlayerProfile

- [ ] **PROF-01**: Usuario ve el ELO actual del jugador en su perfil
- [ ] **PROF-02**: Usuario ve la delta de ELO de la última partida del jugador (ej: `1523 (+23)`, color verde/rojo según signo)
- [ ] **PROF-03**: Usuario ve el peak rating histórico del jugador
- [ ] **PROF-04**: Usuario ve el ranking del jugador entre todos los jugadores (ej: `#3 de 8`)

### End-of-game

- [ ] **POST-01**: Al terminar una partida, el modal post-partida (refactor unificado) muestra una sección con records desbloqueados, achievements desbloqueados, y cambios de ELO en una sola pantalla
- [ ] **POST-02**: La sección de ELO en el modal post-partida lista a cada jugador de la partida con su ELO anterior, ELO nuevo, y delta visualmente codificada (color por signo)
- [ ] **POST-03**: Junto al delta de cada jugador se muestra la posición que ocupó en la partida (1°, 2°, 3°, …) que disparó ese cambio

### Ranking page

- [ ] **RANK-01**: Usuario accede a una sección "Ranking" desde la navegación principal (`/ranking`)
- [ ] **RANK-02**: Ranking page muestra un line chart con la evolución de ELO en el tiempo, una línea por jugador, paleta determinística por player ID
- [ ] **RANK-03**: Ranking page incluye un selector multi-jugador con default = todos los jugadores activos
- [ ] **RANK-04**: Ranking page incluye un filtro de fecha "desde" (input nativo `type=date`) que acota el rango del chart
- [ ] **RANK-05**: Bajo el chart hay una tabla leaderboard con columnas Posición, Jugador, ELO actual, Última delta — ordenada por ELO descendente
- [ ] **RANK-06**: El estado de filtros (jugadores seleccionados + fecha desde) se persiste en URL search params (`?players=...&from=...`) para que la vista sea compartible y sobreviva reload; IDs inválidos en URL se filtran contra jugadores activos

## v2 / Future Requirements

Deferred — no entran en v1.1.

### Ranking enhancements

- **RANK-FUT-01**: Presets de rango temporal (Todo / 6 meses / 30 días) además del input de fecha
- **RANK-FUT-02**: Tabla data-fallback accesible para screen readers (a11y)
- **RANK-FUT-03**: Click-en-línea para resaltar un jugador (focus mode)
- **RANK-FUT-04**: Eje X conmutable entre fecha y game-index

### Profile enhancements

- **PROF-FUT-01**: Mini-sparkline del ELO en el perfil
- **PROF-FUT-02**: Banda de incertidumbre (Glicko-2) si se migra el sistema de rating

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cambio de fórmula ELO | Backend decidió implementación; no se toca en este milestone |
| Glicko-2 / TrueSkill / sistemas alternativos | Mayor complejidad, no aporta al uso casual entre amigos |
| Real-time updates del Ranking | No hay multi-cliente concurrente; refresh on navigation alcanza |
| Brush/zoom en chart | Multi-jugador + filtro de fecha cubre el caso de uso |
| Notificaciones por cambio de ELO | Out of scope a nivel proyecto |
| Predicciones de ELO futuro | Especulativo, no aporta valor |
| Tier names visuales (Bronze/Silver/Gold) | Anti-feature del estilo "chess.com" — no encaja con el tono casual del proyecto |
| Stacked-area / radar / scatter del ELO | Line chart es la convención y alcanza |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ELO-API-01 | Phase 8 | Complete |
| PROF-01 | Phase 9 | Pending |
| PROF-02 | Phase 9 | Pending |
| PROF-03 | Phase 9 | Pending |
| PROF-04 | Phase 9 | Pending |
| POST-01 | Phase 10 | Pending |
| POST-02 | Phase 10 | Pending |
| POST-03 | Phase 10 | Pending |
| RANK-01 | Phase 11 | Pending |
| RANK-02 | Phase 12 | Pending |
| RANK-03 | Phase 11 | Pending |
| RANK-04 | Phase 11 | Pending |
| RANK-05 | Phase 12 | Pending |
| RANK-06 | Phase 11 | Pending |

**Coverage:**
- v1.1 requirements: 14 total
- Mapped to phases: 14 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-04-28 — roadmap mapped all 14 requirements to phases 8-12*
