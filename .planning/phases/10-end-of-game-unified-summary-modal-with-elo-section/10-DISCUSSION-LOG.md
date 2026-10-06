# Phase 10: End-of-game unified summary modal with ELO section - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 10-end-of-game-unified-summary-modal-with-elo-section
**Areas discussed:** Scope del refactor en GameRecords

---

## Scope del refactor en GameRecords

### Selección de áreas

| Área | Presentada | Seleccionada |
|------|-----------|--------------|
| Scope del refactor en GameRecords | ✓ | ✓ |
| Trigger y timing del modal | ✓ | |
| Layout de la sección ELO | ✓ | |
| Secciones vacías / estados edge | ✓ | |

---

## Qué pasa con la página GameRecords después del refactor

| Opción | Descripción | Seleccionada |
|--------|-------------|----------|
| Modal reemplaza inline | La sección de Records y Resultados se sacan de la página y pasan al modal. GameRecords queda con solo el header + botón Volver. | ✓ |
| Modal overlay + página intacta | La página GameRecords sigue igual. El nuevo modal agrega ELO + achievements encima. Records duplicado. | |
| Página queda, modal sin records | La página sigue con results + records. El modal tiene solo achievements + ELO. | |

**User's choice:** Modal reemplaza inline
**Notes:** Usuario eligió simplificación agresiva — la página queda como cáscara mínima.

---

## ¿La sección 'Resultados' también va al modal?

| Opción | Descripción | Seleccionada |
|--------|-------------|----------|
| Resultados también al modal | Modal con 4 secciones: Resultados (posición + pts + MC), Records, Logros, ELO. Página completamente limpia. | ✓ |
| ELO absorbe posición (3 secciones) | La fila ELO incluye posición junto al delta. Sin sección separada de Resultados. Alineado con los 3 success criteria. | |

**User's choice:** Resultados también al modal
**Notes:** El modal tiene 4 secciones en orden fijo: Resultados → Records → Logros → ELO.

---

## Secciones vacías / estados edge

| Opción | Descripción | Seleccionada |
|--------|-------------|----------|
| Mostrar con mensaje vacío | Siempre se muestran las 4 secciones. Records sin ruptura → "Ningún record nuevo". Logros sin desbloqueo → "Ningún logro desbloqueado". ELO si falla 2 veces → omitir silenciosamente. | ✓ |
| Omitir secciones vacías | Si no hay records o logros nuevos, la sección no aparece. Solo ELO siempre visible. | |

**User's choice:** Mostrar con mensaje vacío
**Notes:** Consistente con el patrón general de la app de siempre mostrar estructura clara.

---

## Reabrir el modal después de cerrarlo

| Opción | Descripción | Seleccionada |
|--------|-------------|----------|
| No, solo 'Volver al inicio' | El modal se abre una vez. Si se cierra, solo queda el botón Volver. Simple y limpio. | ✓ |
| Sí, botón para reabrir | Además de 'Volver al inicio', hay un botón 'Ver resumen' para reabrir el modal. | |

**User's choice:** No, solo 'Volver al inicio'
**Notes:** Preferencia explícita por UX simple.

---

## Claude's Discretion

- Timing exacto de apertura del modal (si espera Promise.all o abre con skeleton)
- Estructura HTML interna de filas ELO
- Nombres de subcomponentes internos del modal
- Nombre de clases CSS

## Deferred Ideas

- Botón "Ver resumen" para reabrir el modal — descartado, puede reconsiderarse con feedback
- Animaciones de aparición del modal
