import sys
import json
from dotenv import load_dotenv
load_dotenv('.env')

from google.cloud import firestore

try:
    db = firestore.Client(project="structurify-504821")
    doc = db.collection('settings').document('system').get()
    if doc.exists:
        print(json.dumps(doc.to_dict(), indent=2))
    else:
        print("Document does not exist.")
except Exception as e:
    print(f"Error: {e}")
