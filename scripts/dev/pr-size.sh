#!/usr/bin/env bash
# Líneas cambiadas del PR contra la base, sin contar archivos generados ni binarios.
# Sale con 1 si supera el máximo (la fase se parte en NN.1, NN.2…).
set -euo pipefail
source "$(dirname "$0")/lib.sh"
MAX="${PR_SIZE_MAX:-3000}"

EXCLUDES=(
  ':(exclude)fixtures/**' ':(exclude)**/fixtures/**'
  ':(exclude)**/fonts/**' ':(exclude)**/*.woff2' ':(exclude)**/*.woff' ':(exclude)**/*.ttf'
  ':(exclude)**/package-lock.json' ':(exclude)**/*.lock'
  ':(exclude)**/*shaders*'
  ':(exclude)docs/redesign/screens/**' ':(exclude)**/*.png' ':(exclude)**/*.jpg'
)

cd "$ROOT"
require_base
total="$(git diff --numstat "$(git merge-base HEAD "$BASE_REF")" -- . "${EXCLUDES[@]}" \
  | awk '$1 != "-" { s += $1 + $2 } END { print s + 0 }')"
if [ "$total" -gt "$MAX" ]; then
  log "PR de ${total} líneas: supera el máximo de ${MAX}. Partir la fase en NN.1, NN.2…"
  exit 1
fi
log "${total} líneas cambiadas (máximo ${MAX})"
