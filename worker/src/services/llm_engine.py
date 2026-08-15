import json
from typing import Dict, Any, List
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception
from google import genai
from google.genai import types
from src.core.config import settings

def is_retryable_exception(exception: Exception) -> bool:
    err_str = str(exception)
    # Fail fast on Daily Quota limits (Free Tier Per Day)
    if "PerDay" in err_str or "limit: 20" in err_str:
        return False
    # Fail fast on bad requests or not found
    if "400" in err_str and "INVALID_ARGUMENT" in err_str:
        return False
    if "404" in err_str and "NOT_FOUND" in err_str:
        return False
    return True

class LLMEngine:
    def __init__(self, client: genai.Client = None):
        self.client = client or genai.Client(api_key=settings.GEMINI_API_KEY)

    @retry(
        wait=wait_exponential(multiplier=2, min=10, max=120),
        stop=stop_after_attempt(5),
        retry=retry_if_exception(is_retryable_exception),
        reraise=True
    )
    def call_gemini_api(self, chunk_data: str, target_schema: Dict[str, Any]) -> tuple[List[Dict[str, Any]], int]:
        # Handle Auto-Clean Mode (Empty Schema)
        if not target_schema:
            system_instruction = (
                "You are a strict data transformation engine. "
                "Your task is to take the provided raw, messy CSV data, dynamically infer the schema "
                "from the headers, and clean the messy data (fixing capitalization, removing extra whitespace, "
                "standardizing formats) while keeping ALL the original columns. "
                "Rules:\n"
                "1. NO data loss: Every raw row must be mapped to a target row.\n"
                "2. Retain all original columns from the CSV.\n"
                "3. Clean up the messy formatting in the values.\n"
                "4. Output must be a valid JSON array of objects, where each object represents a row."
            )
            prompt = f"Clean the following CSV data and return it as a JSON array of objects:\n\n{chunk_data}"
            
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            token_count = response.usage_metadata.total_token_count if response.usage_metadata else 0
            return json.loads(response.text), token_count

        # Standard Target Schema Mapping Mode
        properties = {}
        for key, value_type in target_schema.items():
            vtype = value_type.lower()
            if vtype == "integer":
                properties[key] = {"type": "integer"}
            elif vtype == "float":
                properties[key] = {"type": "number"}
            elif vtype == "boolean":
                properties[key] = {"type": "boolean"}
            else:
                properties[key] = {"type": "string"}

        response_schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": properties,
                "required": list(properties.keys())
            }
        }

        system_instruction = (
            "You are a strict data transformation engine. "
            "Your task is to take the provided raw, messy CSV data and map it EXACTLY "
            "to the required target JSON schema. "
            "Rules:\n"
            "1. NO data loss: Every raw row must be mapped to a target row.\n"
            "2. Do not omit rows.\n"
            "3. Cast types correctly based on the target schema.\n"
            "4. If a field cannot be mapped or data is missing, provide a sensible default or null.\n"
            "5. Output must be valid JSON."
        )

        prompt = f"Map the following CSV data to the target schema:\n\n{chunk_data}"

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.1,
            ),
        )

        token_count = response.usage_metadata.total_token_count if response.usage_metadata else 0
        return json.loads(response.text), token_count

    def generate_metadata_descriptions(self, target_schema: Dict[str, Any], duckdb_stats: Dict[str, Any]) -> Dict[str, Any]:
        system_instruction = (
            "You are a data analyst. Based on the provided target schema and statistical metadata, "
            "write a concise, high-level description of the entire dataset (global_description), "
            "and a brief 1-sentence description for each column (column_descriptions)."
        )
        
        response_schema = {
            "type": "object",
            "properties": {
                "global_description": {"type": "string"},
                "column_descriptions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "column_name": {"type": "string"},
                            "description": {"type": "string"}
                        },
                        "required": ["column_name", "description"]
                    }
                }
            },
            "required": ["global_description", "column_descriptions"]
        }
        
        prompt = f"Schema: {json.dumps(target_schema)}\nStats: {json.dumps(duckdb_stats)}"
        
        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.2,
            ),
        )
        return json.loads(response.text)
