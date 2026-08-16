from google.cloud import firestore

# Initialize Firestore client
db = firestore.Client(project="structurify-504821")

# The default values to insert
default_settings = {
    "prompt_auto_clean_system": "You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data, dynamically infer the schema from the headers, and clean the messy data (fixing capitalization, removing extra whitespace, standardizing formats) while keeping ALL the original columns. Rules:\n1. NO data loss: Every raw row must be mapped to a target row.\n2. Retain all original columns from the CSV.\n3. Clean up the messy formatting in the values.\n4. Output must be a valid JSON array of objects, where each object represents a row.",
    
    "prompt_auto_clean_user": "Clean the following CSV data and return it as a JSON array of objects:\n\n{chunk_data}",
    
    "prompt_schema_map_system": "You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data and map it EXACTLY to the required target JSON schema. Rules:\n1. NO data loss: Every raw row must be mapped to a target row.\n2. Do not omit rows.\n3. Cast types correctly based on the target schema.\n4. If a field cannot be mapped or data is missing, provide a sensible default or null.\n5. Output must be valid JSON.",
    
    "prompt_schema_map_user": "Map the following CSV data to the target schema:\n\n{chunk_data}",
    
    "prompt_metadata_system": "You are a data analyst. Based on the provided target schema and statistical metadata, write a concise, high-level description of the entire dataset (global_description), and a brief 1-sentence description for each column (column_descriptions).",
    
    "prompt_metadata_user": "Schema: {schema}\nStats: {stats}"
}

# Update the document, merging with existing data (llm_model, etc.)
doc_ref = db.collection('settings').document('system')
doc_ref.set(default_settings, merge=True)

print("Successfully seeded default prompts to Firestore!")
