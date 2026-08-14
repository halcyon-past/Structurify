def test_create_and_get_job(client, mock_firestore):
    # Test Create Job
    payload = {
        "file_path": "uploads/test.csv",
        "file_name": "test.csv",
        "target_schema": {"name": "String"},
        "email": "test@example.com",
        "role": "admin",
        "plan": "pro"
    }
    response = client.post("/api/v1/jobs/", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "queued"
    
    job_id = data["job_id"]
    
    # Test Get Job
    response = client.get(f"/api/v1/jobs/{job_id}")
    assert response.status_code == 200
    job_data = response.json()
    assert job_data["job_id"] == job_id
    assert job_data["status"] == "queued"

def test_get_nonexistent_job(client):
    response = client.get("/api/v1/jobs/invalid-id")
    assert response.status_code == 404
