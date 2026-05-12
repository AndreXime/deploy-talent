#!/bin/sh
set -eu

HOST="${MINIO_HOST:-minio}"
PORT="${MINIO_PORT:-9000}"
USER="${MINIO_ROOT_USER:?}"
PASS="${MINIO_ROOT_PASSWORD:?}"

until mc alias set local "http://${HOST}:${PORT}" "$USER" "$PASS" >/dev/null 2>&1; do
  sleep 1
done

mc mb "local/files" --ignore-existing
# CORS é best-effort: versões recentes do mc removeram este comando. Não falhamos
# o setup por causa disso — o bucket é o essencial.
mc cors set "local/files" /config/cors.xml || echo "[MinIO: cors set skipped]"
echo "--- [MinIO: bucket configurado] ---"
