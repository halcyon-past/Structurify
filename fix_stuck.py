from google.cloud import firestore

db = firestore.Client(project="structurify-504821")
count = 0
for status in ["queued", "processing", "processing_chunks"]:
    docs = db.collection("jobs").where("status", "==", status).stream()
    for doc in docs:
        doc.reference.update({"status": "cancelled", "error_message": "Manually cancelled stuck job"})
        count += 1
print(f"Fixed {count} stuck jobs.")
