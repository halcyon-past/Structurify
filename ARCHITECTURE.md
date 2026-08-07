# Structurify: Architectural Deep Dive

This document provides a comprehensive overview of the **Serverless Fan-Out Architecture** that powers Structurify. The system is designed to handle computationally heavy ETl (Extract, Transform, Load) tasks without blocking the web servers, guaranteeing high availability and extremely low latency for the end user.

---

## 1. High-Level System Architecture

Structurify is composed of three main layers, all orchestrated via Google Cloud Platform (GCP) serverless primitives:

1. **Client/Presentation Layer:** Next.js React Application
2. **Gateway/Routing Layer:** FastAPI Backend (Cloud Run)
3. **Execution/Worker Layer:** FastAPI Async Worker (Cloud Run) + Gemini 2.5 Flash

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
    PubSub[["Cloud Pub/Sub Queue"]]:::gcp
    
    Gemini{{"Gemini 2.5 Flash API"}}:::llm

    %% Edges
    User -- "1. Define Schema & Drop File" --> NextJS
    NextJS -- "2. Request Signed URL" --> FastAPI_Gateway
    FastAPI_Gateway -. "Returns URL" .-> NextJS
    NextJS -- "3. Direct HTTP PUT" --> GCS_Raw
    
    NextJS -- "4. Submit Job Metadata" --> FastAPI_Gateway
    FastAPI_Gateway -- "5. Log 'queued' status" --> Firestore
    FastAPI_Gateway -- "6. Publish Job Event" --> PubSub
    
    PubSub -- "7. Push Event (HTTP POST)" --> FastAPI_Worker
    
    FastAPI_Worker -- "8. Download Raw File" --> GCS_Raw
    FastAPI_Worker -- "9. Update status 'processing'" --> Firestore
    
    FastAPI_Worker -- "10. Chunk Data & Map Schema" --> Gemini
    Gemini -. "Strict JSON Schema Output" .-> FastAPI_Worker
    
    FastAPI_Worker -- "11. Upload Compiled XLSX" --> GCS_Processed
    FastAPI_Worker -- "12. Update status 'completed'" --> Firestore
    
    Firestore -. "13. Real-time onSnapshot" .-> NextJS
    NextJS -- "14. Download Clean File" --> GCS_Processed
```

---

## 2. Event-Driven Execution Flow (Sequence Diagram)

The true power of Structurify lies in its decoupled nature. The Backend API never touches the actual file payload, and the Frontend never waits on a blocking HTTP request for the LLM to finish processing. 

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API Gateway
    participant Cloud Storage
    participant Firestore
    participant Pub/Sub
    participant Worker
    participant Gemini Flash

    Client->>API Gateway: POST /api/v1/upload-url (filename)
    API Gateway->>Cloud Storage: Generate V4 Signed URL
    Cloud Storage-->>API Gateway: URL generated
    API Gateway-->>Client: Returns Upload URL

    Client->>Cloud Storage: Direct PUT File to GCS (Bypasses API)
    Cloud Storage-->>Client: 200 OK

    Client->>API Gateway: POST /api/v1/jobs (filepath, target_schema)
    API Gateway->>Firestore: Create Job {status: "queued"}
    API Gateway->>Pub/Sub: Publish Message {job_id, filepath, schema}
    API Gateway-->>Client: 202 Accepted (job_id)

    note over Client, Firestore: Client establishes Firestore onSnapshot listener for UI updates

    Pub/Sub->>Worker: HTTP POST Push Delivery (Message)
    Worker->>Firestore: Update Job {status: "processing"}
    Worker->>Cloud Storage: Download Raw CSV/XLSX
    
    loop Chunking Pipeline
        Worker->>Gemini Flash: Prompt + System Instructions + Target JSON Schema
        Gemini Flash-->>Worker: Enforced JSON Array
    end
    
    Worker->>Worker: Compile JSON chunks to Pandas DataFrame -> Excel
    Worker->>Cloud Storage: Upload Processed XLSX File
    Cloud Storage-->>Worker: Generate 7-day Signed Download URL
    
    Worker->>Firestore: Update Job {status: "completed", download_url}
    Worker-->>Pub/Sub: 200 OK (Acknowledge Message)
    
    Firestore-->>Client: Pushes real-time 'completed' state to UI
```

---

## 3. Core Architectural Decisions

### 1. Direct-to-Cloud-Storage Uploads
**Problem:** Uploading a 50MB spreadsheet through a standard API endpoint causes massive memory bloat on the server and risks HTTP timeout limits.
**Solution:** The Backend API acts purely as an authenticator. It generates a short-lived presigned URL, allowing the client's browser to stream the file directly to a GCS bucket, bypassing the web server entirely.

### 2. Serverless Fan-Out via Pub/Sub Push
**Problem:** LLM compilation can take anywhere from 10 seconds to 5 minutes depending on file size. A standard HTTP request will time out after 30-60 seconds, leaving the user with a 504 Gateway Timeout.
**Solution:** The API Gateway immediately responds with a `202 Accepted` and drops the job onto an event bus (`Cloud Pub/Sub`). Pub/Sub then reliably pushes this event to the asynchronous Worker engine. If the worker fails, Pub/Sub will automatically retry the event using exponential backoff.

### 3. Strict Schema Enforcement via Gemini Structured Output
**Problem:** Large Language Models naturally hallucinate or return improperly formatted JSON strings, breaking data pipelines.
**Solution:** The worker utilizes Gemini 2.5 Flash's `response_schema` configuration. The user-defined schema (e.g. `{"id": "Integer", "name": "String"}`) is dynamically translated into an OpenAPI 3.0 standard schema structure and passed directly to the model's generation config, forcing the model to guarantee absolute schema adherence.

### 4. Firestore Real-time Synchronization
**Problem:** With asynchronous processing, the client has no way of knowing when the task finishes unless it implements aggressive, resource-heavy HTTP polling (e.g. `setInterval(() => fetchStatus(), 1000)`).
**Solution:** By storing the job state in Google Firestore, the Next.js client establishes an active WebSocket-based `onSnapshot` listener. The second the Worker updates the database to "completed", the Firebase SDK pushes the state change to the UI instantaneously with zero overhead.
