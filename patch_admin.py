import re

with open("frontend/src/app/admin/page.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '{(job.status === "queued" || job.status === "processing") && (',
    '{(job.status === "queued" || job.status === "processing" || job.status === "processing_chunks") && ('
)

with open("frontend/src/app/admin/page.tsx", "w") as f:
    f.write(content)
