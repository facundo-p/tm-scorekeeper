# 15-04 Summary — Dependencias
- `backend/requirements.txt` fijado con `==` salvo `sqlalchemy>=2.0,<2.1` (comentado, PR #70).
- `backend/requirements-dev.txt` con pytest, httpx y requests; CI y `Dockerfile.backend` (imagen de desarrollo/tests) lo instalan; Render sigue con `requirements.txt`.
- `.planning/codebase/STACK.md` e `INTEGRATIONS.md` actualizados. Seguimiento de psycopg 3: #144.
