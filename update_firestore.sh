TOKEN=$(gcloud auth print-access-token)
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://firestore.googleapis.com/v1/projects/structurify-504821/databases/(default)/documents/settings/system?updateMask.fieldPaths=prompt_auto_clean_system&updateMask.fieldPaths=prompt_auto_clean_user&updateMask.fieldPaths=prompt_schema_map_system&updateMask.fieldPaths=prompt_schema_map_user&updateMask.fieldPaths=prompt_metadata_system&updateMask.fieldPaths=prompt_metadata_user" \
  -d '{
    "fields": {
      "prompt_auto_clean_system": {
        "stringValue": "You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data, dynamically infer the schema from the headers, and clean the messy data (fixing capitalization, removing extra whitespace, standardizing formats) while keeping ALL the original columns. Rules:\n1. NO data loss: Every raw row must be mapped to a target row.\n2. Retain all original columns from the CSV.\n3. Clean up the messy formatting in the values.\n4. Output must be a valid JSON array of objects, where each object represents a row."
      },
      "prompt_auto_clean_user": {
        "stringValue": "Clean the following CSV data and return it as a JSON array of objects:\n\n{chunk_data}"
      },
      "prompt_schema_map_system": {
        "stringValue": "You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data and map it EXACTLY to the required target JSON schema. Rules:\n1. NO data loss: Every raw row must be mapped to a target row.\n2. Do not omit rows.\n3. Cast types correctly based on the target schema.\n4. If a field cannot be mapped or data is missing, provide a sensible default or null.\n5. Output must be valid JSON."
      },
      "prompt_schema_map_user": {
        "stringValue": "Map the following CSV data to the target schema:\n\n{chunk_data}"
      },
      "prompt_metadata_system": {
        "stringValue": "You are a data analyst. Based on the provided target schema and statistical metadata, write a concise, high-level description of the entire dataset (global_description), and a brief 1-sentence description for each column (column_descriptions)."
      },
      "prompt_metadata_user": {
        "stringValue": "Schema: {schema}\nStats: {stats}"
      }
    }
  }'
