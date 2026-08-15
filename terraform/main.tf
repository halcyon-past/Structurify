# 1. Enable Required GCP APIs
locals {
  services = [
    "run.googleapis.com",
    "pubsub.googleapis.com",
    "storage.googleapis.com",
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com"
  ]
}

resource "google_project_service" "enabled_apis" {
  for_each                   = toset(local.services)
  project                    = var.project_id
  service                    = each.key
  disable_on_destroy         = false
  disable_dependent_services = false
}

# 2. Cloud Storage Setup
resource "google_storage_bucket" "raw_uploads" {
  name                        = "raw-uploads-${var.project_id}"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true

  cors {
    origin          = ["http://localhost:3000", "https://localhost:3000", "https://structurify.web.app", "https://structurify-504821.web.app"]
    method          = ["GET", "PUT", "POST", "OPTIONS"]
    response_header = ["Content-Type", "x-goog-resumable"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.enabled_apis]
}

resource "google_storage_bucket" "processed_outputs" {
  name                        = "processed-outputs-${var.project_id}"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true

  depends_on = [google_project_service.enabled_apis]
}

# 3. Pub/Sub Setup
resource "google_pubsub_topic" "schema_transformation_jobs" {
  name = "schema-transformation-jobs"

  depends_on = [google_project_service.enabled_apis]
}

resource "google_pubsub_subscription" "schema_transformation_sub" {
  name  = "schema-transformation-sub"
  topic = google_pubsub_topic.schema_transformation_jobs.name

  # Creating a PULL subscription for local dev as originally done in bash script
  message_retention_duration = "604800s" # 7 days
}

resource "google_pubsub_topic" "chunk_processing_jobs" {
  name = "chunk-processing-jobs"

  depends_on = [google_project_service.enabled_apis]
}

# 4. Firestore Database Setup
resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.enabled_apis]
}

# 5. IAM & Service Account Configuration
resource "google_service_account" "etl_backend_sa" {
  account_id   = "etl-backend-sa"
  display_name = "ETL Backend SA"
  description  = "Service Account for Backend and Worker"
}

resource "google_service_account" "pubsub_invoker_sa" {
  account_id   = "pubsub-invoker-sa"
  display_name = "Pub/Sub Invoker SA"
  description  = "Service Account used by Pub/Sub push subscriptions to invoke Cloud Run worker"
}

locals {
  sa_roles = [
    "roles/storage.objectAdmin",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber",
    "roles/datastore.user",
    "roles/secretmanager.secretAccessor"
  ]
}

resource "google_project_iam_member" "sa_role_bindings" {
  for_each = toset(local.sa_roles)
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.etl_backend_sa.email}"
}

# 6. Secrets Management
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key"
  replication {
    auto {}
  }

  depends_on = [google_project_service.enabled_apis]
}

resource "google_secret_manager_secret_version" "gemini_api_key_version" {
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = var.gemini_api_key
}
