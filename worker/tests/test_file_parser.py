def test_process_file_success(file_parser):
    job_id = "test-job-123"
    file_path = "uploads/test.csv"
    target_schema = {"name": "String", "age": "Integer"}
    
    file_parser.process_file(job_id, file_path, target_schema)
    
    status_doc = file_parser.firestore_svc.statuses[job_id]
    assert status_doc["status"] == "completed"
    assert status_doc["processed_rows"] == 1
    assert "https://mock-download-url" in status_doc["download_url"]
