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
make dev            # Levanta todos los servicios (hot-reload activo)
make down           # Detiene y elimina los contenedores
make migrate        # Aplica migraciones de base de datos (Alembic)
make logs           # Tail de logs de todos los servicios
make test-backend   # Corre los tests del backend (pytest)
make test-frontend  # Corre los tests del frontend (vitest)
make typechecks     # Typecheck de TypeScript (tsc -b)
```

---

## Migraciones

Las migraciones se aplican manualmente después de cambios en los modelos:

```bash
make migrate
```

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
│   ├── requirements.txt        # Dependencias Python
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

El backend lee dos variables que deben configurarse manualmente en el proveedor de hosting:

| Variable       | Descripción                              |
|----------------|------------------------------------------|
| `DATABASE_URL` | Connection string PostgreSQL (Supabase)  |
| `FRONTEND_URL` | URL del frontend en producción (Vercel)  |

En desarrollo local estas variables están definidas en `docker-compose.yml`.
