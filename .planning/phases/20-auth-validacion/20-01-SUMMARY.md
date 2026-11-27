# 20-01 SUMMARY — Autenticación del backend

- `services/auth_service.py`: PBKDF2 (`hash_password`/`verify_password`, D-49), `AuthConfig.from_env`, `LoginLimiter` (5 fallos → 30 s, D-50) y `AuthService` (login con JWT HS256 de PyJWT, `verify` que exige `exp` y `sub` igual al usuario configurado).
- `routes/auth_routes.py` (`POST /auth/login`, `GET /auth/me`), `GET /health` en `main.py`, `routes/dependencies.py::require_auth` aplicado a todos los routers de datos. CORS con `Authorization`, `Content-Type` y `X-Admin-Secret`.
- `scripts/hash_password.py` (pide la contraseña dos veces, sin eco), `.env.example`, `render.yaml` (variables y `--proxy-headers`), `docker-compose.yml` lee las variables de un `.env`; READMEs al día.
- Tests: `tests/test_auth_service.py`, `tests/integration/test_auth_routes.py` (401/200/429/503, headers mal formados, tokens vencidos o ajenos), `tests/test_hash_password_script.py`. Los tests existentes usan un usuario fijo (D-48).
