# v2.0 — Decisiones

Criterio para resolver ambigüedades, en orden: (1) el prompt del milestone / `SPEC.md`; (2) el mockup; (3) las convenciones del repo. Las marcadas **revisar** se listan en el informe final.

## Decisiones técnicas del dueño (D-01 a D-15)

- **D-01** Una rama y un PR por fase. En GSD, `branching_strategy: none`.
- **D-02** Rutas del mockup en castellano: `/acceso`, `/`, `/partidas`, `/partidas/:id`, `/partidas/:id/ceremonia`, `/partidas/:id/editar`, `/registrar`, `/ranking`, `/jugadores/:id?tab=`, `/records`, `/logros`. Las rutas viejas redirigen a las nuevas.
- **D-03** Autenticación: credenciales en `AUTH_USERNAME` y `AUTH_PASSWORD_HASH` (PBKDF2 con stdlib); tokens firmados con `AUTH_SECRET`; JWT HS256 (PyJWT), 30 días (`AUTH_TOKEN_TTL_DAYS`), Bearer; localStorage; un 401 cierra la sesión; 5 fallos por IP bloquean 30 s; sin variables, el login se rechaza (fail-closed); `/health` y `/auth/login` son públicos.
- **D-04** Logros derivados del historial: cada nivel queda fechado con la partida que lo alcanzó. Editar o borrar una partida, o cargar una vieja, puede quitar un nivel. Se actualiza «logros permanentes» de PROJECT.md. **revisar**
- **D-05** Récords: solo cambian de dueño si se superan; igualar convierte en co-poseedor; la primera partida establece los récords pero no los «rompe»; como máximo un quiebre por récord y por partida; con valor 0 no hay dueño.
- **D-06** Redondeo half-even en todos lados, mockup incluido, para que el ELO de producción no cambie.
- **D-07** Gana quien queda en la posición 1; los co-ganadores cuentan todos. Helper único `winners()`.
- **D-08** `giant_killer`: ganar teniendo un ELO previo estrictamente menor que el máximo ELO previo de la mesa.
- **D-09** Sin estilos inline, salvo custom properties (`--w`, `--i`) puestas con el helper `cssVars()`. Lo controla ESLint y queda como aclaración en CLAUDE.md. **revisar**
- **D-10** TanStack Query envuelto en hooks con la forma del skill `new-hook`. El filtro va en las claves de cache.
- **D-11** `prefers-reduced-motion` también congela las capturas: planeta, ticker, contadores, inclinaciones, confeti, meteoros y ceremonia.
- **D-12** Las tipografías (Chakra Petch, Saira variable y Crimson Pro itálica, OFL) se guardan en el repo.
- **D-13** `app_meta.derived_version`: al arrancar, si quedó atrás, se recalculan ELO y logros bajo advisory lock.
- **D-14** Los cambios de API son aditivos hasta F35; `staging` funciona después de cada merge.
- **D-15** Campeón de temporada: primer clasificado por promedio total al cierre; desempate por más partidas y después por mejor puntaje.

## Decisiones tomadas durante la ejecución

- **D-16** IDs de requisitos v2.0 con prefijos nuevos (`INFRA`, `PAR`, `MOCK`, `VIS`, `SEC`, `TXN`, `STAT`, `SEAS`, `SHELL`, `FX`, `SCR`, `CLOSE`) para no reutilizar los de v1.1 (`ELO-API`, `PROF`, `POST`, `RANK`).
- **D-17** `tied` pasa a valer `true` para todos los miembros de un grupo empatado (incluido el primero). Es un cambio de semántica del DTO `PlayerResultDTO.tied` en F21 (el comentario actual dice lo contrario); ningún consumidor del frontend depende del valor del primero.
- **D-18** Récords de carrera (`most_games_played`, `most_games_won`, `highest_elo`, `longest_streak`): poseedores = todos los que tienen el valor máximo (> 0). Su historial registra solo los cambios del conjunto de poseedores (cuando alguien supera estrictamente el máximo, o lo iguala), no cada incremento del valor.
- **D-19** Antes de F21 (sin `created_at`) el orden canónico de partidas es (`date`, `id`); en el fixture los ids `g-001`…`g-063` coinciden con el orden del mockup.
- **D-20** Color de cubo: enum de 10 valores (`rojo`, `verde`, `azul`, `amarillo`, `negro`, `naranja`, `violeta`, `rosa`, `blanco`, `gris`), el mismo set del mockup (`PLAYERS_SEED`). El README del rediseño menciona 9; el décimo (`gris`) lo usa el mockup para el jugador inactivo.
