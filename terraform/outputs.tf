output "raw_uploads_bucket_name" {
  description = "The name of the raw uploads bucket"
  value       = google_storage_bucket.raw_uploads.name
}

output "processed_outputs_bucket_name" {
  description = "The name of the processed outputs bucket"
  value       = google_storage_bucket.processed_outputs.name
}

output "pubsub_topic_name" {
  description = "The name of the Pub/Sub topic"
  value       = google_pubsub_topic.schema_transformation_jobs.name
}

output "service_account_email" {
  description = "The email of the ETL backend service account"
  value       = google_service_account.etl_backend_sa.email
}

output "firestore_database_name" {
  description = "The name of the Firestore database"
  value       = google_firestore_database.database.name
}
