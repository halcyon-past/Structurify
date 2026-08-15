variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The GCP Region for resources"
  type        = string
  default     = "us-central1"
}

variable "gemini_api_key" {
  description = "The API Key for Google Gemini"
  type        = string
  sensitive   = true
}
