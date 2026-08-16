with open("worker/src/services/reducer.py", "r") as f:
    content = f.read()

new_email_call = """
        if job_data.get("email"):
            try:
                from src.services.email_service import EmailService
                email_svc = EmailService()
                metadata_for_email = {
                    "file_name": original_name,
                    "rows_processed": processed_rows,
                    "duration_seconds": round(duration, 2),
                    "global_description": semantic_meta.get("global_description", "Data successfully structured.")
                }
                email_svc.send_success_email(job_data["email"], download_url, metadata_for_email)
            except Exception as e:
                print(f"Failed to initialize or send email: {e}")
"""

import re
content = re.sub(
    r'if job_data\.get\("email"\):.*?print\(f"Failed to initialize or send email: {e}"\)',
    new_email_call.strip(),
    content,
    flags=re.DOTALL
)

with open("worker/src/services/reducer.py", "w") as f:
    f.write(content)
