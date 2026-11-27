# 15-02 Summary — Scripts de desarrollo
- `scripts/dev/lib.sh` (utilidades compartidas), `bootstrap.sh`, `gates.sh`, `pr-size.sh`.
- Bootstrap idempotente verificado con dos corridas seguidas; reinstala dependencias solo si cambian los hashes de requirements o lockfiles.
- `gates.sh all` en verde (pytest, migraciones sobre base vacía, typecheck, vitest, build, tamaño de PR); lint, fixtures, e2e y comparación se informan como omitidos hasta que existan.
