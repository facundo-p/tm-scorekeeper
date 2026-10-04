# 31-01 SUMMARY — Ceremonia

- **`screens/Ceremony`**: port de la ceremonia del mockup con datos de la API.
  - `model.ts`: conteo y texto de estado.
  - `useSequence` y `useConfetti`.
  - `Tally`, `Blocks` (ganador, ELO, récords, logros) y `Ceremony.tsx` (marco desnudo con cielo y planeta).
- **Ruta:** `/partidas/:id/ceremonia` fuera del shell y protegida. Guardar una partida nueva en Registrar y «Repetir ceremonia» en el informe llegan acá.
- **`fx/confetti`:** usa `reducedMotion()` de `ui/motion`.
- **Mockup:** un solo `main` en la ceremonia (D-77).
- **Arnés:**
  - Chequeo funcional `ceremony-skip`, que activa «Ver informe completo» con teclado.
  - `functional/run.mjs` con `--ids` y `--verbose`.
- **Tests:** `ceremonyModel` (4) y `Ceremony` (3).
