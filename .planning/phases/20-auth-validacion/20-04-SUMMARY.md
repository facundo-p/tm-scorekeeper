# 20-04 SUMMARY — Recompute administrativo

- `routes/admin_routes.py`: `POST /admin/recompute` dentro del grupo protegido, header `X-Admin-Secret` comparado con `secrets.compare_digest`; 403 si falta, no coincide o `ADMIN_SECRET` no está configurado.
- Se retiró `GET /elo/admin/recompute` (secreto por query string). `docs/redesign/REVIEW.md` S6 marcado como resuelto.
- Tests: `tests/integration/test_admin_routes.py`.
