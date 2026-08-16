import re

with open("worker/src/services/llm_engine.py", "r") as f:
    content = f.read()

# Auto Clean Mode
default_auto_clean_sys = """You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data, dynamically infer the schema from the headers, and clean the messy data (fixing capitalization, removing extra whitespace, standardizing formats) while keeping ALL the original columns. Rules:
1. NO data loss: Every raw row must be mapped to a target row.
2. Retain all original columns from the CSV.
3. Clean up the messy formatting in the values.
4. Output must be a valid JSON array of objects, where each object represents a row."""

default_auto_clean_user = "Clean the following CSV data and return it as a JSON array of objects:\\n\\n{chunk_data}"

content = re.sub(
    r'system_instruction = \(\s*"You are a strict data transformation engine\. ".*?"4\. Output must be a valid JSON array of objects, where each object represents a row\."\s*\)',
    f'system_instruction = config_service.get("prompt_auto_clean_system", """{default_auto_clean_sys}""")',
    content, flags=re.DOTALL
)

content = re.sub(
    r'prompt = f"Clean the following CSV data and return it as a JSON array of objects:\\n\\n\{chunk_data\}"',
    f'prompt_template = config_service.get("prompt_auto_clean_user", "Clean the following CSV data and return it as a JSON array of objects:\\n\\n{{chunk_data}}")\n            prompt = prompt_template.format(chunk_data=chunk_data)',
    content
)

# Standard Target Schema
default_schema_sys = """You are a strict data transformation engine. Your task is to take the provided raw, messy CSV data and map it EXACTLY to the required target JSON schema. Rules:
1. NO data loss: Every raw row must be mapped to a target row.
2. Do not omit rows.
3. Cast types correctly based on the target schema.
4. If a field cannot be mapped or data is missing, provide a sensible default or null.
5. Output must be valid JSON."""

content = re.sub(
    r'system_instruction = \(\s*"You are a strict data transformation engine\. ".*?"5\. Output must be valid JSON\."\s*\)',
    f'system_instruction = config_service.get("prompt_schema_map_system", """{default_schema_sys}""")',
    content, flags=re.DOTALL
)

content = re.sub(
    r'prompt = f"Map the following CSV data to the target schema:\\n\\n\{chunk_data\}"',
    f'prompt_template = config_service.get("prompt_schema_map_user", "Map the following CSV data to the target schema:\\n\\n{{chunk_data}}")\n        prompt = prompt_template.format(chunk_data=chunk_data)',
    content
)

# Metadata
default_meta_sys = "You are a data analyst. Based on the provided target schema and statistical metadata, write a concise, high-level description of the entire dataset (global_description), and a brief 1-sentence description for each column (column_descriptions)."

content = re.sub(
    r'system_instruction = \(\s*"You are a data analyst\..*?and a brief 1-sentence description for each column \(column_descriptions\)\."\s*\)',
    f'system_instruction = config_service.get("prompt_metadata_system", "{default_meta_sys}")',
    content, flags=re.DOTALL
)

content = re.sub(
    r'prompt = f"Schema: \{json\.dumps\(target_schema\)\}\\nStats: \{json\.dumps\(duckdb_stats\)\}"',
    f'prompt_template = config_service.get("prompt_metadata_user", "Schema: {{schema}}\\nStats: {{stats}}")\n        prompt = prompt_template.format(schema=json.dumps(target_schema), stats=json.dumps(duckdb_stats))',
    content
)

with open("worker/src/services/llm_engine.py", "w") as f:
    f.write(content)

