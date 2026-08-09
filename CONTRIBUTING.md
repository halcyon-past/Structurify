# Contributing to Structurify

Welcome! We're thrilled that you're interested in contributing to Structurify. This document lays out our standard operating procedures, architecture overview, and rules for contributing. 

Please read this document completely before opening a Pull Request!

## 1. Branch Naming & Workflow Conventions

Our CI/CD pipeline enforces strict branch naming. Direct pushes to `main`, `dev`, or `uat` are blocked.

### Allowed Formats
- **Feature Branches**: `feature/<target-branch>/<feature-name>` 
  *(e.g., `feature/dev/add-ui-components`)*
- **Hotfix Branches**: `hotfix/<fix-name>`
  *(e.g., `hotfix/cors-patch`)*

*Any branch pushed that does not match this format will automatically fail the PR status checks.*

## 2. Setting Up Locally

See the `README.md` for a comprehensive setup guide. Ensure you have Node.js 20+ and Python 3.12+ installed. 
You will also need to authenticate with Google Cloud via the `gcloud` CLI to interact with local emulators or deploy to development projects.

## 3. Pull Request Requirements

All changes must go through a Pull Request. In order to merge into a core branch (`dev`, `uat`, `main`), your PR **MUST**:

1. Pass the Branch Naming Convention check.
2. Pass the `Backend Tests` (Pytest).
3. Pass the `Worker Tests` (Pytest).
4. Pass the `Frontend Tests` (Jest).
5. Receive at least **1 Approving Review** from a designated repository Code Owner.

### Writing Tests
If you build a new feature, you are required to write tests for it.
- Backend/Worker: Add Pytest functions in the respective `tests/` directories.
- Frontend: Add Jest test files (e.g. `UploadZone.test.tsx`) alongside your components.

### Updating Documentation
If your PR introduces architectural changes or modifies the infrastructure requirements, you must update `ARCHITECTURE.md` and `README.md` accordingly.

## 4. Submitting a Pull Request

1. Fork or branch off the target branch (usually `dev`).
2. Write your code and ensure you run all tests locally.
3. Commit using conventional commit messages (e.g., `feat: ...`, `fix: ...`).
4. Push to origin and open a PR.
5. A Code Owner will review your PR and either request changes or approve and merge it.

Thank you for contributing!
