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
- **D-21** El congelado del planeta y del ticker bajo `prefers-reduced-motion` (D-11) y el gancho `window.__TM_PLANET__` (`drawRect()`, `settled()`) se adelantan de F17.3 a F16: sin ellos el planeta WebGL renderiza en bucle con SwiftShader, las capturas se traban y el mockup no coincide consigo mismo. Con reduced-motion el globo es una imagen fija (sin nubes animadas, `time = 0`) que solo se redibuja si cambia su destino; `data-planet` pasa a `ready` después del primer dibujo (y a `fallback` sin WebGL2). Sin reduced-motion el comportamiento no cambia.
- **D-22** axe (serios/críticos) solo frena en modo candidata; en `--self` se informa pero no frena, porque mide al mockup y no a la app. Las violaciones del mockup que existan se corrigen en F17–F18 si afectan a pantallas que se portan.
- **D-23** "Red en reposo" se mide con un contador propio de requests en vuelo (500 ms sin actividad) en lugar del evento `networkidle` de Playwright, que no llegaba a dispararse con la CPU ocupada por SwiftShader.
- **D-24** Hasta F21 el golden de posiciones compara `position`, `total` y `mc` pero no `tied`: el backend todavía marca `tied=false` en el primero de un grupo empatado (se corrige en F21, D-17). El golden guarda `tied` con la semántica nueva.
- **D-25** Clave de `localStorage` del token: `tm_token` (la usa el arnés para inyectar la sesión; F20 la adopta en el cliente). La marca vieja `tm_session` se sigue inyectando hasta que F20 la retire.
- **D-26** Solo se versionan los subconjuntos `latin` y `latin-ext` de las tipografías (D-12), servidos desde `frontend/public/fonts/fonts.css`. Los glifos fuera de esos rangos (por ejemplo el subíndice de O₂) caen en la fuente del sistema igual que en el mockup con Google Fonts.
- **D-27** Antes de F19/F26 la candidata es la app vieja; los escenarios de pantallas solo se exigen desde la fase que porta esa pantalla (`gateFromPhase`). Hasta F18 la comparación de fase corre en `--self`.
- **D-28** El arnés agrega `--disable-gpu-rasterization` a los flags de chromium (en los dos lados): con rasterización por GPU (SwiftShader) el texto de las capas con scroll propio (la matriz cara a cara) se corría sub-píxel según la carga y el mockup no coincidía consigo mismo. No afecta a WebGL.
- **D-29** El paralaje del cielo con el puntero (`fx/stars.js`) se desactiva con reduced-motion, como ya decía el README del rediseño; antes dependía del momento en que el navegador agrupaba los `pointermove`.
- **D-30** «Con valor 0 no hay dueño» (D-05) se aplica a los récords «más es mejor». En los «menos es mejor» el 0 es un valor válido: `closest_win` = 0 es una victoria decidida por M€ (el mockup ya lo mostraba como «pts, definida por M€»). **revisar**
- **D-31** El seed y el enum del backend siguen usando la clave `Spacecrafter` hasta F21; la UI muestra el nombre en castellano para las dos claves (`Spacecrafter` y `Spacefarer`). En F21, con `rename_enum_value`, el seed pasa a `Spacefarer` y el backend acepta las dos en la entrada.
- **D-32** Nombres en castellano de Utopia, Cimmeria y Spacefarer elegidos sin poder verificar la edición local (lista `REVISAR` en `labels.js`); Venus usa los del issue #33 («Ser Superior», «Venúfilo»). Para no repetir etiquetas: Trader = «Mercader» (Merchant ya es «Comerciante») y Mogul = «Potentado» (Magnate ya existe). **revisar**
- **D-33** Login del mockup: cuenta de demostración `grupo`/`marte` (visible solo en el prototipo, `.proto-only`) para mostrar los tres estados reales: datos incompletos, 401 «Usuario o contraseña incorrectos.» y 429 tras 5 fallos.
- **D-34** Pestañas del perfil y filtros en la URL del mockup como query del hash (`#jugador-p-facu?tab=partidas`, `#records?mapa=Tharsis&exp=Turmoil`); valores de pestaña en castellano: `resumen`, `partidas`, `records`, `logros` (la app usa los mismos en `?tab=`).
- **D-35** El hito y la recompensa más reclamados (#35, #66) se calculan en el frontend de referencia sobre todas las partidas del jugador (o del subconjunto filtrado); empates: todos los empatados, ordenados por clave. «Recompensa» cuenta los primeros puestos (co-primeros incluidos).
