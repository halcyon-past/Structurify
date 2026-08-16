import re

with open("backend/src/services/pubsub.py", "r") as f:
    content = f.read()

new_func = """
    def publish_cancel_email(self, job_id: str, email: str):
        message_data = json.dumps({
            "action": "cancel_email",
            "job_id": job_id,
            "email": email
        }).encode("utf-8")
        future = self.publisher.publish(self.topic_path, data=message_data)
        future.result()
"""

content = content + new_func

with open("backend/src/services/pubsub.py", "w") as f:
    f.write(content)
