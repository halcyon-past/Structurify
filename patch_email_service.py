import re

with open("worker/src/services/email_service.py", "r") as f:
    content = f.read()

cancelled_email_func = """
    def send_cancelled_email(self, to_email: str, tracking_url: str):
        if not self.smtp_username or not self.smtp_password:
            print(f"Skipping email to {to_email} because SMTP credentials are not fully configured.")
            return

        msg = MIMEMultipart()
        msg["Subject"] = "Structurify - Job Cancelled 🚫"
        msg["From"] = self.smtp_from_email
        msg["To"] = to_email

        html_body = f\"\"\"
        <html>
        <body style="font-family: sans-serif; color: #333;">
            <h2>Structurify Job Cancelled</h2>
            <p>Your data extraction job was successfully cancelled.</p>
            <p>No further processing will be done, and any intermediate resources have been cleaned up.</p>
            <p>You can view the final status here:</p>
            <p><a href="{tracking_url}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Job Details</a></p>
            <br/>
            <p>Thanks,<br/>The Structurify Team</p>
        </body>
        </html>
        \"\"\"

        msg.attach(MIMEText(html_body, "html"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            print(f"Successfully sent cancelled email to {to_email}")
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
"""

content = content + cancelled_email_func

with open("worker/src/services/email_service.py", "w") as f:
    f.write(content)
