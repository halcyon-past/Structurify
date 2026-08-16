with open("CHANGELOG.md", "r") as f:
    content = f.read()

new_log = """
### Added
- **Automated Cancellation Emails**: The backend now seamlessly triggers a graceful Pub/Sub task to send users a "Job Cancelled" email whenever they manually cancel an extraction, or when the Admin Global Kill Switch purges the system.
- **Enhanced Documentation**: Overhauled the Live Markdown Documentation with updated Mermaid.js architecture diagrams, and explicitly detailed email triggers and admin portal capabilities.
- Renamed the 'Changelog' tab inside the Documentation portal to **Releases**.
"""

content = content.replace("### Added\n- **Dynamic Prompt Management", new_log.strip() + "\n- **Dynamic Prompt Management")

with open("CHANGELOG.md", "w") as f:
    f.write(content)
