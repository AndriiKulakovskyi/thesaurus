"""Main application testing module"""
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

def test_read_databases():
    """Testing the /api/databases route response"""
    response = client.get('/api/databases')
    assert response.status_code == 200

def test_read_database():
    """Testing the /api/databases/{dataset_id} route response"""
    dataset_id = "ebipolar"
    response = client.get(f'/api/databases/{dataset_id}')
    assert response.status_code == 200

def test_read_questionnaires():
    """Testing the /api/databases/{dataset_id}/questionnaires route response"""
    dataset_id = "ebipolar"
    response = client.get(f'/api/databases/{dataset_id}/questionnaires')
    assert response.status_code == 200

def test_extract():
    """Testing the /api/extract route response"""
    extraction_request = {
        "datasetId": "easpeger",
        "selections": [
            {
                "questionnaireId": "BFI_autoq_bfi", 
                "variables": [
                    "BFI1",
                    "BFI2",
                    "BFI39",
                    "EXTRA_BIF_SCORE",
                    "CONS_BIF_SCORE"
                ]
            }
        ]
    }
    response = client.post(
        url='/api/extract',
        json=extraction_request
    )
    assert response.status_code == 200

def test_migration_security():
    """Testing the /migration/ routes security""" 
    response = client.get('/migration/')
    assert response.status_code == 401
    response = client.get('/migration/clear')
    assert response.status_code == 401

    wrong_api_key = "WRONG_API_KEY_1234"
    response = client.get(
        url='/migration/',
        headers={"X-Admin-API-Key": wrong_api_key}
    )
    assert response.status_code == 403
    response = client.get(
        url='/migration/clear',
        headers={"X-Admin-API-Key": wrong_api_key}
    )
    assert response.status_code == 403
