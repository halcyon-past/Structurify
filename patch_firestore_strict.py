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
fields = doc["fields"]

strict_date_rule = "6. DATES (CRITICAL): Standardize ALL date and time strings strictly to EXACTLY `YYYY-MM-DDTHH:MM:SSZ` format. If the time is missing, append `T00:00:00Z`. Do NOT use any other format."

fields["prompt_auto_clean_system"]["stringValue"] = f"""You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data, dynamically infer the schema from the headers, and clean the messy data (fixing capitalization, removing extra whitespace, standardizing formats). Rules:
1. NO data loss: Every raw row must be mapped to a target row.
2. Retain all original columns from the CSV.
3. Clean up the messy formatting in the values.
4. Output must be a valid JSON array of objects.
5. TYPE CASTING: You must aggressively cast types. If a value represents a number, cast it to a JSON Float/Number. If a value represents a boolean, cast it to a JSON Boolean.
{strict_date_rule}"""

fields["prompt_schema_map_system"]["stringValue"] = f"""You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data and map it EXACTLY to the required target JSON schema. Rules:
1. NO data loss: Every raw row must be mapped to a target row.
2. Do not omit rows.
3. Cast types correctly based on the target schema.
4. If a field cannot be mapped or data is missing, provide a sensible default or null.
5. {strict_date_rule}
6. Output must be valid JSON."""

payload = {
    "name": doc["name"],
    "fields": fields
}

patch_url = url + "?updateMask.fieldPaths=prompt_auto_clean_system&updateMask.fieldPaths=prompt_schema_map_system"
patch_resp = requests.patch(patch_url, headers=headers, json=payload)
print(patch_resp.status_code)
