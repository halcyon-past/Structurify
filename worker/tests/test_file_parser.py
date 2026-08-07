import pytest

def test_process_file_success(file_parser):
    job_id = "test-job-123"
    file_path = "uploads/test.csv"
    target_schema = {"name": "String", "age": "Integer"}
    
    file_parser.process_file(job_id, file_path, target_schema)
    
    status_doc = file_parser.firestore_svc.statuses[job_id]
    assert status_doc["status"] == "completed"
    assert status_doc["processed_rows"] == 1
    assert "https://mock-download-url" in status_doc["download_url"]
def test_process_dirty_csv(file_parser):
    job_id = "test-job-dirty"
    file_path = "uploads/dirty_data.csv"
    target_schema = {"name": "String", "age": "Integer"}
    
    # Even if dirty, it shouldn't crash. It should extract what it can.
    file_parser.process_file(job_id, file_path, target_schema)
    
    status_doc = file_parser.firestore_svc.statuses[job_id]
    # In pandas, the badly formed CSV might have varying rows, but it should complete.
    assert status_doc["status"] == "completed"
    assert status_doc["processed_rows"] > 0
    assert "https://mock-download-url" in status_doc["download_url"]

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
