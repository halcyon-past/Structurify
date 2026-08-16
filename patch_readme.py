import re

with open("README.md", "r") as f:
    content = f.read()

new_features = """- **Custom Target Schemas**: Define strict JSON output structures dynamically via UI or raw JSON.
- **Robust Email Notifications**: Automated emails for job starts, success, and graceful cancellations.
- **Global Kill Switch**: Admins can safely terminate all stuck jobs and instantly purge Pub/Sub queues.
- **Extraction History**: Users can track, download, and cancel jobs via a dedicated History portal."""

content = re.sub(
    r'- \*\*Custom Target Schemas\*\*: Define strict JSON output structures dynamically\.',
    new_features,
    content
)

with open("README.md", "w") as f:
    f.write(content)

with open("ARCHITECTURE.md", "r") as f:
    arch_content = f.read()

arch_new = """### 4. Cancellation & Kill Switch
The backend exposes a highly robust cancellation pipeline:
1. **User Cancellation:** The frontend calls `/jobs/{id}/cancel`. The backend updates Firestore, and pushes a `cancel_email` notification to Pub/Sub to instantly send the user an abort notification. In-flight Cloud Run workers immediately abort execution upon detecting the cancelled status.
2. **Global Kill Switch:** Admins can trigger `/jobs/kill-switch`, which seeks all Pub/Sub message queues to the present timestamp (purging all backlogs) and forcefully cancels all active ghost jobs, sending emails to impacted users.
"""

arch_content = arch_content.replace(
    "### 4. Background Workers (Cloud Run)",
    arch_new + "\n### 4. Background Workers (Cloud Run)"
)

with open("ARCHITECTURE.md", "w") as f:
    f.write(arch_content)
