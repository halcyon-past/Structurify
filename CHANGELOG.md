# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-08-18
### Added
- **Sandbox Preview Mode**: Added a preview-only mode that processes just the first 10 rows of a file so users can validate schema fit and transformation quality before committing to a full long-running job. This significantly reduces wasted tokens and improves trust for first-time users.
  - The UI now features a "Run Preview" action.
  - Preview jobs are flagged in the pipeline UI, skipping heavy processing.
  - The completion screen for preview mode prompts users to launch a full job if the results are satisfactory.
- **Custom Toast Notifications**: Replaced all native browser `alert()` and `confirm()` dialogues across the application with non-blocking, stylish `react-hot-toast` notifications.
- **Admin Dashboard UI Update**: Moved the Admin button out of the main header and into the profile dropdown menu to streamline navigation and keep administrative functions discreetly accessible to verified admins and owners.

## [2.3.0] - 2026-08-17
### Added
- **Enterprise SSO Support**: Introduced support for Enterprise SSO via SAML and OIDC through Firebase Identity Platform.
- **Multi-Tenant Workspaces**: Integrated `tenantId` mapping into the authentication flow. Enterprise SSO users will have their tenant IDs injected into their session, automatically preserving multi-tenant isolation and securely mapping them into the `workspaces` array in their user profile.
- **Explicit Account Linking**: Implemented `linkAccount` functionality and enhanced error handling to proactively detect identity conflicts (`auth/account-exists-with-different-credential`). The system now prompts users for proper conflict resolution and account merging.
- **Comprehensive Jest Coverage**: Added full unit test coverage for the Next.js `useAuth` hook, rigorously testing Google login, SAML/SSO tenant logins, and authorization data mapping.

## [2.2.0] - 2026-08-16
### Added
- **Job Cancellation Directly from History**: Users (both registered and guests) can now seamlessly cancel running jobs directly from their extraction history dashboard.
- **Dynamic HTML Email Redesign**: All system emails (Success, Started, Cancelled) have been redesigned into beautiful dark-mode friendly HTML templates that dynamically feature rich metadata, including files processed, duration, and AI-generated dataset summaries.
- **Subscription Architecture Foundation**: Pre-wired the `users` Firestore collection to natively track upcoming subscription fields (`subscription_status`, `payment_date`, `validity`, etc.) to pave the way for structured payment plans.
- **Secure Backend API Authentication**: Implemented hybrid Firebase Auth JWT verification on the backend to securely protect the `cancel_job` and `kill_switch` endpoints from unauthorized tampering, whilst safely accommodating unauthenticated guest users.
- Added explicit domain whitelisting across all internal Google Cloud Storage bucket CORS policies.

### Changed
- **Global Typography Overhaul**: Migrated the entire application font stack to Google's `Space Grotesk` (sans-serif) and `JetBrains Mono` (monospace) for a more technical, sleek, and modern aesthetic.
- **Seamless Global Navigation**: Refined the global header UI by removing the rigid boxed layout in favor of a seamlessly integrated relative flow. Replaced the pill-shaped UI buttons with clean rounded rectangles and introduced a user profile dropdown menu.
- **Renamed Changelog to Releases**: The Changelog tab in the UI documentation system has been renamed to "Releases" for better clarity.
- Lowered the threshold for triggering asynchronous email notifications from `5MB` down to `1MB` to provide users with tracking links sooner.

### Fixed
- Fixed an authentication bug that caused Cloud Run backend deployments to silently crash on startup due to uninitialized Firebase Admin SDKs.
- Fixed a strict TypeScript ESLint build failure in the Admin Portal regarding the `any` keyword in `catch` blocks.

## [2.1.0] - 2026-08-16
### Added
- **Automated Cancellation Emails**: The backend now seamlessly triggers a graceful Pub/Sub task to send users a "Job Cancelled" email whenever they manually cancel an extraction, or when the Admin Global Kill Switch purges the system.
- **Enhanced Documentation**: Overhauled the Live Markdown Documentation with updated Mermaid.js architecture diagrams, and explicitly detailed email triggers and admin portal capabilities.
- Renamed the 'Changelog' tab inside the Documentation portal to **Releases**.
- **Dynamic Prompt Management**: All AI system instructions and user prompts (Auto-Clean, Schema Mapping, Metadata Generation) have been moved to Firestore, allowing admins to edit AI behavior directly from the Admin portal.
- **Dynamic Configuration Engine**: Moved critical runtime settings (Gemini LLM model, chunk sizes) to Firestore, allowing admins to instantly hot-swap models directly from the UI without redeploying code.
- **Deployment History Dashboard**: Added a new tab in the Admin Portal to track all frontend, backend, and worker deployments with direct links to Cloud Build/Firebase logs.
- **Detailed Audit Context**: The Live System Feed now dynamically drops down to reveal fatal error stack traces, processed filenames, used tokens, and Cloud Run revision hashes for crashed jobs.
- **Average Extraction Speed KPI**: Added a new platform health metric calculating the true average time to process a successful row across the entire system.
- Comprehensive `DEPLOYMENT.md` architecture guide detailing the CI/CD pipeline and observability stack.
### Changed
- **Refined Global Header**: Redesigned the main navigation header to utilize a sticky frosted glassmorphism effect (`fixed`, `backdrop-blur-xl`), and exposed the 'Docs' button to all users, including unauthenticated guests.
- Refactored the **Admin Settings UI** to utilize a local state and a dedicated "Save Changes" button, preventing accidental live configuration updates.
- Restyled the **Global Kill Switch** into a highly prominent primary action button below the main header to prevent navbar overflow on mobile devices and emphasize its destructive nature.
- `deploy.sh` script rewritten to accept optional target services (`frontend`, `backend`, `worker`) and seamlessly log local deployments directly to Firestore.
- Firestore Security Rules updated to grant Admins explicit read access to `job_audits` and `deployments` collections.
### Fixed
- Fixed an invisible Firestore query index filtering bug that caused the Live System Feed to silently return "No recent activity found".
- Bypassed strict `updateMask` errors on the Firestore REST API by appending to deployment history instead of overwriting.
- Fixed layout bug causing the Live System Feed to not stretch to the bottom of the container.
- Cleaned up Next.js unused import warnings that triggered strict ESLint build failures.

## [2.0.0] - 2026-08-15
### Added
- Comprehensive **Admin Dashboard** (`/admin`) featuring animated metrics, gradient borders, glassmorphism, and live data aggregation.
- **Job Details Modal** on the Admin page to inspect complete job metadata (target schema, column classifications, AI summaries, and fatal stack traces).
- **Global Kill Switch** API endpoint that instantly purges all pending and processing chunks across all four Pub/Sub queues (via cursor seeking), safely terminating ghost jobs.
- **Live Markdown Documentation System** (`/docs`) backed by real-time Firestore syncing, featuring a split-pane Markdown editor exclusively available to Admins.
- **Native Mermaid.js Rendering Support** on the Documentation page, allowing Admins to embed dynamic architecture flowcharts directly inside markdown blocks.
- **Dynamic Changelog Tab** that autonomously pulls and renders public release notes directly from the GitHub API.
- Secured backend collections with strict **Firestore RBAC Security Rules** restricting global reads to owners and admins.
- Extraction History Dashboard (`/history`) for users to view and download past jobs.
- Extracted Column Metadata (column descriptions, nulls, distinct counts, and global summary) is now generated by the AI worker and beautifully displayed on the History page.
- Google OAuth 2 support via Firebase Authentication.
- User profile generation in Firestore (`users` collection) upon first login with assigned `role` and `plan`.
- Global Header component with dynamic authentication UI (including a new link to the History page).
- Redesigned email notification field in Schema Builder with glassmorphic aesthetics.
### Changed
- **Completely Redesigned Homepage Layout**: Eliminated unnecessary vertical scrolling by condensing the hero section and implementing a strict, side-by-side single-screen responsive layout (no-scroll) on desktop devices.
- Reverted the LLM worker model to the stable `gemini-2.5-flash` to utilize the generous 1,500 Requests-Per-Day free tier quota.
- Improved Job Tracking UI by integrating the "Cancel Job" button directly into the custom timeline header.
- Simplified History job card by removing account-level details (Role, Plan) in favor of strictly job-specific metrics.
- `useFileUpload` hook now attaches user `uid` to the backend job request.
- `next.config.mjs` modified to allow static exports by disabling the Image Optimization API.
### Fixed
- Fixed **Token Processing Calculation** on the Admin Dashboard to dynamically sum `total_tokens` burned directly from all live jobs instead of the limited audit logs.
- Clamped **visual progress bars** to a maximum of 100% to gracefully handle Pub/Sub at-least-once delivery retries overcounting chunks.
- Fixed a bug where the `Admin Portal` navigation button would not hydrate correctly on the cached static homepage layout.
- Fixed critical Cloud Run worker deadlock caused by synchronous gRPC execution on the async event loop.
- Fixed issue where the LLM engine would endlessly retry on fatal API exceptions (like Daily Quotas or 404s). The chunk processor now fast-fails, saving massive compute costs on dead jobs.
- Fixed `.dockerignore` patterns to exclude nested `__pycache__` and `.pyc` files, preventing stale local bytecode from executing in production containers.
- Fixed cancel logic in the worker to instantly abort jobs *before* file fan-out if the user cancels immediately, preventing ghost chunks from entering the queue.
- Fixed bug where processing time displayed as `0s` for historical jobs by calculating true duration from `created_at` and `completed_at`.
- Updated worker reducer to properly persist execution duration and LLM-generated column metadata to the main Firestore job document instead of isolating it in audit logs.
## [1.5.0] - 2026-08-15
### Added
- Graceful Job Cancellation API with frontend UI integration.
- Script to generate clean/messy mock datasets (`sample_data/generate_data.py`).
- Complete Firestore audit logging with user identity tracking.
- Track active jobs and add cancellation infra IDs to audit logs.
- Added metadata generation and zip export for job results.
- Intelligent chunk sizing and DuckDB aggregation.
- Track LLM tokens and job runtime for billing analytics.
- Track ip_address independently of user_id for guest rate-limiting.
### Fixed
- Fixed bug causing guest users to fall back to IP address incorrectly.
- Used array of objects in Gemini response schema for strict enforcement.
### Performance
- Implemented In-Memory TTL Cache on Cloud Run worker for job status checks to reduce Firestore read volume by 95%+.
- Optimized DuckDB metadata queries into a single pass.
### Documentation
- Updated README with instructions for generating test data.
- Updated ARCHITECTURE.md with observability and telemetry details.
### Testing
- Added test coverage for Audit Service and updated existing test fixtures.
- Updated Reducer assertions for universal CSV output.

## [2026-08-09]
### Added
- Use meaningful filenames for processed outputs.
### Fixed
- Fixed Reducer test for new filename format.
- Injected frontend environment variables into CI/CD build step.

## [2026-08-08]
### Added
- Implemented distributed Map-Reduce architecture for large file processing with LangGraph.
- Added Auto-Clean mode for empty schemas.
- Implemented real-time UI tracking page with Amazon-style timeline.
- Added syntax highlighting to JSON schema editor.
- Sent tracking link email for files >5MB.
- CI workflows for deployment and enforcing branch naming conventions.
- Added initial sample data for live demo testing.
### Changed
- Revamped frontend UI to premium dark aesthetic with glassmorphism.
- Updated website favicon and logo.
### Fixed
- Resolved Cloud Run 500 errors by generating signed URLs via IAM API.
- Disabled FastAPI trailing slash redirect and added `--proxy-headers` for Cloud Run HTTPS support.
- Fixed static export build error by refactoring dynamic route.
