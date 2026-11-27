# 20-02 SUMMARY — Frontend con login real

- `api/client.ts`: token en `tm_token` (`tokenStore`, tolera localStorage bloqueado), `Authorization: Bearer` en cada llamada, un 401 llama al manejador de la sesión; se corrigió que `options.headers` pisaba el `Content-Type`.
- `context/AuthContext.tsx`: `login` asíncrono contra `POST /auth/login`, mensajes por estado (`context/loginErrors.ts`: 401, 422, 429, 503, red), 401 → logout, borra la marca vieja `tm_session`. Se borró `constants/auth.ts` (credenciales en el bundle).
- `pages/Login`: estado «Ingresando…» y error con `role="alert"`.
- Arnés: la candidata ya no inyecta `tm_session` y falla si no puede iniciar sesión.
- Verificación manual con la candidata (backend + build real): login con las credenciales de prueba, 63 partidas y jugadores cargan con token, un token roto lleva al acceso y se borra.
- Tests: `Login.test.tsx` (fetch simulado), `unit/apiClient.test.tsx` (Bearer, 401 → logout, errores).
