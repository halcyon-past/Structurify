import pytest
from src.services.chunk_processor import ChunkProcessorService

class MockLLMEngineSuccess:
    def call_gemini_api(self, chunk_data: str, target_schema: dict) -> tuple:
        return [{"name": "John Doe", "age": 25}], 100

class MockLLMEngineFailure:
    def __init__(self):
        self.call_count = 0
        
    def call_gemini_api(self, chunk_data: str, target_schema: dict) -> list:
        self.call_count += 1
        raise Exception("API Rate Limit Exceeded")

def test_process_chunk_success():
    engine = MockLLMEngineSuccess()
    processor = ChunkProcessorService(engine)
    
    result, tokens, errors = processor.process_chunk("John, 25", {"name": "String", "age": "Integer"})
    
    assert len(result) == 1
    assert result[0]["name"] == "John Doe"
    assert tokens == 100
    assert len(errors) == 0

def test_process_chunk_retry_logic():
    engine = MockLLMEngineFailure()
    processor = ChunkProcessorService(engine)
    
    result, tokens, errors = processor.process_chunk("John, 25", {"name": "String", "age": "Integer"})
    
    # It should retry 3 times (the max loop limit in LangGraph for validation before returning success with empty result)
    # The attempts counter starts at 0. So it runs for 0, 1, 2, 3 -> wait, it loops until attempts >= 3.
    # In _process_node, attempts is incremented by 1. 
    # If initial attempts is 0, after 1st try: attempts=1.
    # _route_validation sees attempts < 3, routes to retry.
    # 2nd try: attempts=2.
    # 3rd try: attempts=3.
    # _route_validation sees attempts >= 3, routes to success.
    # So call_gemini_api is called exactly 3 times.
    
    assert engine.call_count == 3
    assert result == [] # Result is empty because all retries failed
    assert tokens == 0
    assert len(errors) > 0

def test_auto_clean_mode():
    engine = MockLLMEngineSuccess()
    processor = ChunkProcessorService(engine)
    
    # Empty schema dictionary to trigger Auto-Clean mode
    result, tokens, errors = processor.process_chunk("JOHN DOE, 25", {})
    
    assert len(result) == 1
    assert result[0]["name"] == "John Doe"
    assert tokens == 100
    assert len(errors) == 0

class MockLLMEngineFatalFailure:
    def __init__(self):
        self.call_count = 0
        
    def call_gemini_api(self, chunk_data: str, target_schema: dict) -> tuple:
        self.call_count += 1
        raise Exception("429 RESOURCE_EXHAUSTED PerDay limit: 20")

def test_process_chunk_fatal_error_fast_fail():
    engine = MockLLMEngineFatalFailure()
    processor = ChunkProcessorService(engine)
    
    result, tokens, errors = processor.process_chunk("John, 25", {"name": "String", "age": "Integer"})
    
    # It should immediately fail and NOT retry, meaning it only calls API once.
    assert engine.call_count == 1
    assert result == []
    assert tokens == 0
    assert len(errors) == 1
