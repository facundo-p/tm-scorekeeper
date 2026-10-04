#!/usr/bin/env bash
# Corre los gates de calidad de v2.0 (F15). Uso: scripts/dev/gates.sh <alcance>
#   quick     pytest, typecheck, vitest
#   backend   pytest (+ golden), migraciones sobre base vacía si cambiaron, chequeo de fixtures
#   frontend  lint, typecheck, vitest, build
#   e2e       Playwright de frontend/e2e
#   parity    comparación visual de la fase (GATES_PHASE=NN)
#   all       todo lo anterior + tamaño del PR
# Cada gate se omite si su herramienta todavía no existe. Sale con el primer código no cero.
set -uo pipefail
source "$(dirname "$0")/lib.sh"
SCOPE="${1:-quick}"
PY="$ROOT/backend/.venv/bin/python"
RESULTS=()

run_gate() {
  local name="$1"; shift
  local out; out="$(mktemp)"
  if "$@" >"$out" 2>&1; then
    RESULTS+=("ok    $name")
  else
    local code=$?
    RESULTS+=("FALLA $name (código $code)")
    tail -40 "$out"
    rm -f "$out"
    summary
    exit "$code"
  fi
  rm -f "$out"
}

skip_gate() { RESULTS+=("--    $1 ($2)"); }
summary() { printf '%s\n' "${RESULTS[@]}"; }
npm_has_script() { (cd "$ROOT/frontend" && node -e "process.exit(require('./package.json').scripts['$1'] ? 0 : 1)"); }
# Cambios (commiteados, en el árbol o sin trackear) respecto de la base.
changed_since_base() {
  require_base
  [ -n "$(git -C "$ROOT" diff --name-only "$(git -C "$ROOT" merge-base HEAD "$BASE_REF")" -- "$1")$(git -C "$ROOT" ls-files --others --exclude-standard -- "$1")" ]
}

gate_pytest() {
  (cd "$ROOT" && DATABASE_URL="$(db_url "$TEST_DB")" "$PY" -m pytest backend/tests -q)
}

gate_migrations() {
  pg_admin "drop database if exists ${MIGRATIONS_DB}" && pg_admin "create database ${MIGRATIONS_DB} owner ${PG_USER}" \
    && (cd "$ROOT/backend" && DATABASE_URL="$(db_url "$MIGRATIONS_DB")" "$ROOT/backend/.venv/bin/alembic" upgrade head)
}

backend_gates() {
  run_gate pytest gate_pytest
  if [ "${GATES_MIGRATIONS:-}" = "1" ] || changed_since_base backend/db/migrations; then
    run_gate migraciones gate_migrations
  else
    skip_gate migraciones "sin cambios en backend/db/migrations"
  fi
  if [ -f "$ROOT/tools/fixtures/export.mjs" ]; then
    run_gate fixtures node "$ROOT/tools/fixtures/export.mjs" --check
    run_gate semántica node --test "$ROOT"/tools/fixtures/*.test.mjs
  else
    skip_gate fixtures "todavía no existe"
  fi
}

npm_gate() { (cd "$ROOT/frontend" && npm run --silent "$@"); }

frontend_gates() {
  if npm_has_script lint; then run_gate lint npm_gate lint; else skip_gate lint "sin script"; fi
  run_gate typecheck npm_gate typecheck
  run_gate vitest npm_gate test -- --run
  run_gate build npm_gate build
}

quick_gates() {
  run_gate pytest gate_pytest
  run_gate typecheck npm_gate typecheck
  run_gate vitest npm_gate test -- --run
}

e2e_gates() {
  if [ -d "$ROOT/frontend/e2e" ] && npm_has_script e2e; then run_gate e2e npm_gate e2e; else skip_gate e2e "todavía no existe"; fi
}

parity_gates() {
  if [ ! -f "$ROOT/tools/parity/run.mjs" ]; then skip_gate comparación "todavía no existe"; return; fi
  if [ -z "${GATES_PHASE:-}" ]; then skip_gate comparación "falta GATES_PHASE"; return; fi
  case "$GATES_PHASE" in *[!0-9]*) echo "GATES_PHASE debe ser un número: '$GATES_PHASE'"; exit 64 ;; esac
  # Hasta F18 no hay app candidata: el mockup se compara consigo mismo.
  local self=""; [ "$GATES_PHASE" -le 18 ] && self="--self"
  local gated=""; [ -z "$self" ] && gated="--gated"
  run_gate comparación node "$ROOT/tools/parity/run.mjs" --phase "$GATES_PHASE" $self $gated
  run_gate arnés npm --prefix "$ROOT/tools/parity" test --silent
}

case "$SCOPE" in
  quick) quick_gates ;;
  backend) backend_gates ;;
  frontend) frontend_gates ;;
  e2e) e2e_gates ;;
  parity) parity_gates ;;
  all) backend_gates; frontend_gates; e2e_gates; parity_gates; run_gate tamaño-pr "$ROOT/scripts/dev/pr-size.sh" ;;
  *) echo "alcance desconocido: $SCOPE (quick|backend|frontend|e2e|parity|all)"; exit 64 ;;
esac
summary
