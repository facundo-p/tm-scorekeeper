# v2.0 — RUNBOOK

El estado vive en archivos (`LEDGER.md`, `SPEC.md`, `DECISIONS.md`, `.planning/phases/`), nunca en la memoria de la conversación.

## Bucle por issue
1. Escribir `.planning/phases/NN-slug/NN-MM-PLAN.md` (frontmatter GSD: `phase`, `plan_id`, `wave`, `depends_on`, `requirements`, `files_modified`, `must_haves`; tareas `<task>` con `<verify><automated>`): comportamiento, verificación, casos borde y tests.
2. Implementar en commits chicos, push en cada uno (`git push -u origin claude/amazing-thompson-p5ole5`).
3. `bash scripts/dev/gates.sh <alcance>`; corregir hasta verde, máximo 3 intentos por gate.
4. Escribir `NN-MM-SUMMARY.md` y actualizar el LEDGER (estado + bitácora).

## Bucle por fase
1. Gates completos, comparación de la fase (`node tools/parity/run.mjs --phase NN`), juez visual si hay escenarios exigidos → `NN-VERIFICATION.md`.
2. PR «Fase NN: …» hacia `staging` (plantilla de PR si existe), cuerpo con resumen de verificación; `subscribe_pr_activity`.
3. Revisor: subagente `pr-reviewer` (o `general-purpose` con `model: "sonnet"` y el mismo prompt) con contexto fresco. Prompt:
   > Revisá el PR #N contra `origin/staging`. Tomá como referencia `.claude/CLAUDE.md`, `docs/redesign/SEMANTICS.md`, la fase del SPEC y los skills del repo. Buscá correctitud, seguridad, regresiones, duplicación, funciones de más de 20 líneas, estilos inline fuera de D-09, tests faltantes y documentación desactualizada. Respondé solo JSON `{verdict: APPROVE|CHANGES_REQUESTED, findings:[{severity: blocker|major|minor|nit, file, line, problem, fix}]}`.
   - Publicar el veredicto como revisión `COMMENT`.
   - blocker/major → corregir y lanzar un revisor nuevo con los cambios y los hallazgos anteriores. Máximo 3 rondas.
   - minor/nit → corregir si son triviales o responder en una línea.
4. CI: si falla, leer logs del job (`get_job_logs`), corregir, push; máximo 3 intentos.
5. Aprobado + CI verde → merge commit; cerrar issues de la fase con comentario de evidencia; `git fetch origin staging && git checkout -B claude/amazing-thompson-p5ole5 origin/staging && git push --force-with-lease -u origin claude/amazing-thompson-p5ole5`; `unsubscribe_pr_activity`.
6. LEDGER → fase siguiente.

## Espera de CI
LEDGER en `WAIT_CI PR#N`, terminar el turno. Despiertan los eventos del PR o la rutina. Nada de `sleep` ni consultas repetidas.

## Bloqueos
- **Comparación inestable:** repetir una vez; si el mockup no coincide consigo mismo, arreglar primero el arnés.
- **Bloqueo externo** (protección de rama, permisos, secretos): fase `BLOQUEADA` en el LEDGER, comentario en el PR, issue «Bloqueo: …», avanzar con lo independiente; la rutina solo re-chequea ese punto.
- **Tres rondas sin aprobación:** objeciones restantes al PR y a `DECISIONS.md`; seguir solo si ninguna es blocker (si lo es, es un bloqueo).

## Contexto
- Lecturas pesadas → subagentes; salidas de comandos cortas (`| tail`).
- No abrir archivos generados: fixtures, tipografías, lockfiles.
- Tras una compactación, releer solo: `LEDGER.md`, este RUNBOOK, la fase actual del SPEC y el `PLAN.md` en curso.

## Reanudar
Lo dispara la rutina horaria («Reanudación v2.0 …») o un reinicio.
1. Si el LEDGER dice `DONE`: borrar la rutina (`delete_trigger` con el id del LEDGER) y no hacer nada más.
2. Si ya hay un turno trabajando, seguir sin reiniciar.
3. `git fetch origin staging claude/amazing-thompson-p5ole5`.
4. Si el LEDGER marca `RESET_PENDIENTE`: `git checkout -B claude/amazing-thompson-p5ole5 origin/staging && git push --force-with-lease -u origin claude/amazing-thompson-p5ole5`. Si no, `git checkout claude/amazing-thompson-p5ole5 && git reset --hard origin/claude/amazing-thompson-p5ole5` solo si no hay cambios locales sin push.
5. `bash scripts/dev/bootstrap.sh`.
6. Leer el LEDGER (estado actual).
7. Si hay PR abierto: revisar CI (`pull_request_read` get_check_runs) y revisión por MCP; volver a suscribirse (`subscribe_pr_activity`).
8. Continuar desde «Próximo paso».
