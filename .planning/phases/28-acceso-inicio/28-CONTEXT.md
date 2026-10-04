# Phase 28: Acceso e Inicio — Context

**Milestone:** v2.0 · **Épica:** E6 · **Requisitos:** SCR-01..02 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F28–F34.

## Objetivo
Las primeras pantallas nuevas: Acceso (`mockup/js/screens/login.js`) con el login real, e Inicio (`home.js`): héroe de la temporada con el planeta interactivo y la órbita de datos, última partida, bitácora, consejo (top 5 del ranking) y carrera por promedio con categoría (`?cat=`) y mesa (`?mesa=`), más la hoja de reglas con los campeones anteriores.

## Decisiones locales
- **D-74** Orden de alta de los jugadores, niveles por logro en el informe, carrera sin parpadeo y `expectStatus` en el arnés.

## Bordes
- Acceso: campos vacíos (sin llamar al servidor), 401, 429, 503, servidor caído, sesión ya iniciada.
- Inicio: archivo sin partidas (sin última partida), carrera sin partidas o solo con pendientes, categoría inválida en la URL, mesa inválida, temporada sin campeones anteriores, campeón vacío («Sin campeón»).
