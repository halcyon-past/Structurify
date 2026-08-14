import pytest
from unittest.mock import MagicMock
from src.services.audit import AuditService

def test_log_job_start():
    mock_db = MagicMock()
    audit_svc = AuditService(mock_db)
    
    job_data = {
        "job_id": "test-123",
        "user_id": "user-456",
        "email": "test@example.com",
        "role": "admin",
        "plan": "pro",
        "file_name": "data.csv"
    }
    
    audit_svc.log_job_start(job_data, file_size_mb=2.5, total_chunks=10)
    
    mock_db.collection.assert_called_with("job_audits")
    mock_db.collection().document.assert_called_with("test-123")
    mock_db.collection().document().set.assert_called_once()
    
    call_args = mock_db.collection().document().set.call_args[0][0]
    assert call_args["job_id"] == "test-123"
    assert call_args["status"] == "processing"
    assert call_args["role"] == "admin"
    assert call_args["file_size_mb"] == 2.5
    assert call_args["total_chunks"] == 10
    assert "started_at" in call_args

def test_log_job_failure():
    mock_db = MagicMock()
    audit_svc = AuditService(mock_db)
    
    audit_svc.log_job_failure("test-123", "Out of memory error")
    
    mock_db.collection.assert_called_with("job_audits")
    mock_db.collection().document.assert_called_with("test-123")
    mock_db.collection().document().update.assert_called_once()
    
    call_args = mock_db.collection().document().update.call_args[0][0]
    assert call_args["status"] == "failed"
    assert call_args["error_message"] == "Out of memory error"
    assert "completed_at" in call_args

def test_log_job_completion():
    mock_db = MagicMock()
    audit_svc = AuditService(mock_db)
    
    job_data = {
        "job_id": "test-123",
        "processed_rows": 500
    }
    stats = {"col1": {"null_count": 0}}
    semantic_meta = {"global_description": "Test"}
    download_url = "https://example.com/test.zip"
    
    audit_svc.log_job_completion(job_data, stats, semantic_meta, download_url)
    
    mock_db.collection.assert_called_with("job_audits")
    mock_db.collection().document.assert_called_with("test-123")
    mock_db.collection().document().update.assert_called_once()
    
    call_args = mock_db.collection().document().update.call_args[0][0]
    assert call_args["status"] == "completed"
    assert call_args["download_url"] == download_url
    assert call_args["processed_rows"] == 500
