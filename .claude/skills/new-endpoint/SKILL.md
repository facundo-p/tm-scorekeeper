---
name: new-endpoint
description: Scaffold a complete backend REST endpoint with all layers (schema, model, ORM, repo, mapper, service, route, container, main.py registration)
argument-hint: [resource-name]
---

# New Backend Endpoint Scaffold

Generate a complete backend REST endpoint for the resource `$ARGUMENTS`.

## Pre-flight

1. Ask the user for:
   - **Resource name** (if not provided as argument): singular, snake_case (e.g. `achievement`)
   - **Fields**: name, type, nullable, default, validation rules
   - **Operations needed**: which CRUD endpoints (default: all — create, list, get, update, delete)
   - **Business rules**: any validation logic beyond field types

2. Confirm the plan before generating code.

## Files to create/modify

Generate code following the exact patterns already in this codebase. Use existing files as reference:

### 1. Schema (DTO) — `backend/schemas/{resource}.py`
- Pydantic V2 BaseModel
- Separate DTOs: `{Resource}CreateDTO`, `{Resource}UpdateDTO` (optional fields), `{Resource}ResponseDTO`
- Use `Field()` for validation (min_length, ge, etc.)
- Reference: `backend/schemas/player.py`

### 2. Domain Model — `backend/models/{resource}.py`
- Plain Python class with `__init__`
- No business logic, no DB deps
- `{resource}_id: Optional[str]` as first param
- Reference: `backend/models/player.py`

### 3. ORM Model — add to `backend/db/models.py`
- SQLAlchemy model inheriting `Base`
- `__tablename__` = plural snake_case
- `id = Column(String, primary_key=True)`
- Reference: existing models in `backend/db/models.py`

### 4. Alembic Migration
- Tell the user to run: `docker compose exec backend alembic revision --autogenerate -m "add {resources} table"`
- Then: `make migrate`

### 5. Repository — `backend/repositories/{resource}_repository.py`
- Class: `{Resource}Repository`
- Constructor: `__init__(self, session_factory=get_session)`
- Methods: `create`, `get`, `get_all`, `update`, `delete`
- `create` auto-generates UUID if missing
- `get` raises `KeyError` if not found
- Context manager pattern: `with self._session_factory() as session:`
- Reference: `backend/repositories/player_repository.py`

### 6. Mapper — `backend/mappers/{resource}_mapper.py`
- Pure functions: `{resource}_dto_to_model()` and `{resource}_model_to_dto()`
- Reference: `backend/mappers/game_mapper.py`

### 7. Service — `backend/services/{resource}_service.py`
- Class: `{Resource}Service`
- Constructor takes repository dependency
- Public CRUD methods
- Private `_validate_*()` methods for business rules
- Raises `ValueError` for validation, `KeyError` for not found
- Reference: `backend/services/player_service.py`

### 8. Route — `backend/routes/{resources}_routes.py`
- `APIRouter(prefix="/{resources}", tags=["{Resource}"])`
- Exception handling: `KeyError` → 404, `ValueError` → 400
- Response models on endpoints
- Reference: `backend/routes/players_routes.py`

### 9. Container — modify `backend/repositories/container.py`
- Add: `from repositories.{resource}_repository import {Resource}Repository`
- Add: `{resource}_repository = {Resource}Repository()`

### 10. Main — modify `backend/main.py`
- Add: `from routes.{resources}_routes import router as {resources}_router`
- Add: `app.include_router({resources}_router)`

## Important

- All naming follows existing conventions (snake_case files, PascalCase classes)
- DTOs use Pydantic V2 (BaseModel, Field)
- Error handling pattern: try/except in routes, raise in services
- UUIDs generated via `uuid4()` in repository
- Session managed via context manager in repository
- DO NOT run `pytest` on host — remind user to use `make test-backend`
