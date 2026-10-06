# Phase 15: Specs, infra y guardas — Context

**Milestone:** v2.0 «Archivo de Terraformación» · **Épica:** E1 (#72) · **Requisitos:** INFRA-01..05
**Plan maestro:** `.planning/v2.0/SPEC.md` § F15.

## Objetivo
Dejar la base de trabajo del milestone: plan y tablero (15.1), scripts de desarrollo (15.2), guarda de la base de tests (15.3) y dependencias fijadas (15.4). PR chico que además prueba que el agente puede mergear a `staging`.

## Decisiones locales
- La guarda usa `pytest_configure` + `pytest.exit(returncode=2)`: corre antes de cualquier fixture que toque la base.
- La lógica de la guarda vive en `backend/tests/db_guard.py` (función pura testeable).
- `Dockerfile.backend` es la imagen de desarrollo/tests (docker-compose), por eso instala `requirements-dev.txt`; Render instala solo `requirements.txt`.
- `gates.sh` omite (y lo informa) los gates cuya herramienta todavía no existe: lint (F19), fixtures (F16), e2e (F26+), comparación (F16+).
