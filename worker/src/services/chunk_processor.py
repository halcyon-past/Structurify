import json
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, START, END
from src.services.llm_engine import LLMEngine

class ChunkState(TypedDict):
    chunk_data: str
    target_schema: Dict[str, Any]
    result: List[Dict[str, Any]]
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
        
        if state.get("errors"):
            chunk_data += "\n\nPREVIOUS ERRORS TO FIX:\n" + "\n".join(state["errors"])
            
        try:
            result = self.llm_engine.call_gemini_api(chunk_data, target_schema)
            return {"result": result, "attempts": attempts, "errors": []}
        except Exception as e:
            print(f"Exception in LLMEngine: {str(e)}")
            return {"result": [], "attempts": attempts, "errors": [str(e)]}

    def _validate_node(self, state: ChunkState):
        result = state.get("result", [])
        if not result:
            return {"errors": ["Empty result or extraction failed."]}
        return {"errors": state.get("errors", [])}
        
    def _route_validation(self, state: ChunkState):
        if not state.get("errors") or state.get("attempts", 0) >= 3:
            return "success"
        return "retry"
        
    def process_chunk(self, chunk_data: str, target_schema: Dict[str, Any]) -> List[Dict[str, Any]]:
        initial_state = {
            "chunk_data": chunk_data,
            "target_schema": target_schema,
            "result": [],
            "errors": [],
            "attempts": 0
        }
        
        final_state = self.app.invoke(initial_state)
        return final_state["result"]
