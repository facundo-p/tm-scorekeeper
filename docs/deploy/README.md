# Despliegue

Producción es `main`: al mergear, CI corre `migrate-and-deploy` (`alembic upgrade head` contra Supabase y deploy de
Render) y Vercel publica el frontend. Todo llega a `main` con un PR desde `staging`.

## Cómo se hace

Con el skill **`/release`** ([`.claude/skills/release/SKILL.md`](../../.claude/skills/release/SKILL.md)). El skill:

1. revisa qué trae `staging` desde la última versión (el último tag `vX.Y.Z`);
2. propone el número de versión y redacta la entrada de [`NOVEDADES.md`](../NOVEDADES.md); el dueño la aprueba;
3. abre el PR de preparación a `staging` (versión y novedades);
4. recorre con el dueño los pasos previos (backup y, si existe, la checklist de esa versión);
5. abre el PR `staging → main`; **el dueño mergea**;
6. sigue `migrate-and-deploy`, crea el tag y guía la verificación.

Nada sobre Supabase, Render o Vercel lo hace el agente: muestra el comando o el lugar y el dueño confirma.

## Versión

`VERSION` (raíz) es la fuente única; `node tools/release/bump.mjs X.Y.Z` la copia a `frontend/package.json`,
`frontend/package-lock.json` y `backend/version.py` (que la expone en el OpenAPI). CI corre
`node tools/release/bump.mjs --check` y falla si no coinciden.

Semver, decidido por el dueño:

| Parte | Cuándo |
|---|---|
| MAJOR | Milestone, o cambia cómo se usa la app o la API (ej. login obligatorio, endpoints retirados) |
| MINOR | Funcionalidad nueva visible para el grupo |
| PATCH | Correcciones, o solo cambios internos (infra, CI, refactors) |

## Checklist específica de una versión

Si una versión necesita algo fuera de lo genérico (datos que pueden frenar una migración, variables de entorno
nuevas, API retirada, verificación puntual después del deploy), se escribe `docs/deploy/vX.Y-checklist.md` con estas
secciones, que `/release` intercala en su recorrido:

1. **Antes de promover**
2. **Promover** (opcional, si hay algo más que el PR)
3. **Después del deploy**
4. **Si algo sale mal**

Checklists: [`v2.0-checklist.md`](v2.0-checklist.md).

## Vuelta atrás (genérica)

- **Frontend roto, backend bien:** Vercel → *Promote* del deploy anterior.
- **Falló `alembic upgrade head`:** la base quedó como estaba (todas las migraciones corren en una sola
  transacción). Revertir el merge en `main`, corregir y volver a promover.
- **Migraciones aplicadas y algo falla:** primero restaurar el backup `pre-vX.Y.Z` ([`backups.md`](../backups.md),
  «Restaurar a producción»), después revertir el merge y redesplegar el backend anterior en Render.
