# Structurify Enhancement Plan

Based on the current architecture and feature set of Structurify, here is a comprehensive list of enhancements, new features, and infrastructure improvements that can take the platform to the next level. These are broken down by category:

## 1. AI & Data Pipeline Enhancements
*   **Multimodal File Support (PDF, Images, Word):** Since the system uses Gemini 2.5 Flash (which is multimodal), you can extend support beyond CSV/XLSX to process unstructured PDFs (invoices, receipts), images (OCR), and Word documents natively.
*   **Intelligent Model Routing:** Use Gemini 2.5 Flash as the default, but implement a fallback mechanism in the LangGraph node to route highly complex, ambiguous, or failed chunks to a more capable model (like Gemini 1.5 Pro or 2.5 Pro). Simple rows could even be routed to Flash-8B to reduce costs.
*   **Custom Prompting & Transformation Rules:** Allow users to provide natural language instructions alongside their schema (e.g., "Always capitalize the first letter of company names", "Format all dates as YYYY-MM-DD").
*   **Human-in-the-Loop (HITL) Review:** If a chunk fails LangGraph's max retries or falls below a confidence threshold, flag those specific rows in a UI "Review Queue" for manual human correction rather than dropping them or hallucinating.
*   **Export to Data Warehouses:** Add sinks to export the finalized clean data directly into Google BigQuery, Snowflake, Amazon S3, or a PostgreSQL database rather than just providing a `.zip` download.

## 2. Frontend & User Experience (UX)
*   **Sandbox / Instant Preview Mode:** Allow users to upload a massive file, but run a "Preview" on the first 10 rows. This gives them instant visual feedback on whether their schema works before committing to a long-running, token-heavy job.
*   **Advanced Visual Schema Builder:** Enhance the schema builder to support nested JSON objects, arrays, and complex validation rules (Regex). Add a library of pre-built schema templates (e.g., "E-commerce Orders", "CRM Contacts", "Healthcare Records").
*   **Developer API Dashboard:** Provide authenticated users with their own API keys, webhook configurations, and API usage analytics so they can integrate Structurify directly into their own automated workflows.
*   **User Job History & Workspaces:** Give normal users a dashboard to view their historical jobs, download past outputs, and retry failed jobs. Introduce "Team Workspaces" so multiple users in a company can share schemas and billing.

## 3. Backend & Infrastructure
*   **Webhook & Streaming Delivery:** Instead of waiting for the entire reducer to finish and emailing a ZIP file, allow users to configure webhooks to receive structured data row-by-row or chunk-by-chunk in real-time.
*   **Rate Limiting & Quotas:** Implement Redis (or Google Cloud Memorystore) at the FastAPI Gateway layer to enforce strict API rate limits (by IP or API Key) and prevent DDOS or abuse before requests hit Pub/Sub.
*   **Multi-Region Deployment (Data Residency):** Deploy Cloud Run workers in multiple regions (e.g., EU, Asia) and route files based on the user's location to comply with data residency laws like GDPR.
*   **PII & Data Redaction Layer:** Integrate Google Cloud DLP (Data Loss Prevention) as a pre-processing step to detect and mask sensitive information (SSN, credit cards) before sending data to the LLM.

## 4. Developer Experience (DX) & Ops
*   **Infrastructure as Code (IaC) with Terraform:** Replace the `setup_gcp_infrastructure.sh` bash script with Terraform or OpenTofu. This provides stateful, version-controlled, and reproducible cloud environments.
*   **GitHub Actions CI/CD:** Replace the local `deploy.sh` script with automated GitHub Actions workflows that run `pytest`, linting, and automatically deploy to staging/production on branch merges.
*   **Error Monitoring & Alerting:** Integrate tools like Sentry into the FastAPI backend and Cloud Run workers to capture unhandled exceptions and alert developers in real-time via Slack/Discord.
*   **Stripe Billing Integration:** Connect the Firestore token usage logs to a billing engine like Stripe to offer tiered SaaS plans (e.g., Pay-as-you-go based on rows/tokens processed).

## 5. Security & Authentication
*   **OAuth / SSO Integration:** Implement Google OAuth, GitHub, or Enterprise SSO (SAML/Okta) using Firebase Authentication for frictionless sign-ups and enterprise compliance.
*   **Signed URLs for Downloads:** Ensure the `.zip` download links are securely generated Presigned Cloud Storage URLs with a short expiration time (e.g., 1 hour) to prevent data leakage.
