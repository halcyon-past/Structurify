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
