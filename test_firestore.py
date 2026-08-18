import requests
import os
import json

token = os.popen('gcloud auth print-access-token').read().strip()
url = "https://firestore.googleapis.com/v1/projects/structurify-504821/databases/(default)/documents/settings/system"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

resp = requests.get(url, headers=headers)
doc = resp.json()
print(doc["fields"]["prompt_auto_clean_system"]["stringValue"])
