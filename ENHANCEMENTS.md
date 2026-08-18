# Structurify Enhancement Plan

Based on the current architecture and feature set of Structurify, here is a comprehensive list of enhancements, new features, and infrastructure improvements that can take the platform to the next level. These are broken down by category:

## 1. AI & Data Pipeline Enhancements
*   **Multi sheet support:** Add support for multiple sheets inside a single xlsx workbook.
*   **Custom Prompting & Transformation Rules:** Allow users to provide natural language instructions alongside their schema (e.g., "Always capitalize the first letter of company names", "Format all dates as YYYY-MM-DD").
*   **Schema Templates Library:** Add a library of pre-built schema templates (e.g., "E-commerce Orders", "CRM Contacts", "Healthcare Records") directly within the UI builder.

## 2. Frontend & User Experience (UX)
*   **Sandbox / Instant Preview Mode:** Allow users to upload a massive file, but run a "Preview" on the first 10 rows. This gives them instant visual feedback on whether their schema works before committing to a long-running, token-heavy job.
*   **Advanced Visual Schema Builder:** Enhance the schema builder to support nested JSON objects, arrays, and complex validation rules (Regex).
*   **Full Team Workspaces:** Expand upon the existing multi-tenant authentication foundation to provide full UI support for switching workspaces, sharing schemas, and consolidated team billing.

## 3. Backend & Infrastructure
*   **Rate Limiting & Quotas:** Implement Redis (or Google Cloud Memorystore) at the FastAPI Gateway layer to enforce strict API rate limits (by IP or API Key) and prevent DDOS or abuse before requests hit Pub/Sub.
*   **PII & Data Redaction Layer:** Integrate Google Cloud DLP (Data Loss Prevention) as a pre-processing step to detect and mask sensitive information (SSN, credit cards) before sending data to the LLM.
*   **Developer API Dashboard:** Provide authenticated users with their own API keys, webhook configurations, and API usage analytics so they can integrate Structurify directly into their own automated workflows.

## 4. Developer Experience (DX) & Ops
*   **Error Monitoring & Alerting:** Integrate tools like Sentry into the FastAPI backend and Cloud Run workers to capture unhandled exceptions and alert developers in real-time via Email or Slack.
*   **Stripe Billing Integration:** Connect the newly added Firestore subscription schema tracking fields directly to Stripe's billing engine to offer tiered SaaS plans (e.g., Pay-as-you-go based on rows/tokens processed).
