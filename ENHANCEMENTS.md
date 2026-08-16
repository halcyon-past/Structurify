# Structurify Enhancement Plan

Based on the current architecture and feature set of Structurify, here is a comprehensive list of enhancements, new features, and infrastructure improvements that can take the platform to the next level. These are broken down by category:

## 1. AI & Data Pipeline Enhancements
*   **Multi sheet support:** Add support for multiple sheets inside a single xlsx workbook.
*   **Custom Prompting & Transformation Rules:** Allow users to provide natural language instructions alongside their schema (e.g., "Always capitalize the first letter of company names", "Format all dates as YYYY-MM-DD").

## 2. Frontend & User Experience (UX)
*   **Sandbox / Instant Preview Mode:** Allow users to upload a massive file, but run a "Preview" on the first 10 rows. This gives them instant visual feedback on whether their schema works before committing to a long-running, token-heavy job.
*   **Advanced Visual Schema Builder:** Enhance the schema builder to support nested JSON objects, arrays, and complex validation rules (Regex). Add a library of pre-built schema templates (e.g., "E-commerce Orders", "CRM Contacts", "Healthcare Records").
*   **Developer API Dashboard:** Provide authenticated users with their own API keys, webhook configurations, and API usage analytics so they can integrate Structurify directly into their own automated workflows.
*   **User Job History & Workspaces:** Give normal users a dashboard to view their historical jobs, download past outputs, and retry failed jobs. Introduce "Team Workspaces" so multiple users in a company can share schemas and billing.

## 3. Backend & Infrastructure
*   **Rate Limiting & Quotas:** Implement Redis (or Google Cloud Memorystore) at the FastAPI Gateway layer to enforce strict API rate limits (by IP or API Key) and prevent DDOS or abuse before requests hit Pub/Sub.
*   **PII & Data Redaction Layer:** Integrate Google Cloud DLP (Data Loss Prevention) as a pre-processing step to detect and mask sensitive information (SSN, credit cards) before sending data to the LLM.

## 4. Developer Experience (DX) & Ops
*   **Infrastructure as Code (IaC) with Terraform:** Replace the `setup_gcp_infrastructure.sh` bash script with Terraform. This provides stateful, version-controlled, and reproducible cloud environments.
*   **Error Monitoring & Alerting:** Integrate tools like Sentry into the FastAPI backend and Cloud Run workers to capture unhandled exceptions and alert developers in real-time via Email
*   **Stripe Billing Integration:** Connect the Firestore token usage logs to a billing engine like Stripe to offer tiered SaaS plans (e.g., Pay-as-you-go based on rows/tokens processed).

## 5. Security & Authentication
*   **OAuth / SSO Integration:** Implement Google OAuth, GitHub, or Enterprise SSO (SAML/Okta) using Firebase Authentication for frictionless sign-ups and enterprise compliance.