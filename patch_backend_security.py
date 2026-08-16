import re

with open("backend/src/api/routers/jobs.py", "r") as f:
    content = f.read()

# Make sure imports are present
import_str = "from fastapi import APIRouter, HTTPException, Depends, Security\nfrom src.api.dependencies import get_pubsub_service, get_firestore_service, get_current_user, get_current_admin"
content = re.sub(
    r'from fastapi import APIRouter, HTTPException, Depends\nfrom src\.api\.dependencies import get_pubsub_service, get_firestore_service',
    import_str,
    content
)

# Update cancel_job
cancel_job_sig = """async def cancel_job(
    job_id: str,
    firestore_svc: FirestoreService = Depends(get_firestore_service),
    pubsub_svc: PubSubService = Depends(get_pubsub_service),
    decoded_token: dict = Security(get_current_user)
):
    \"\"\"
    Cancels a job by updating the Firestore job and audit documents.
    In-flight workers will see the 'cancelled' status and gracefully abort.
    \"\"\"
    data = firestore_svc.get_job(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
        
    uid = decoded_token.get("uid")
    user_doc = firestore_svc.db.collection("users").document(uid).get().to_dict() or {}
    role = user_doc.get("role", "").lower()
    
    if data.get("user_id") != uid and role not in ["admin", "owner"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this job")"""

content = re.sub(
    r'async def cancel_job\(.*?detail="Job not found"\)',
    cancel_job_sig,
    content,
    flags=re.DOTALL
)

# Update kill_switch
kill_switch_sig = """async def kill_switch(
    firestore_svc: FirestoreService = Depends(get_firestore_service),
    pubsub_svc: PubSubService = Depends(get_pubsub_service),
    decoded_token: dict = Security(get_current_admin)
):"""

content = re.sub(
    r'async def kill_switch\(.*?\):',
    kill_switch_sig,
    content,
    flags=re.DOTALL
)

with open("backend/src/api/routers/jobs.py", "w") as f:
    f.write(content)
