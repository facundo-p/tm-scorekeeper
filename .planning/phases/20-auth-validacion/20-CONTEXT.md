# Phase 20: Autenticación y validación — Context

**Milestone:** v2.0 · **Épica:** E3 (#74) · **Requisitos:** SEC-01..04 · **Plan maestro:** `.planning/v2.0/SPEC.md` § F20.

## Objetivo
Login real (D-03) que protege toda la API salvo `/health` y `/auth/login`; el frontend actual lo usa con Bearer; la misma validación al crear y editar partidas, con hitos y recompensas acordes al mapa y las expansiones, y una restricción única en la base; el recálculo administrativo pasa a `POST` autenticado con secreto en header.

## Decisiones locales
- **D-48** En los tests la dependencia `require_auth` se reemplaza por un usuario fijo (`tests/conftest.py`, autouse); los tests de autenticación la quitan con el fixture `real_auth`.
- **D-49** Hash: `pbkdf2_sha256$<iteraciones>$<sal>$<hash>` (sal y hash en base64 url-safe sin relleno; 600 000 iteraciones). `python -m scripts.hash_password` pide la contraseña sin eco e imprime el hash.
- **D-50** Sin `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` o `AUTH_SECRET`, el login responde 503 y toda ruta protegida 401 (fail-closed). Bloqueo: 5 fallos seguidos desde una IP la bloquean 30 s (429 con `Retry-After`); un login correcto limpia el contador. La IP sale de D-54 (`TRUSTED_PROXY_HOPS`).
- **D-51** Reglas por mapa en `backend/models/game_rules.py` (espejo de `frontend/src/constants/gameRules.ts` y del catálogo del mockup): un hito o recompensa es válido si es del mapa o de una expansión elegida (Venus: Hoverlord y Venuphile).
- **D-52** Errores de partidas: validación → 400; partida inexistente → 404 (`GameNotFound`); jugador repetido detectado por la base → 409.
- **D-53** `GET /auth/me` devuelve `{"username": ...}`; el frontend guarda el token en `tm_token` (D-25) y un 401 de cualquier llamada cierra la sesión.
- **D-54** IP del limitador desde la derecha de `X-Forwarded-For` (`TRUSTED_PROXY_HOPS`), secreto de 32+ caracteres y poda del limitador (revisión ronda 1).
