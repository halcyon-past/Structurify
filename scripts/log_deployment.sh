#!/bin/bash
set -e

PROJECT_ID=$1
SERVICE=$2
STATUS=$3
COMMIT=${4:-"unknown"}
ACTOR=${5:-"local-user"}
LOG_URL=${6:-""}

if [ -z "$PROJECT_ID" ] || [ -z "$SERVICE" ] || [ -z "$STATUS" ]; then
  echo "Usage: ./log_deployment.sh <PROJECT_ID> <SERVICE> <STATUS> [COMMIT] [ACTOR] [LOG_URL]"
  exit 1
fi

TOKEN=$(gcloud auth print-access-token)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "service": { "stringValue": "'"$SERVICE"'" },
      "status": { "stringValue": "'"$STATUS"'" },
      "commit": { "stringValue": "'"$COMMIT"'" },
      "actor": { "stringValue": "'"$ACTOR"'" },
      "log_url": { "stringValue": "'"$LOG_URL"'" },
      "timestamp": { "timestampValue": "'"$TIMESTAMP"'" }
    }
  }' \
  "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/deployments" > /dev/null

echo "✅ Logged deployment for $SERVICE: $STATUS"
