#!/bin/bash

# setup_gcp_infrastructure.sh
# Automates all required GCP configurations for the Heterogeneous Schema Compiler

# Set strict mode
set -euo pipefail

# Check if project ID is provided
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <PROJECT_ID> <REGION>"
  echo "Example: $0 my-awesome-project us-central1"
  exit 1
fi

PROJECT_ID=$1
REGION=${2:-"us-central1"} # Default to us-central1 if not provided

echo "Setting active project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

echo "1. Enabling Required GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    pubsub.googleapis.com \
    storage.googleapis.com \
    firestore.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com \
    iam.googleapis.com

echo "2. Cloud Storage Setup..."
RAW_BUCKET="raw-uploads-${PROJECT_ID}"
PROCESSED_BUCKET="processed-outputs-${PROJECT_ID}"

# Create buckets (ignore error if exists)
echo "Creating buckets: ${RAW_BUCKET}, ${PROCESSED_BUCKET}"
gcloud storage buckets create gs://${RAW_BUCKET} --location=${REGION} || true
gcloud storage buckets create gs://${PROCESSED_BUCKET} --location=${REGION} || true

# Configure CORS for raw bucket
echo '[
    {
      "origin": ["http://localhost:3000", "https://localhost:3000"],
      "method": ["GET", "PUT", "POST", "OPTIONS"],
      "responseHeader": ["Content-Type", "x-goog-resumable"],
      "maxAgeSeconds": 3600
    }
]' > cors.json

echo "Applying CORS to ${RAW_BUCKET}..."
gcloud storage buckets update gs://${RAW_BUCKET} --cors-file=cors.json
rm cors.json

echo "3. Pub/Sub Setup..."
TOPIC_NAME="schema-transformation-jobs"
SUB_NAME="schema-transformation-sub"

echo "Creating Pub/Sub Topic: ${TOPIC_NAME}"
gcloud pubsub topics create ${TOPIC_NAME} || true

# We will create a PULL subscription for local dev, or PUSH if deploying to Cloud Run.
# For standard local dev / early stage, pull is easiest to test, but the prompt asks for
# push pointing to Cloud Run. I will create a PUSH sub later during deploy.sh when we have
# the Cloud Run URL. For now, creating a default pull sub.
echo "Creating Pub/Sub Pull Subscription (for local dev): ${SUB_NAME}"
gcloud pubsub subscriptions create ${SUB_NAME} --topic=${TOPIC_NAME} || true

echo "4. Firestore Database Setup..."
# Note: Initializing Firestore requires an App Engine app or a direct Native Mode DB.
# This CLI command attempts to create a native database.
echo "Creating Firestore Database in native mode..."
gcloud firestore databases create --location=${REGION} --type=firestore-native || true

echo "5. IAM & Service Account Configuration..."
SA_NAME="etl-backend-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Creating Service Account: ${SA_NAME}"
gcloud iam service-accounts create ${SA_NAME} \
    --description="Service Account for Backend and Worker" \
    --display-name="ETL Backend SA" || true

echo "Granting roles to ${SA_EMAIL}..."
ROLES=(
  "roles/storage.objectAdmin"
  "roles/pubsub.publisher"
  "roles/pubsub.subscriber"
  "roles/datastore.user"
  "roles/secretmanager.secretAccessor"
)

for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="${role}" \
      --condition=None
done

echo "6. Secrets Management..."
echo "Please enter your Gemini API Key:"
read -s GEMINI_API_KEY

echo "Storing gemini-api-key in Secret Manager..."
echo -n "${GEMINI_API_KEY}" | gcloud secrets create gemini-api-key \
    --data-file=- \
    --replication-policy="automatic" || \
echo -n "${GEMINI_API_KEY}" | gcloud secrets versions add gemini-api-key --data-file=-

echo "========================================="
echo "GCP Infrastructure Setup Complete!"
echo "Raw Uploads Bucket: gs://${RAW_BUCKET}"
echo "Processed Outputs Bucket: gs://${PROCESSED_BUCKET}"
echo "Pub/Sub Topic: ${TOPIC_NAME}"
echo "Service Account Email: ${SA_EMAIL}"
echo "========================================="
