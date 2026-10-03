# 19-01 SUMMARY — ESLint y regla D-09

- `frontend/eslint.config.js` (ESLint 9 flat): `@eslint/js`, `typescript-eslint`, `jsx-a11y` (recomendado), `react-hooks` (`rules-of-hooks` y `exhaustive-deps` como error) y la regla D-09 con `no-restricted-syntax` (solo `style={cssVars(...)}`). `no-autofocus` apagada: el foco inicial del login y de los diálogos es intencional.
- `npm run lint` (`--max-warnings 0`) en CI (`test-frontend`) y en `gates.sh frontend`.
- Código existente corregido: 4 estilos inline (ProgressBar con `--w`; GameForm y StepMilestones con clases), a11y de teclado (`utils/a11y.ts` `onActivateKey`) en AchievementCard, StepPlayerSelection y Players; Modal con `role="presentation"`; TabBar sin `nav` con rol `tablist`; dependencias del efecto de GameRecords.
- `src/domain/cssVars.ts` (adelantado de 19-04 porque lo necesita la regla).
- tsconfig: sin `baseUrl`, alias `@/*` → `./src/*` (#65).
- Tests: `cssVars`, `onActivateKey` y la regla D-09 con la API de ESLint; el test de ProgressBar lee `--w`.
