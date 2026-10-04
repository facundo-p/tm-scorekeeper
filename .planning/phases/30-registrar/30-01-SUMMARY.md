# 30-01 SUMMARY — Registrar

- **`screens/Register`**: port del asistente de 5 pasos.
  - `model.ts`: reductor, totales con hitos y recompensas automáticos y desempate por M€, validación con los textos del mockup.
  - `io.ts`: partida guardada ↔ estado ↔ cuerpo de la API.
  - `draft.ts`: borrador en `sessionStorage`.
  - `useWizard`: pasos, errores, «Borrador guardado» y guardado.
  - Pasos: `StepGame`, `StepTable`, `StepBoard`, `ScorePad` (tabla y pestañas) y `StepReview`; más `Preview` con el planeta.
- **Guardar**: `useSaveGame` hace `POST` (y abre la ceremonia) o `PUT` (y vuelve al informe con aviso). Invalida el cache y borra el borrador.
- **Rutas**: `/registrar` y `/partidas/:id/editar` usan el asistente nuevo; `/partidas/:id/records` redirige al informe.
- **Piezas**:
  - `Switch` con `size="s"` y `disabled`.
  - `ScreenHead` conserva el contenedor de acciones aunque esté vacío, como el mockup.
  - `domain/clock.ts` (`today`, `monthsBefore`).
- **Arnés**:
  - Escenarios `register-2..5` y `register-errors`, con `?ejemplo=` y `?step=` en modo comparación (D-76).
  - Desvío aceptado en `register-2` (botón que desborda en el mockup).
  - Chequeo funcional `tools/parity/functional`: registrar solo con el teclado en 390 y 1440 px, en `gates.sh e2e`.
- **Tests**: `registerModel` (6) y `Register` (4: nueva con POST, errores, borrador, edición con PUT).
