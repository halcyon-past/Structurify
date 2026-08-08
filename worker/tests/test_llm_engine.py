from unittest.mock import MagicMock
from src.services.llm_engine import LLMEngine

def test_llm_engine_formatting():
    # We mock the genai.Client
    mock_client = MagicMock()
    
    class MockResponse:
        text = '[{"name": "Alice", "age": 30}]'
        
    mock_client.models.generate_content.return_value = MockResponse()
    
    engine = LLMEngine(client=mock_client)
    
    result = engine.call_gemini_api("Name,Age\\nAlice,30", {"name": "String", "age": "Integer"})
    assert len(result) == 1
    assert result[0]["name"] == "Alice"
    assert result[0]["age"] == 30
    
    # Verify the client was called
    mock_client.models.generate_content.assert_called_once()

def test_llm_engine_empty_schema_auto_clean():
    # Test the Auto-Clean feature when target_schema is empty
    mock_client = MagicMock()
    
    class MockResponse:
        text = '[{"First Name": "Alice", "AGE": "30", " messy_col ": "cleaned"}]'
        
    mock_client.models.generate_content.return_value = MockResponse()
    
    engine = LLMEngine(client=mock_client)
    
    result = engine.call_gemini_api("First Name,AGE, messy_col \\nAlice,30,cleaned", {})
    assert len(result) == 1
    assert result[0]["First Name"] == "Alice"
    assert "AGE" in result[0]
    
    # Verify the client was called
    mock_client.models.generate_content.assert_called_once()
    
    # Verify the config did not include response_schema
    call_kwargs = mock_client.models.generate_content.call_args.kwargs
    assert call_kwargs['config'].response_schema is None
