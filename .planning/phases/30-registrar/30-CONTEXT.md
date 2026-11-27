# Phase 30: Registrar — Context

**Milestone:** v2.0 · **Épica:** E6 · **Requisitos:** SCR-05..06 · **Cierra:** #33 (teclado) · **Plan maestro:** `.planning/v2.0/SPEC.md` § F28–F34.

## Objetivo
El asistente de 5 pasos del mockup (`js/screens/register.js`): partida (mapa, fecha, generaciones, draft, expansiones), mesa (2 a 5 jugadores y corporaciones), hitos y recompensas (con podio, empates y partidas de 2), planilla de puntaje (tabla en escritorio, pestañas en el teléfono, hitos y recompensas automáticos, M€ de desempate) y revisión; vista previa con el planeta en la región. Borrador en `sessionStorage`, guardar con `POST` y modo edición con `PUT`.

## Decisiones locales
- **D-76** Borrador, ejemplo solo en comparación, guardar/editar, desvío del botón en 390 px, chequeo de teclado.

## Bordes
- Fecha futura, sin mapa, menos de 2 jugadores, corporación faltante o repetida (Novel se puede repetir), recompensa sin financiador o sin 1.º.
- Más de 3 hitos o recompensas (bloqueado), sacar a un jugador limpia sus hitos y podios, empate en 1.º sin 2.º, partidas de 2 sin 2.º.
- Turmoil apagado: la fila no suma y se guarda en null.
- Error del servidor al guardar (409, 422): se muestra en la lista de errores y no se pierde el estado.
