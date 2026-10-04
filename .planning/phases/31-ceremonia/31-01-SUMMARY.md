# 31-01 SUMMARY — Ceremonia

- **`screens/Ceremony`**: port de la ceremonia del mockup con datos de la API.
  - `model.ts`: conteo y texto de estado.
  - `useSequence` y `useConfetti`.
  - `Tally`, `Blocks` (ganador, ELO, récords, logros) y `Ceremony.tsx` (marco desnudo con cielo y planeta).
- **Ruta:** `/partidas/:id/ceremonia` fuera del shell y protegida. Guardar una partida nueva en Registrar y «Repetir ceremonia» en el informe llegan acá.
- **`fx/confetti`:** usa `reducedMotion()` de `ui/motion`.
- **Mockup:** un solo `main`, h1 al final y confetti que no se corta (D-77).
- **Arnés:**
  - Chequeo funcional `ceremony-skip`, que activa «Ver informe completo» con teclado.
  - `functional/run.mjs` con `--ids` y `--verbose`.
- **Revisión (ronda 1):** confetti que no se corta al cambiar de fase; h1 al final; foco en el ganador al saltar; `TallyRow` y `After` extraídos; `winSub` con unidad y `winnerOf`.
- **Tests:** `ceremonyModel` (4), `ceremonyConfetti` (2) y `Ceremony` (5: saltar, reduced-motion, secuencia completa con Turmoil y desempate por M€, foco, partida inexistente).
