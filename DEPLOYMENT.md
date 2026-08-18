# Deployment Architecture & Operations

Structurify utilizes a hybrid deployment model, separating **Infrastructure as Code (IaC)** from **Continuous Integration / Continuous Deployment (CI/CD)**. This guarantees that infrastructure is immutable and easily reproducible, while application code can be shipped rapidly.

---

## 1. The Deployment Architecture

Structurify is split into three main deployable components:

1. **Frontend**: A Next.js React application, deployed statically to **Firebase Hosting**.
2. **Backend**: A FastAPI Gateway, deployed to a public-facing **Google Cloud Run** service.
3. **Worker**: A FastAPI background processor, deployed to an internal **Google Cloud Run** service and triggered via Pub/Sub Push subscriptions.

### Infrastructure as Code (IaC)
We use **Terraform** to provision the static infrastructure. This includes:
- Google Cloud Storage buckets (`raw-uploads`, `processed-outputs`).
- Google Cloud Pub/Sub Topics (`schema-transformation-jobs`, `chunk-processing-jobs`).
- Firestore Database initialization.
- Secret Manager secrets (e.g., `GEMINI_API_KEY`, `SMTP_PASSWORD`).
- Firebase Authentication initialization for Identity Platform (SSO/OAuth).
- IAM Service Accounts and Role Bindings.

To apply infrastructure changes:
```bash
cd terraform
terraform init
terraform apply -var="project_id=your-gcp-project-id" -var="region=us-central1" -var="gemini_api_key=your-api-key"
```

---

## 2. CI/CD: The `deploy.sh` Script

Once the infrastructure is live, you can deploy application code using the `deploy.sh` script. This script is fully automated and supports **selective deployments**, meaning you can deploy a single microservice without having to rebuild the entire system.

### Usage
```bash
# Deploy everything
./deploy.sh <PROJECT_ID> <REGION> all

# Deploy only the frontend
./deploy.sh <PROJECT_ID> <REGION> frontend

# Deploy only the backend
./deploy.sh <PROJECT_ID> <REGION> backend

# Deploy only the worker
./deploy.sh <PROJECT_ID> <REGION> worker
```

### How it works
1. **Frontend**: Runs `npm run build` and uses the Firebase CLI (`npx firebase deploy --only hosting`) to push the static assets to Firebase's global CDN.
2. **Backend & Worker**: 
   - Uses `gcloud builds submit` to build the Docker image in Google Cloud Build.
   - Pushes the built image to Google Artifact Registry.
   - Uses `gcloud run deploy` to roll out a new container revision.
   - **Worker Only**: Automatically updates the Pub/Sub Push subscriptions to ensure the OIDC `--push-auth-token-audience` exactly matches the newly deployed Cloud Run URL, preventing `401 Unauthorized` errors.

---

## 3. GitHub Actions (Automated Cloud Deployments)

For production, Structurify utilizes GitHub Actions to deploy automatically upon merging to the `main` or `dev` branches.

### Workflows
- `.github/workflows/deploy-all.yml`: Triggers on push to `main`, deploying all 3 services.
- `.github/workflows/deploy-worker.yml`: Can be triggered via `workflow_dispatch` to selectively redeploy the worker (useful for prompt engineering updates).

### Authentication
The GitHub Actions do **not** use long-lived JSON service account keys. Instead, they use **Workload Identity Federation (WIF)**, an OIDC trust relationship that allows GitHub to securely impersonate a GCP Service Account for the duration of the build, significantly reducing security risks.

---

## 4. Deployment Observability & Audit Trail

To ensure transparency and aid in debugging, Structurify tracks every single deployment (both local and CI/CD) in the Firestore database.

### The `log_deployment.sh` script
Whenever a deployment finishes, it calls `scripts/log_deployment.sh`. This is a zero-dependency Bash script that uses your active `gcloud` OAuth token to send an authenticated `POST` request to the Firestore REST API. 

This writes a new record to the `deployments` collection containing:
- The `service` updated (frontend, backend, worker).
- The `status` (success, failed).
- The `commit` hash.
- The `actor` (the GitHub username or local developer name).
- A `log_url` linking directly to the Cloud Build or Firebase Hosting console.

### Admin Portal Integration
The Next.js Admin Portal subscribes to this `deployments` collection in real-time. 
- The **Dashboard** dynamically extracts the most recent successful/failed deployment for each service.
- The **Deployments Tab** renders the full historical audit trail, allowing admins to trace exactly when a change went live and instantly click through to the raw build logs in GCP.
