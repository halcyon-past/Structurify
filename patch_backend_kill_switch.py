import re

with open("backend/src/api/routers/jobs.py", "r") as f:
    content = f.read()

# Update kill_switch signature
content = content.replace(
    """async def kill_switch(
    firestore_svc: FirestoreService = Depends(get_firestore_service)
):""",
    """async def kill_switch(
    firestore_svc: FirestoreService = Depends(get_firestore_service),
    pubsub_svc: PubSubService = Depends(get_pubsub_service)
):"""
)

# Add pubsub publish inside the loop
loop_logic = """
                batch.update(doc.reference, {
                    "status": "cancelled",
                    "updated_at": now,
                    "error_message": "Global Kill Switch Activated by Admin"
                })
                
                doc_data = doc.to_dict()
                if doc_data and doc_data.get("email"):
                    try:
                        pubsub_svc.publish_cancel_email(doc.id, doc_data.get("email"))
                    except Exception as e:
                        pass
                
                count += 1
"""

content = re.sub(
    r'batch\.update\(doc\.reference, {.*?"error_message": "Global Kill Switch Activated by Admin"\s*}\)\s*count \+= 1',
    loop_logic,
    content,
    flags=re.DOTALL
)

with open("backend/src/api/routers/jobs.py", "w") as f:
    f.write(content)
