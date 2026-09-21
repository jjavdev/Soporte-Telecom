#!/usr/bin/env bash
# Levanta n8n (Docker), importa y activa el workflow del chatbot.
# Uso: bash scripts/setup-n8n.sh
set -euo pipefail
cd "$(dirname "$0")/.."

WORKFLOW="n8n-workflows/04-chatbot-nivel1.json"
CONTAINER="n8n-soporte"
URL="http://localhost:5678"

echo "==> Levantando n8n (docker compose up -d)"
docker compose up -d

echo "==> Esperando a n8n en ${URL} ..."
for _ in $(seq 1 60); do
  if curl -s -o /dev/null "${URL}/healthz" || curl -s -o /dev/null "${URL}/"; then
    break
  fi
  sleep 2
done

echo "==> Importando workflow"
docker cp "$WORKFLOW" "${CONTAINER}:/tmp/workflow.json"
docker exec "$CONTAINER" n8n import:workflow --input=/tmp/workflow.json

ID=$(python3 -c "import json,sys;print(json.load(open('$WORKFLOW'))['id'])" 2>/dev/null || true)
if [ -z "${ID}" ]; then
  echo "No se pudo obtener el ID del workflow (revisa el campo 'id' del JSON)"; exit 1
fi

echo "==> Publicando/activando workflow ${ID}"
docker exec "$CONTAINER" n8n publish:workflow --id="${ID}" || \
  docker exec "$CONTAINER" n8n update:workflow --id="${ID}" --active=true || true

docker restart "$CONTAINER" >/dev/null
echo "==> Listo. Webhook: ${URL}/webhook/chatbot"
echo "    Prueba:  curl -X POST ${URL}/webhook/chatbot -H 'Content-Type: application/json' -d '{\"message\":\"Hola\"}'"
