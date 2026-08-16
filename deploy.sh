#!/bin/bash

# deploy.sh
# Automates the build and deployment of the Structurify Backend, Worker, and Frontend

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <PROJECT_ID> [REGION] [SERVICE]"
  echo "Example: $0 structurify-504821 us-central1 backend"
  echo "Available services: all (default), backend, worker, frontend"
  exit 1
fi

PROJECT_ID=$1
REGION=${2:-"us-central1"}
TARGET_SERVICE=${3:-"all"}

REPO_NAME="structurify-repo"
BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend"
WORKER_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/worker"
SA_EMAIL="etl-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"
LOCAL_ACTOR=$(whoami)
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "local")

echo "Setting active project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Ensure Artifact Registry exists
gcloud artifacts repositories create ${REPO_NAME} \
  --repository-format=docker \
  --location=${REGION} \
  --description="Docker repository for Structurify" 2>/dev/null || true

# --- BACKEND DEPLOYMENT ---
if [ "$TARGET_SERVICE" == "all" ] || [ "$TARGET_SERVICE" == "backend" ]; then
  echo "🚀 Building and Deploying Backend (FastAPI)..."
  if cd backend && gcloud builds submit --tag ${BACKEND_IMAGE} . && \
     gcloud run deploy structurify-backend \
       --image ${BACKEND_IMAGE} \
       --platform managed \
       --region ${REGION} \
       --allow-unauthenticated \
       --service-account ${SA_EMAIL} \
       --update-env-vars GOOGLE_CLOUD_PROJECT=${PROJECT_ID},RAW_BUCKET_NAME=raw-uploads-${PROJECT_ID},PUBSUB_TOPIC_ID=schema-transformation-jobs; then
    cd ..
    ./scripts/log_deployment.sh $PROJECT_ID backend success $COMMIT_HASH $LOCAL_ACTOR "https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
  else
    cd ..
    ./scripts/log_deployment.sh $PROJECT_ID backend failed $COMMIT_HASH $LOCAL_ACTOR "https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
    exit 1
  fi
fi

# --- WORKER DEPLOYMENT ---
if [ "$TARGET_SERVICE" == "all" ] || [ "$TARGET_SERVICE" == "worker" ]; then
  echo "🚀 Building and Deploying Worker (Processing Engine)..."
  if cd worker && gcloud builds submit --tag ${WORKER_IMAGE} . && \
     gcloud run deploy structurify-worker \
       --image ${WORKER_IMAGE} \
       --platform managed \
       --region ${REGION} \
       --no-allow-unauthenticated \
       --service-account ${SA_EMAIL} \
       --update-env-vars GOOGLE_CLOUD_PROJECT=${PROJECT_ID},RAW_BUCKET_NAME=raw-uploads-${PROJECT_ID},PROCESSED_BUCKET_NAME=processed-outputs-${PROJECT_ID},FRONTEND_URL=https://structurify.web.app \
       --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
       --memory=2Gi \
       --timeout=3600s; then
    cd ..
    
    # Configure Pub/Sub Push Subscriptions
    WORKER_URL=$(gcloud run services describe structurify-worker --platform managed --region ${REGION} --format 'value(status.url)')
    PUBSUB_SA="pubsub-invoker-sa"
    PUBSUB_SA_EMAIL="${PUBSUB_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

    gcloud iam service-accounts create ${PUBSUB_SA} --display-name "Pub/Sub Invoker SA" 2>/dev/null || true
    gcloud run services add-iam-policy-binding structurify-worker --region ${REGION} --member=serviceAccount:${PUBSUB_SA_EMAIL} --role=roles/run.invoker 2>/dev/null || true

    gcloud pubsub subscriptions create schema-transformation-sub-push --topic=schema-transformation-jobs --push-endpoint="${WORKER_URL}/process-job" --push-auth-service-account="${PUBSUB_SA_EMAIL}" --push-auth-token-audience="${WORKER_URL}" --ack-deadline=600 2>/dev/null || \
    gcloud pubsub subscriptions update schema-transformation-sub-push --push-endpoint="${WORKER_URL}/process-job" --push-auth-service-account="${PUBSUB_SA_EMAIL}" --push-auth-token-audience="${WORKER_URL}"

    gcloud pubsub topics create chunk-processing-jobs 2>/dev/null || true
    gcloud pubsub subscriptions create chunk-processing-sub-push --topic=chunk-processing-jobs --push-endpoint="${WORKER_URL}/process-chunk" --push-auth-service-account="${PUBSUB_SA_EMAIL}" --push-auth-token-audience="${WORKER_URL}" --ack-deadline=600 2>/dev/null || \
    gcloud pubsub subscriptions update chunk-processing-sub-push --push-endpoint="${WORKER_URL}/process-chunk" --push-auth-service-account="${PUBSUB_SA_EMAIL}" --push-auth-token-audience="${WORKER_URL}"
    
    ./scripts/log_deployment.sh $PROJECT_ID worker success $COMMIT_HASH $LOCAL_ACTOR "https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
  else
    cd ..
    ./scripts/log_deployment.sh $PROJECT_ID worker failed $COMMIT_HASH $LOCAL_ACTOR "https://console.cloud.google.com/cloud-build/builds?project=${PROJECT_ID}"
    exit 1
  fi
fi

# --- FRONTEND DEPLOYMENT ---
if [ "$TARGET_SERVICE" == "all" ] || [ "$TARGET_SERVICE" == "frontend" ]; then
  echo "🚀 Building and Deploying Frontend to Firebase Hosting..."
  if cd frontend && npm ci && npm run build && npx firebase deploy --only hosting --project ${PROJECT_ID}; then
    cd ..
    ./scripts/log_deployment.sh $PROJECT_ID frontend success $COMMIT_HASH $LOCAL_ACTOR "https://console.firebase.google.com/project/${PROJECT_ID}/hosting/sites"
  else
    cd ..
    ./scripts/log_deployment.sh $PROJECT_ID frontend failed $COMMIT_HASH $LOCAL_ACTOR "https://console.firebase.google.com/project/${PROJECT_ID}/hosting/sites"
    exit 1
  fi
fi

echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
