#!/bin/bash

# deploy.sh
# Automates the build and deployment of the Structurify Backend and Worker to Google Cloud Run

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <PROJECT_ID> <REGION>"
  echo "Example: $0 my-awesome-project us-central1"
  exit 1
fi

PROJECT_ID=$1
REGION=${2:-"us-central1"}
REPO_NAME="structurify-repo"
BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/backend"
WORKER_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/worker"
SA_EMAIL="etl-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Setting active project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

echo "1. Creating Artifact Registry Repository (if it doesn't exist)..."
gcloud artifacts repositories create ${REPO_NAME} \
  --repository-format=docker \
  --location=${REGION} \
  --description="Docker repository for Structurify" || true

echo "2. Building and Deploying Backend (FastAPI)..."
cd backend
gcloud builds submit --tag ${BACKEND_IMAGE} .
gcloud run deploy structurify-backend \
  --image ${BACKEND_IMAGE} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --service-account ${SA_EMAIL} \
  --update-env-vars GOOGLE_CLOUD_PROJECT=${PROJECT_ID},RAW_BUCKET_NAME=raw-uploads-${PROJECT_ID},PUBSUB_TOPIC_ID=schema-transformation-jobs
cd ..

echo "3. Building and Deploying Worker (Processing Engine)..."
cd worker
gcloud builds submit --tag ${WORKER_IMAGE} .
gcloud run deploy structurify-worker \
  --image ${WORKER_IMAGE} \
  --platform managed \
  --region ${REGION} \
  --no-allow-unauthenticated \
  --service-account ${SA_EMAIL} \
  --update-env-vars GOOGLE_CLOUD_PROJECT=${PROJECT_ID},RAW_BUCKET_NAME=raw-uploads-${PROJECT_ID},PROCESSED_BUCKET_NAME=processed-outputs-${PROJECT_ID},FRONTEND_URL=https://structurify.web.app \
  --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --memory=2Gi \
  --timeout=3600s
cd ..

echo "4. Setting up Pub/Sub Push Subscription..."
# Get the URL of the deployed worker
WORKER_URL=$(gcloud run services describe structurify-worker --platform managed --region ${REGION} --format 'value(status.url)')

# Create a service account for Pub/Sub to invoke the worker
PUBSUB_SA="pubsub-invoker-sa"
PUBSUB_SA_EMAIL="${PUBSUB_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create ${PUBSUB_SA} \
  --display-name "Pub/Sub Invoker SA" || true

# Grant permission to invoke the worker Cloud Run service
gcloud run services add-iam-policy-binding structurify-worker \
  --region ${REGION} \
  --member=serviceAccount:${PUBSUB_SA_EMAIL} \
  --role=roles/run.invoker

# Create or update the push subscription
gcloud pubsub subscriptions create schema-transformation-sub-push \
  --topic=schema-transformation-jobs \
  --push-endpoint="${WORKER_URL}/process-job" \
  --push-auth-service-account="${PUBSUB_SA_EMAIL}" \
  --ack-deadline=600 || \
gcloud pubsub subscriptions update schema-transformation-sub-push \
  --push-endpoint="${WORKER_URL}/process-job" \
  --push-auth-service-account="${PUBSUB_SA_EMAIL}"

echo "5. Setting up Chunk Processing Pub/Sub Push Subscription..."
gcloud pubsub topics create chunk-processing-jobs || true

gcloud pubsub subscriptions create chunk-processing-sub-push \
  --topic=chunk-processing-jobs \
  --push-endpoint="${WORKER_URL}/process-chunk" \
  --push-auth-service-account="${PUBSUB_SA_EMAIL}" \
  --ack-deadline=600 || \
gcloud pubsub subscriptions update chunk-processing-sub-push \
  --push-endpoint="${WORKER_URL}/process-chunk" \
  --push-auth-service-account="${PUBSUB_SA_EMAIL}"

echo "6. Building and Deploying Frontend to Firebase Hosting..."
cd frontend
npm ci
npm run build
npx firebase deploy --only hosting --project ${PROJECT_ID}
cd ..

echo "========================================="
echo "Deployment Complete!"
echo "Backend URL: $(gcloud run services describe structurify-backend --platform managed --region ${REGION} --format 'value(status.url)')"
echo "Worker URL: ${WORKER_URL}"
echo "========================================="
