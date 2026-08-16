import re

with open("worker/src/api/routers.py", "r") as f:
    content = f.read()

# Insert the logic early in process_job
logic = """
    try:
        payload = json.loads(base64.b64decode(envelope.message.data).decode("utf-8"))
        job_id = payload["job_id"]
        email = payload.get("email")
        
        # Check for cancel_email action
        if payload.get("action") == "cancel_email":
            if email:
                tracking_url = f"{settings.FRONTEND_URL}/track?jobId={job_id}"
                email_svc.send_cancelled_email(email, tracking_url)
            return {"status": "success", "message": "Cancelled email sent"}
            
        file_path = payload["file_path"]
"""

content = re.sub(
    r'try:\s*payload = json.loads.*?file_path = payload\["file_path"\]',
    logic,
    content,
    flags=re.DOTALL
)

with open("worker/src/api/routers.py", "w") as f:
    f.write(content)
