# Phase 20 — Verification

| Criterio | Evidencia | Estado |
|---|---|---|
| Todo salvo login y health da 401 sin token | `test_protected_routes_need_token` (players, games, records, elo, auth/me), `test_requires_token` (admin) | ✅ |
| Login, token y bloqueo | `test_auth_service.py` y `test_auth_routes.py`: 200 con token de 30 días, 401 credenciales, 429 al 6.º intento con `Retry-After`, 503 sin configuración, tokens vencidos o ajenos rechazados | ✅ |
| El frontend viejo sigue andando | candidata real (uvicorn + build): login con credenciales de prueba, 63 partidas y jugadores con Bearer, token roto → acceso | ✅ |
| Validación compartida y reglas por mapa | `test_game_validation.py`: 400 en crear y editar, 404 inexistente, 409 por `IntegrityError`, espejo de `gameRules.ts` | ✅ |
| UNIQUE(game_id, player_id) | migración `f6a7b8c9d0e1` arriba/abajo sobre base vacía; aborta con duplicados (test); restricción probada en la base | ✅ |
| Recompute | `POST /admin/recompute` con token y `X-Admin-Secret`; ruta GET retirada (404) | ✅ |
| Gates | `gates.sh all` con migraciones: pytest 275, fixtures, semántica, lint, typecheck, vitest 305, build, tamaño | ✅ |
| Comparación | galería 2/2 con la candidata que ahora inicia sesión de verdad; F20 no porta pantallas | ✅ |
