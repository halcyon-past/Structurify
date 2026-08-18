import json
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, START, END
from src.services.llm_engine import LLMEngine

class ChunkState(TypedDict):
    chunk_data: str
    target_schema: Dict[str, Any]
    result: List[Dict[str, Any]]
    total_tokens: int
    errors: List[str]
    attempts: int

class ChunkProcessorService:
    def __init__(self, llm_engine: LLMEngine):
        self.llm_engine = llm_engine
        
        # Define the LangGraph StateMachine
        workflow = StateGraph(ChunkState)
        
        workflow.add_node("extract", self._extract_node)
        workflow.add_node("validate", self._validate_node)
        
        workflow.add_edge(START, "extract")
        workflow.add_edge("extract", "validate")
        
        workflow.add_conditional_edges(
            "validate",
            self._route_validation,
            {
                "success": END,
                "retry": "extract"
            }
        )
        
        self.app = workflow.compile()
        
    def _extract_node(self, state: ChunkState):
        chunk_data = state["chunk_data"]
        target_schema = state["target_schema"]
        attempts = state.get("attempts", 0) + 1
        current_tokens = state.get("total_tokens", 0)
        
        if state.get("errors"):
            chunk_data += "\n\nPREVIOUS ERRORS TO FIX:\n" + "\n".join(state["errors"])
            
        try:
            result, token_count = self.llm_engine.call_gemini_api(chunk_data, target_schema)
            return {"result": result, "attempts": attempts, "total_tokens": current_tokens + token_count, "errors": []}
        except Exception as e:
            print(f"Exception in LLMEngine: {str(e)}")
            return {"result": [], "attempts": attempts, "total_tokens": current_tokens, "errors": [str(e)]}

    def _validate_node(self, state: ChunkState):
        result = state.get("result", [])
        errors = state.get("errors", [])
        if not result:
            if errors:
                return {"errors": errors}
            return {"errors": ["Empty result or extraction failed."]}
        return {"errors": errors}
        
    def _route_validation(self, state: ChunkState):
        errors = state.get("errors", [])
        if not errors:
            return "success"
            
        # Fail fast on fatal errors (Daily Quota, 400, 404)
        for err in errors:
            if any(fatal in err for fatal in ["PerDay", "limit: 20", "400", "404"]):
                print(f"Fatal error detected. Aborting LangGraph retries: {err}")
                return "success"
                
        if state.get("attempts", 0) >= 3:
            return "success"
        return "retry"
        
    def process_chunk(self, chunk_data: str, target_schema: Dict[str, Any]) -> tuple[List[Dict[str, Any]], int, List[str]]:
        initial_state = {
            "chunk_data": chunk_data,
            "target_schema": target_schema,
            "result": [],
            "total_tokens": 0,
            "errors": [],
            "attempts": 0
        }
        
        final_state = self.app.invoke(initial_state)
        result = final_state["result"]
        
        # --- POST-PROCESSING: Deterministic Date Standardization ---
        # Ensures that across all independent parallel workers, dates are strictly standardized
        # regardless of LLM hallucinations or variations.
        if result:
            try:
                import pandas as pd
                df = pd.DataFrame(result)
                for col in df.columns:
                    if df[col].dtype == 'object':
                        sample = df[col].dropna()
                        if sample.empty: continue
                        
                        # Use mixed format parsing to handle both LLM ISO outputs and raw messy formats
                        parsed = pd.to_datetime(sample, errors='coerce', format='mixed')
                        
                        # If more than 50% of the non-null strings are valid dates, it's a date column
                        if parsed.notna().sum() / len(sample) >= 0.5:
                            df[col] = pd.to_datetime(df[col], errors='coerce', format='mixed')
                            df[col] = df[col].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
                            
                # Convert back to dict, replacing NaNs with None
                df = df.where(pd.notnull(df), None)
                result = df.to_dict(orient='records')
            except Exception as e:
                print(f"Post-processing date standardization failed: {e}")
                
        return result, final_state.get("total_tokens", 0), final_state.get("errors", [])
