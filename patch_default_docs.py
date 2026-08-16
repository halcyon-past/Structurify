import re

with open("frontend/src/app/docs/page.tsx", "r") as f:
    content = f.read()

new_docs = """const DEFAULT_DOCS = `# Structurify Documentation

Welcome to the **Structurify** documentation! Structurify is an AI-powered ETL pipeline that transforms messy, unstructured spreadsheets into strict, machine-readable datasets.

## 🔄 Simplified Architecture Flow

\`\`\`mermaid
graph TD;
    A[User Uploads File] --> B[Next.js Frontend];
    B --> C{File > 5MB?};
    C -- Yes --> D[Send 'Job Started' Email];
    C -- No --> E[Bypass Email];
    D --> E;
    E --> F[Upload to Google Cloud Storage];
    F --> G[Pub/Sub Job Queue];
    G --> H[Cloud Run AI Workers];
    H --> I[Gemini AI Map-Reduce];
    I --> J[DuckDB Data Aggregation];
    J --> K[Zip Creation data.csv + metadata.json];
    K --> L[Firestore Job Updated];
    L --> M[Send 'Job Completed' Email with Download Link];
\`\`\`

## 🚀 How It Works
1. **Upload your unstructured file**: Currently supported formats are **CSV, XLSX, and XLS**.
2. **Define your Target Schema**: Use the UI Builder or paste a raw JSON schema.
3. **Submit the Job**: Our asynchronous MapReduce pipeline processes your data using Google Gemini.
4. **Download Results**: Once completed, you will receive a ZIP file containing your structured data and a metadata report.

## 🔔 Email Notifications
If you provide an email address during upload, you will receive automated notifications:
- **Job Started:** For files larger than 5MB.
- **Job Completed:** Includes a direct, secure link to download your cleaned ZIP file.
- **Job Cancelled:** If you manually cancel the job, or if an administrator halts the system.

## 🛑 Job Management & History
Users can view all their past jobs in the **Extraction History** tab. 
- You can manually **Cancel** any active job directly from the History tab. 
- Administrators have access to an **Admin Portal** and a **Global Kill Switch** that instantly terminates stuck or ghost jobs.

---
`"""

content = re.sub(
    r'const DEFAULT_DOCS = `# Structurify Documentation.*?---\n`',
    new_docs,
    content,
    flags=re.DOTALL
)

with open("frontend/src/app/docs/page.tsx", "w") as f:
    f.write(content)
