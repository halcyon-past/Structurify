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

    def send_success_email(self, to_email: str, download_url: str):
        if not all([self.smtp_server, self.smtp_port, self.smtp_username, self.smtp_password]):
            print(f"Skipping email to {to_email} because SMTP credentials are not fully configured.")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Structurify Data is Ready!"
        msg["From"] = self.smtp_from_email
        msg["To"] = to_email

        html = f"""\
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; text-align: center;">
            <div style="max-w-2xl; margin: 0 auto; background-color: #1a1a24; padding: 30px; border-radius: 12px; border: 1px solid #333;">
              <h1 style="color: #8b5cf6;">Structurify</h1>
              <p style="font-size: 16px; color: #d1d5db;">Great news! Your messy data has been successfully cleaned and compiled.</p>
              <br>
              <a href="{download_url}" style="background-color: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Download Processed File</a>
              <br><br>
              <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">This is an automated message from the Structurify ETL Pipeline.</p>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            print(f"Successfully sent success email to {to_email}")
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
