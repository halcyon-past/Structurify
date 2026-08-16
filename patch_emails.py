import re

with open("worker/src/services/email_service.py", "r") as f:
    content = f.read()

# Update send_success_email signature
content = content.replace(
    'def send_success_email(self, to_email: str, download_url: str):',
    'def send_success_email(self, to_email: str, download_url: str, metadata: dict = None):'
)

new_success_html = """
        metadata = metadata or {}
        file_name = metadata.get("file_name", "your dataset")
        rows = metadata.get("rows_processed", "Unknown")
        duration = metadata.get("duration_seconds", "Unknown")
        desc = metadata.get("global_description", "Data successfully structured.")
        
        html = f\"\"\"\\
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; text-align: center; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a24; border-radius: 16px; border: 1px solid #2d2d3a; overflow: hidden; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
              <div style="background: linear-gradient(90deg, #7c3aed, #ec4899); padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; tracking: tight;">Structurify</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Extraction Complete! 🎉</h2>
                <p style="font-size: 16px; color: #d1d5db; line-height: 1.6; margin-bottom: 25px;">
                  Great news! Your messy data from <strong>{file_name}</strong> has been successfully cleaned, transformed, and compiled into a strict machine-readable format.
                </p>
                
                <div style="background-color: #09090b; border: 1px solid #333; border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 30px;">
                  <h3 style="color: #a78bfa; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Extraction Summary</h3>
                  <p style="color: #9ca3af; font-size: 14px; margin: 8px 0;"><strong>Rows Processed:</strong> <span style="color: #f3f4f6;">{rows}</span></p>
                  <p style="color: #9ca3af; font-size: 14px; margin: 8px 0;"><strong>Time Taken:</strong> <span style="color: #f3f4f6;">{duration}s</span></p>
                  <p style="color: #9ca3af; font-size: 14px; margin: 8px 0; line-height: 1.4;"><strong>AI Analysis:</strong> <span style="color: #f3f4f6;">{desc}</span></p>
                </div>

                <a href="{download_url}" style="background-color: #8b5cf6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.2s;">Download Clean Dataset (ZIP)</a>
                
                <p style="font-size: 13px; color: #6b7280; margin-top: 40px; margin-bottom: 0;">This is an automated message from the Structurify AI Pipeline.</p>
              </div>
            </div>
          </body>
        </html>
        \"\"\"
"""

content = re.sub(
    r'html = f"""\\.*?</html>\s*"""',
    new_success_html.strip(),
    content,
    count=1,
    flags=re.DOTALL
)

new_started_html = """
        html = f\"\"\"\\
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #ffffff; padding: 40px; text-align: center; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a24; border-radius: 16px; border: 1px solid #2d2d3a; overflow: hidden; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
              <div style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; tracking: tight;">Structurify</h1>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Processing Started ⚡</h2>
                <p style="font-size: 16px; color: #d1d5db; line-height: 1.6; margin-bottom: 25px;">
                  We have successfully queued your dataset. Our AI worker nodes are currently mapping, cleaning, and structuring your data in the background.
                </p>
                <div style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                  <p style="color: #93c5fd; font-size: 14px; margin: 0;">Since your file is large, this may take a few minutes. You can safely close your browser; we'll email you again when it's done!</p>
                </div>
                <a href="{tracking_url}" style="background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Track Live Progress</a>
                <p style="font-size: 13px; color: #6b7280; margin-top: 40px; margin-bottom: 0;">This is an automated message from the Structurify AI Pipeline.</p>
              </div>
            </div>
          </body>
        </html>
        \"\"\"
"""

content = re.sub(
    r'html = f"""\\.*?</html>\s*"""',
    new_started_html.strip(),
    content,
    count=1,
    flags=re.DOTALL
)

new_cancelled_html = """
        html_body = f\"\"\"
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
        \"\"\"
"""

content = re.sub(
    r'html_body = f""".*?</html>\s*"""',
    new_cancelled_html.strip(),
    content,
    count=1,
    flags=re.DOTALL
)


with open("worker/src/services/email_service.py", "w") as f:
    f.write(content)
