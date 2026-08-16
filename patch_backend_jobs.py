import re

with open("backend/src/api/routers/jobs.py", "r") as f:
    content = f.read()

# Update signature
content = content.replace(
    """async def cancel_job(
    job_id: str,
    firestore_svc: FirestoreService = Depends(get_firestore_service)
):""",
    """async def cancel_job(
    job_id: str,
    firestore_svc: FirestoreService = Depends(get_firestore_service),
    pubsub_svc: PubSubService = Depends(get_pubsub_service)
):"""
)

# Insert the pubsub logic
content = content.replace(
    'firestore_svc.cancel_job(job_id)',
    """firestore_svc.cancel_job(job_id)
    if data.get("email"):
        pubsub_svc.publish_cancel_email(job_id, data.get("email"))"""
)

# Add missing import for get_pubsub_service if needed.
if "from src.api.deps import get_pubsub_service" not in content and "get_pubsub_service" not in content[:200]:
    content = content.replace(
        "from src.api.deps import get_firestore_service, get_storage_service",
        "from src.api.deps import get_firestore_service, get_storage_service, get_pubsub_service"
    )

with open("backend/src/api/routers/jobs.py", "w") as f:
    f.write(content)
