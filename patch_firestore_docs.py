import os
from google.cloud import firestore

try:
    db = firestore.Client(project="structurify-504821")
    
    with open("frontend/src/app/docs/page.tsx", "r") as f:
        content = f.read()

    start_marker = "const DEFAULT_DOCS = `"
    end_marker = "`;"
    
    start_idx = content.index(start_marker) + len(start_marker)
    end_idx = content.index(end_marker, start_idx)
    
    docs_content = content[start_idx:end_idx]
    
    db.collection("settings").document("docs_v2").set({"content": docs_content}, merge=True)
    print("Successfully updated Firestore docs.")
except Exception as e:
    print(f"Error updating Firestore: {e}")
