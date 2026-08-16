import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.core.config import settings

class EmailService:
    def __init__(self):
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.smtp_from_email = settings.SMTP_FROM_EMAIL or self.smtp_username

    def send_success_email(self, to_email: str, download_url: str, metadata: dict = None):
        if not all([self.smtp_server, self.smtp_port, self.smtp_username, self.smtp_password]):
            print(f"Skipping email to {to_email} because SMTP credentials are not fully configured.")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Structurify Data is Ready!"
        msg["From"] = self.smtp_from_email
        msg["To"] = to_email

        metadata = metadata or {}
        file_name = metadata.get("file_name", "your dataset")
        rows = metadata.get("rows_processed", "Unknown")
        duration = metadata.get("duration_seconds", "Unknown")
        desc = metadata.get("global_description", "Data successfully structured.")

        plain_text = f"Your dataset {file_name} is ready. Download it here: {download_url}"
        html = f"""\
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; text-align: center; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a24; border-radius: 16px; border: 1px solid #2d2d3a; overflow: hidden; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
              <div style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; tracking: tight;">Structurify</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Data Ready ✅</h2>
                <p style="font-size: 16px; color: #d1d5db; line-height: 1.6; margin-bottom: 25px;">
                  Your dataset <strong>{file_name}</strong> has been successfully cleaned and structured.
                </p>
                <div style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                  <p style="color: #93c5fd; font-size: 14px; margin: 0;">Processed rows: {rows} • Duration: {duration}s • Summary: {desc}</p>
                </div>
                <a href="{download_url}" style="background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Download Your File</a>
                <p style="font-size: 13px; color: #6b7280; margin-top: 40px; margin-bottom: 0;">This is an automated message from the Structurify AI Pipeline.</p>
              </div>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html, "html"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            print(f"Successfully sent success email to {to_email}")
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")

    def send_started_email(self, to_email: str, tracking_url: str):
        if not all([self.smtp_server, self.smtp_port, self.smtp_username, self.smtp_password]):
            print(f"Skipping email to {to_email} because SMTP credentials are not fully configured.")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Structurify Data is Processing"
        msg["From"] = self.smtp_from_email
        msg["To"] = to_email

        plain_text = f"We are processing your dataset. Track progress here: {tracking_url}"
        html = f"""\
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; text-align: center;">
            <div style="max-w-2xl; margin: 0 auto; background-color: #1a1a24; padding: 30px; border-radius: 12px; border: 1px solid #333;">
              <h1 style="color: #8b5cf6;">Structurify</h1>
              <p style="font-size: 16px; color: #d1d5db;">We've started processing your large dataset! This might take a few minutes.</p>
              <br>
              <a href="{tracking_url}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Track Progress Live</a>
              <br><br>
              <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">This is an automated message from the Structurify ETL Pipeline.</p>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html, "html"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            print(f"Successfully sent processing started email to {to_email}")
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")

    def send_cancelled_email(self, to_email: str, tracking_url: str):
        if not self.smtp_username or not self.smtp_password:
            print(f"Skipping email to {to_email} because SMTP credentials are not fully configured.")
            return

        msg = MIMEMultipart()
        msg["Subject"] = "Structurify - Job Cancelled 🚫"
        msg["From"] = self.smtp_from_email
        msg["To"] = to_email

        plain_text = f"Your Structurify job was cancelled. View the extraction log: {tracking_url}"
        html_body = f"""
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; text-align: center; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a24; border-radius: 16px; border: 1px solid #2d2d3a; overflow: hidden; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
              <div style="background: linear-gradient(90deg, #ef4444, #f97316); padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; tracking: tight;">Structurify</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Job Cancelled 🛑</h2>
                <p style="font-size: 16px; color: #d1d5db; line-height: 1.6; margin-bottom: 25px;">
                  Your data extraction job was successfully aborted. All processing has been halted, and intermediate cloud resources have been permanently purged.
                </p>
                <div style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                  <p style="color: #fca5a5; font-size: 14px; margin: 0;">No tokens were billed for the uncompleted chunks. You may safely re-upload a new file whenever you're ready.</p>
                </div>
                <a href="{tracking_url}" style="background-color: #ef4444; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">View Extraction Log</a>
                <p style="font-size: 13px; color: #6b7280; margin-top: 40px; margin-bottom: 0;">This is an automated message from the Structurify AI Pipeline.</p>
              </div>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            print(f"Successfully sent cancelled email to {to_email}")
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
