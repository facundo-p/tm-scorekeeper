#!/usr/bin/env bash
# Prepara el entorno de desarrollo de forma idempotente (F15, v2.0).
# PostgreSQL 16 local, rol y bases de test, venv del backend, node_modules y chromium.
set -euo pipefail
source "$(dirname "$0")/lib.sh"

start_postgres() {
  if have pg_ctlcluster; then
    pg_ctlcluster 16 main start >/dev/null 2>&1 || true
    log "PostgreSQL 16: $(pg_lsclusters -h | awk '{print $4}' | head -1)"
  else
    log "pg_ctlcluster no está: se asume un PostgreSQL ya disponible en ${PG_HOST}:${PG_PORT}"
  fi
}

ensure_role_and_dbs() {
  if ! have psql; then log "psql no está: se omiten rol y bases"; return; fi
  if [ "$(pg_admin "select 1 from pg_roles where rolname='${PG_USER}'")" != "1" ]; then
    pg_admin "create role ${PG_USER} login superuser password '${PG_PASS}'"
    log "rol ${PG_USER} creado"
  fi
  for db in "$TEST_DB" "$PARITY_DB" "$MIGRATIONS_DB"; do
    if [ "$(pg_admin "select 1 from pg_database where datname='${db}'")" != "1" ]; then
      pg_admin "create database ${db} owner ${PG_USER}"
      log "base ${db} creada"
    fi
  done
}

ensure_venv() {
  local venv="$ROOT/backend/.venv" stamp="$ROOT/backend/.venv/.req-hash"
  local hash; hash="$(cat "$ROOT/backend/requirements.txt" "$ROOT/backend/requirements-dev.txt" | sha256sum | cut -d' ' -f1)"
  [ -x "$venv/bin/python" ] || python3 -m venv "$venv"
  if [ "$(cat "$stamp" 2>/dev/null)" != "$hash" ]; then
    "$venv/bin/pip" install -q --disable-pip-version-check -r "$ROOT/backend/requirements-dev.txt"
    echo "$hash" > "$stamp"
    log "dependencias de Python instaladas"
  fi
}

# npm ci solo si cambió el lockfile del paquete ($1).
ensure_node_modules() {
  local dir="$1" stamp="$1/node_modules/.lock-hash" hash
  [ -f "$dir/package-lock.json" ] || return 0
  hash="$(file_hash "$dir/package-lock.json")"
  if [ "$(cat "$stamp" 2>/dev/null)" != "$hash" ]; then
    (cd "$dir" && npm ci --silent --no-audit --no-fund)
    echo "$hash" > "$stamp"
    log "npm ci en ${dir#"$ROOT"/}"
  fi
}

find_chromium() {
  local base="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"
  if [ -n "${PARITY_CHROMIUM:-}" ] && [ -x "$PARITY_CHROMIUM" ]; then echo "$PARITY_CHROMIUM"; return; fi
  find "$base" -maxdepth 4 -type f -name chrome -path '*chromium-*' 2>/dev/null | sort | tail -1
}

write_env_agent() {
  local chromium; chromium="$(find_chromium || true)"
  [ -n "$chromium" ] || log "AVISO: no se encontró chromium (la comparación visual no va a correr)"
  cat > "$ROOT/.env.agent" <<ENV
# Generado por scripts/dev/bootstrap.sh — no se commitea.
DATABASE_URL=$(db_url "$TEST_DB")
PARITY_DATABASE_URL=$(db_url "$PARITY_DB")
MIGRATIONS_DATABASE_URL=$(db_url "$MIGRATIONS_DB")
PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
PARITY_CHROMIUM=${chromium}
ENV
}

start_postgres
ensure_role_and_dbs
ensure_venv
ensure_node_modules "$ROOT/frontend"
ensure_node_modules "$ROOT/tools/parity"
write_env_agent
log "listo"
