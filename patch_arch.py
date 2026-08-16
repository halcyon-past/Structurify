with open("ARCHITECTURE.md", "r") as f:
    content = f.read()

new_content = content.replace(
    "- When the UI triggers a cancellation, the Firestore document is instantly marked as `cancelled`.",
    "- When the UI triggers a cancellation, the Firestore document is instantly marked as `cancelled`, and a notification is published to Pub/Sub to instantly dispatch a 'Job Cancelled' email to the user.\n- The backend also features an **Emergency Kill Switch** that purges the entire Pub/Sub backlog by seeking the cursors to the current timestamp, gracefully halting thousands of chunks instantaneously while firing off email notifications to the affected users."
)

with open("ARCHITECTURE.md", "w") as f:
    f.write(new_content)
