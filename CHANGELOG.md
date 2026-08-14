# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2026-08-15]
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
