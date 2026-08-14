import pytest

def test_process_file_success(file_parser):
    job_id = "test-job-123"
    file_path = "uploads/test.csv"
    target_schema = {"name": "String", "age": "Integer"}
    
    file_parser.process_file(job_id, file_path, target_schema)
    
    # Assert status was set to processing_chunks
    file_parser.firestore_svc.db.collection().document().update.assert_called()
    assert file_parser.publisher.publish.called
    assert file_parser.audit_svc.log_job_start.called

def test_process_dirty_csv(file_parser):
    job_id = "test-job-dirty"
    file_path = "uploads/dirty_data.csv"
    target_schema = {"name": "String", "age": "Integer"}
    
    file_parser.process_file(job_id, file_path, target_schema)
    
    assert file_parser.publisher.publish.called

def test_process_massive_csv(file_parser):
    import os
    if not os.path.exists("tests/data/massive_test_1.csv"):
        pytest.skip("massive_test_1.csv not generated. Run sample_data/generate_massive_csv.py first.")
        
    job_id = "test-job-massive"
    file_path = "uploads/massive_test_1.csv"
    target_schema = {"first_name": "String", "last_name": "String"}
    
    file_parser.process_file(job_id, file_path, target_schema)
    
    file_parser.firestore_svc.db.collection().document().update.assert_called()
    
    # A 1M row file (excluding header) with chunk_size=500 results in 2000 chunks. 
    # With header included in chunks, wait, pandas handles header implicitly.
    # total rows = 1,000,000. chunk_size = 500. So 2000 chunks.
    assert file_parser.publisher.publish.call_count == 2000
    
    update_call_args = file_parser.firestore_svc.db.collection().document().update.call_args[0][0]
    assert update_call_args["total_chunks"] == 2000


def test_process_empty_file(file_parser):
    job_id = "test-job-empty"
    file_path = "uploads/empty.csv"
    target_schema = {"name": "String", "age": "Integer"}
    
    # An empty CSV raises pandas.errors.EmptyDataError
    with pytest.raises(Exception):
        file_parser.process_file(job_id, file_path, target_schema)
        
    status_doc = file_parser.firestore_svc.statuses[job_id]
    assert status_doc["status"] == "failed"
    assert "error_message" in status_doc

def test_unsupported_file_format(file_parser):
    job_id = "test-job-unsupported"
    file_path = "uploads/test.txt"
    target_schema = {"name": "String"}
    
    with pytest.raises(ValueError, match="Unsupported file format"):
        file_parser.process_file(job_id, file_path, target_schema)
        
    status_doc = file_parser.firestore_svc.statuses[job_id]
    assert status_doc["status"] == "failed"
    assert "Unsupported file format" in status_doc["error_message"]
