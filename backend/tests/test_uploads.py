def test_generate_upload_url(client):
    response = client.post(
        "/api/v1/upload-url",
        json={"filename": "test.csv", "content_type": "text/csv"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "upload_url" in data
    assert "file_path" in data
    assert "mock-storage" in data["upload_url"]
