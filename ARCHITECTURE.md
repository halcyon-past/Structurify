# Structurify: Architectural Deep Dive

This document provides a comprehensive overview of the **Serverless Fan-Out Architecture** that powers Structurify. The system is designed to handle computationally heavy ETL (Extract, Transform, Load) tasks without blocking the web servers, guaranteeing high availability and extremely low latency for the end user.

---

## 1. High-Level System Architecture

Structurify is composed of three main layers, all orchestrated via Google Cloud Platform (GCP) serverless primitives:

1. **Client/Presentation Layer:** Next.js React Application
2. **Gateway/Routing Layer:** FastAPI Backend (Cloud Run)
3. **Execution/Worker Layer:** FastAPI Async Worker (Cloud Run) + LangGraph + Gemini 2.5 Flash

### Component Flowchart

```mermaid
graph TD
    %% Define styles
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef backend fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    classDef worker fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef gcp fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef llm fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#fff

    %% Nodes
    User([End User Browser])
    NextJS["Frontend UI (Next.js)"]:::frontend
    
    FastAPI_Gateway["API Gateway (FastAPI)"]:::backend
    FastAPI_Worker["Worker Engine (FastAPI)"]:::worker
    
    GCS_Raw[("Raw Uploads (GCS)")]:::gcp
    GCS_Processed[("Processed Outputs (GCS)")]:::gcp
    
    Firestore[("Firestore DB")]:::gcp
    PubSub_Jobs[["Jobs Queue (Pub/Sub)"]]:::gcp
    PubSub_Chunks[["Chunks Queue (Pub/Sub)"]]:::gcp
    
    LangGraph["LangGraph Map-Reduce"]:::worker
    Gemini{{"Gemini 2.5 Flash API"}}:::llm

    %% Edges
    User -- "1. Define Schema & Drop File" --> NextJS
    NextJS -- "2. Request Signed URL" --> FastAPI_Gateway
    FastAPI_Gateway -. "Returns URL" .-> NextJS
    NextJS -- "3. Direct HTTP PUT" --> GCS_Raw
    
    NextJS -- "4. Submit Job Metadata" --> FastAPI_Gateway
    FastAPI_Gateway -- "5. Log 'queued'" --> Firestore
    FastAPI_Gateway -- "6. Publish Job Event" --> PubSub_Jobs
    
    PubSub_Jobs -- "7. Push /process-job" --> FastAPI_Worker
    FastAPI_Worker -- "8. File Parser (Split)" --> PubSub_Chunks
    
    PubSub_Chunks -- "9. Push /process-chunk" --> FastAPI_Worker
    FastAPI_Worker -- "10. State Machine" --> LangGraph
    LangGraph -- "11. Transform & Self-Correct" --> Gemini
    Gemini -. "Strict JSON Array" .-> LangGraph
    LangGraph -- "12. Upload Chunk JSON" --> GCS_Raw
    
    FastAPI_Worker -- "13. Transaction Counter" --> Firestore
    FastAPI_Worker -- "14. Reducer compiles XLSX" --> GCS_Processed
    FastAPI_Worker -- "15. Send Emails (if >5MB)" --> User
    
    Firestore -. "16. Real-time onSnapshot" .-> NextJS
```

---

## 2. Map-Reduce Event-Driven Execution Flow (Sequence Diagram)

The true power of Structurify lies in its decoupled, multi-staged Fan-Out architecture. 

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API Gateway
    participant Cloud Storage
    participant Firestore
    participant Pub/Sub
    participant Worker (Splitter)
    participant Worker (Mapper)
    participant Gemini Flash
    participant Worker (Reducer)

    Client->>API Gateway: POST /api/v1/jobs (filepath, schema, email)
    API Gateway->>Pub/Sub: Publish Job Message
    API Gateway-->>Client: 202 Accepted (job_id)

    Pub/Sub->>Worker (Splitter): HTTP POST /process-job
    Worker (Splitter)->>Cloud Storage: Download Raw CSV/XLSX
    Worker (Splitter)->>Worker (Splitter): Chunk into 500-row segments
    loop For each chunk
        Worker (Splitter)->>Pub/Sub: Publish Chunk Message
    end
    
    Worker (Splitter)->>Client: (If >5MB) Send "Processing Started" Email
    Worker (Splitter)->>Firestore: log_job_start (started_at, file_size_mb, total_chunks)
    
    Pub/Sub->>Worker (Mapper): HTTP POST /process-chunk
    loop LangGraph Retry Cycle (Max 3)
        Worker (Mapper)->>Gemini Flash: Prompt + System Instructions + Target JSON Schema
        Gemini Flash-->>Worker (Mapper): Enforced JSON Array + Token Usage
    end
    Worker (Mapper)->>Cloud Storage: Upload chunk_{id}.json
    Worker (Mapper)->>Firestore: Transactional Increment (completed_chunks, total_tokens)
    
    alt is completed_chunks == total_chunks
        Worker (Mapper)->>Worker (Reducer): trigger reduce_job(job_id)
        Worker (Reducer)->>Cloud Storage: Download all chunk_{id}.json
        Worker (Reducer)->>Worker (Reducer): Compile Pandas DataFrame -> Excel
        Worker (Reducer)->>Cloud Storage: Upload Processed XLSX File
        Worker (Reducer)->>Client: Send "Success" Email with Download Link
        Worker (Reducer)->>Firestore: log_job_completion (total_tokens, job_runtime, stats)
    end
    
    opt On Any Exception (Crash / OOM / Invalid Data)
        Worker (Splitter / Mapper / Reducer)->>Firestore: log_job_failure (error_message)
    end
```

---

## 3. Core Architectural Decisions

### 1. Direct-to-Cloud-Storage Uploads
**Problem:** Uploading a 50MB spreadsheet through a standard API endpoint causes massive memory bloat on the server and risks HTTP timeout limits.
**Solution:** The Backend API acts purely as an authenticator. It generates a short-lived presigned URL, allowing the client's browser to stream the file directly to a GCS bucket, bypassing the web server entirely.

### 2. LangGraph Map-Reduce Pipeline
**Problem:** A 100,000-row spreadsheet cannot be processed by a single LLM API call due to token context limits (8k output tokens) and aggressive Cloud Run HTTP timeout constraints.
**Solution:** The Worker employs a highly concurrent Split-Map-Reduce design. 
- **Split:** The file is chunked into 500-row segments.
- **Map:** Each chunk is mapped over Gemini concurrently via Pub/Sub. If a chunk fails extraction, a LangGraph state machine catches the error and loops back for up to 3 self-correction retries.
- **Reduce:** A Firestore transactional counter tracks chunk completions and eventually merges them into a unified `.xlsx` file.

### 3. Strict Schema Enforcement & Auto-Clean
**Problem:** LLMs are prone to hallucinating formats or omitting columns.
**Solution:** 
- If a target schema is provided, Gemini is forced to map the data directly to a JSON Schema object (`response_schema`).
- **Auto-Clean Mode:** If no target schema is provided, Structurify dynamically infers the schema, cleans up the mess (capitalization, whitespaces, date formats), and returns the entire spreadsheet as a valid JSON array.

### 4. Asynchronous Email Notifications
**Problem:** Large files can take several minutes to process. Users might close the browser tab.
**Solution:** If a file is larger than 5 MB, the Worker instantly sends an HTML email containing a tracking link (`/track?jobId=...`) the moment the file begins chunking. A secondary success email delivers the final download link, guaranteeing the user never loses their data.

### 5. Rate Limits & Cloud Run Concurrency
**Problem:** Gemini Free Tier limits allow a maximum of 15 Requests Per Minute (RPM) and 1,500 Requests Per Day. A 50-chunk file processed completely in parallel by Cloud Run will instantly trigger a `429 RESOURCE_EXHAUSTED` error.
**Solution:** Tenacity is used inside the `LLMEngine` to automatically perform exponential backoffs (up to 60s) on `429` errors. For production, upgrading the GCP project to a paid tier removes this limit, allowing Cloud Run to process 1,000+ chunks concurrently.

### 6. Observability, Telemetry & Billing
**Problem:** A highly concurrent, decoupled architecture is incredibly difficult to monitor. We need to prevent "ghost jobs" (silent failures) and strictly track exact compute/token usage for billing and rate-limiting.
**Solution:** The `AuditService` logs a rich telemetry object to a separate `job_audits` Firestore collection:
- **Identity:** Captures `user_id` (via Auth) and decoupled `ip_address` (for guest rate-limiting without polluting user accounts).
- **Execution Cost:** The LangGraph state machine extracts `total_token_count` from Gemini API responses. The API router safely tracks token expenditure across parallel Cloud Run instances using `firestore.Increment()` in a guaranteed atomic transaction.
- **Performance Profiling:** Logs exactly when a job starts `started_at` to distinguish between "queue wait time" and true `job_runtime_seconds`. Also logs `file_size_mb` and `total_chunks` (parallelization factor).
- **Hard Failure Handling:** Every microservice wraps work in `try/except` and forcefully pushes a `log_job_failure` to the audit log on crash, guaranteeing no job gets stuck in `processing`.
