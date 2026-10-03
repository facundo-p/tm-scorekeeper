# tm-scorekeeper

Aplicación web para registrar partidas de Terraforming Mars, seguir estadísticas de jugadores y consultar récords históricos.

---

## Requisitos

- [Docker Desktop](https://www.docker.com/get-started) (incluye Docker Compose)
- `make`

---

## Levantar el entorno local

```bash
make dev
```

Esto construye y arranca tres servicios:

| Servicio   | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| Backend    | http://localhost:8000       |
| PostgreSQL | localhost:5432              |

Para detener:

```bash
make down
```

---

## Comandos disponibles

```bash
make dev                              # Levanta todos los servicios (hot-reload activo)
make down                             # Detiene y elimina los contenedores
make migrate                          # Aplica migraciones de base de datos (Alembic)
make logs                             # Tail de logs de todos los servicios
make test-backend                     # Corre los tests del backend (pytest)
make test-frontend                    # Corre los tests del frontend (vitest)
make typechecks                       # Typecheck de TypeScript (tsc -b)
make restore-prod FILE=<backup.sql.gz>  # Restaura un backup de prod a la DB local (DESTRUCTIVO — pisa todo)
```

Sin Docker (por ejemplo, en el entorno cloud de Claude Code):

```bash
bash scripts/dev/bootstrap.sh         # PostgreSQL 16 local, bases *_test, venv del backend y node_modules (idempotente)
bash scripts/dev/gates.sh quick       # pytest + typecheck + vitest
bash scripts/dev/gates.sh all         # todos los gates (backend, frontend, e2e, comparación y tamaño de PR)
```

Los tests del backend solo corren contra una base cuyo nombre termine en `_test`.

---

## Migraciones

Las migraciones se aplican manualmente después de cambios en los modelos:

```bash
make migrate
```

---

## Operaciones

- **Backups de la DB de producción** — workflow manual que dumpea Supabase a un bucket de Cloudflare R2. Ver [`docs/backups.md`](docs/backups.md).

---

## Rediseño propuesto

Prototipo navegable del nuevo frontend, sistema de diseño y revisión técnica en [`docs/redesign/`](docs/redesign/README.md). Para verlo localmente: `npx serve docs/redesign/mockup`.

---

## Estructura del proyecto

```
tm-scorekeeper/
├── backend/                    # API FastAPI + Python 3.12
│   ├── main.py
│   ├── models/                 # Entidades de dominio
│   ├── schemas/                # DTOs (request/response)
│   ├── routes/                 # Endpoints REST
│   ├── services/               # Lógica de negocio
│   ├── repositories/           # Acceso a datos (SQLAlchemy)
│   ├── mappers/                # Conversión modelo ↔ DTO
│   ├── db/                     # Sesión, modelos ORM y migraciones Alembic
│   ├── tests/                  # Tests unitarios, integración y e2e
│   ├── requirements.txt        # Dependencias Python (producción, versiones fijas)
│   ├── requirements-dev.txt    # Dependencias de tests (pytest, httpx, requests)
│   └── conftest.py
├── frontend/                   # SPA React + TypeScript + Vite
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── render.yaml                 # Configuración deploy backend (Render)
├── Makefile
└── README.md
```

---

## Variables de entorno (producción)

El backend lee estas variables, que se configuran a mano en el proveedor de hosting (Render):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Supabase) |
| `FRONTEND_URL` | URL del frontend en producción (Vercel) |
| `AUTH_USERNAME` | Usuario del grupo |
| `AUTH_PASSWORD_HASH` | Hash PBKDF2 de la contraseña: `cd backend && python -m scripts.hash_password` |
| `AUTH_SECRET` | Clave para firmar los tokens (al menos 32 caracteres al azar; más corta cuenta como ausente; por ejemplo `python -c "import secrets; print(secrets.token_urlsafe(48))"`) |
| `AUTH_TOKEN_TTL_DAYS` | Opcional: días de validez del token (30 por defecto) |
| `ADMIN_SECRET` | Secreto del header `X-Admin-Secret` de `POST /admin/recompute` (reemplaza a `GET /elo/admin/recompute?secret=`, que ya no existe) |
| `TRUSTED_PROXY_HOPS` | Proxies propios delante del backend; en Render `1` (ya está en `render.yaml`). La IP del bloqueo por intentos se toma de `X-Forwarded-For` contando desde la derecha |

Sin `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` o `AUTH_SECRET` el login responde 503 y la API rechaza todo salvo `/health` (fail-closed, D-50). En desarrollo local, `docker-compose.yml` toma las de autenticación de un archivo `.env` en la raíz (ver `backend/.env.example`); el resto ya está definido ahí.
