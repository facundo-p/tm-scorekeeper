# Utilidades compartidas por los scripts de desarrollo (se incluye con `source`).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PG_USER="${PG_USER:-tm_user}"
PG_PASS="${PG_PASS:-tm_pass}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
TEST_DB="${TEST_DB:-tm_scorekeeper_test}"
PARITY_DB="${PARITY_DB:-tm_parity}"
MIGRATIONS_DB="${MIGRATIONS_DB:-tm_migrations_test}"
BASE_REF="${BASE_REF:-origin/staging}"

db_url() { echo "postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/$1"; }
log() { printf '[%s] %s\n' "$(basename "$0" .sh)" "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }

# Hash de un archivo, o vacío si no existe.
file_hash() { [ -f "$1" ] && sha256sum "$1" | cut -d' ' -f1 || true; }

# psql como superusuario postgres (cloud: corremos como root).
pg_admin() {
  if [ "$(id -u)" = "0" ] && id postgres >/dev/null 2>&1; then
    su postgres -c "psql -v ON_ERROR_STOP=1 -qtAc \"$1\""
  else
    psql -v ON_ERROR_STOP=1 -qtAc "$1"
  fi
}
