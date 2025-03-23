import os
import sys
import json
import shutil
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add the parent directory to path so that the main module can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)

# Path to test data
TEST_DATA_DIR = Path(__file__).parent / "test_data"

# Fixture for setting up test environment
@pytest.fixture
def setup_test_env(monkeypatch):
    """
    Set up test environment with mock data files
    """
    # Create test directories
    TEST_DATA_DIR.mkdir(parents=True, exist_ok=True)
    test_questionnaires_dir = TEST_DATA_DIR / "questionnaires"
    test_questionnaires_dir.mkdir(exist_ok=True)
    test_ebipolar_dir = test_questionnaires_dir / "ebipolar"
    test_ebipolar_dir.mkdir(exist_ok=True)
    test_eschizo_dir = test_questionnaires_dir / "eschizo"
    test_eschizo_dir.mkdir(exist_ok=True)
    
    # Create test databases.json
    databases = [
        {
            "id": "ebipolar",
            "questionnaires_models": ["1.json"],
            "questionnaires_folder": "data/questionnaires/ebipolar",
            "title": "Clinical Assessment Database",
            "description": "Structured clinical data including DSM diagnoses, mood ratings, and pharmacotherapy records for bipolar patients.",
            "record_count": 250,
            "last_updated": "2023-10-12"
        },
        {
            "id": "eschizo",
            "questionnaires_models": ["1.json"],
            "questionnaires_folder": "data/questionnaires/eschizo",
            "title": "Neurocognitive Performance Database",
            "description": "Results from cognitive tasks (working memory, attention, executive function) for schizophrenia participants.",
            "record_count": 180,
            "last_updated": "2023-08-30"
        }
    ]
    
    with open(TEST_DATA_DIR / "databases.json", "w", encoding="utf-8") as f:
        json.dump(databases, f)
    
    # Create test questionnaire files
    ebipolar_questionnaire = [
        {
            "form": {
                "nomFormulaire": "BFI",
                "nomTable": "autoq_bfi"
            },
            "fields": [
                [
                    {
                        "description": "1.  est bavard",
                        "variable_name": "BFI1",
                        "possible_answers": {
                            "1": "désapprouve fortement",
                            "2": "désapprouve un peu",
                            "3": "n'approuve ni ne désapprouve",
                            "4": "approuve un peu",
                            "5": "approuve fortement"
                        },
                        "data_type": "int"
                    }
                ],
                [
                    {
                        "description": "2. a tendance à critiquer les autres",
                        "variable_name": "BFI2",
                        "possible_answers": {
                            "5": "désapprouve fortement",
                            "4": "désapprouve un peu",
                            "3": "n'approuve ni ne désapprouve",
                            "2": "approuve un peu",
                            "1": "approuve fortement"
                        },
                        "data_type": "int"
                    }
                ]
            ]
        }
    ]
    
    with open(test_ebipolar_dir / "1.json", "w", encoding="utf-8") as f:
        json.dump(ebipolar_questionnaire, f)
    
    eschizo_questionnaire = [
        {
            "form": {
                "nomFormulaire": "PANSS",
                "nomTable": "panss"
            },
            "fields": [
                [
                    {
                        "description": "P1. Idées délirantes",
                        "variable_name": "PANSS_P1",
                        "possible_answers": {
                            "1": "Absent",
                            "2": "Minime",
                            "3": "Léger",
                            "4": "Modéré",
                            "5": "Modérément sévère",
                            "6": "Sévère",
                            "7": "Extrême"
                        },
                        "data_type": "int"
                    }
                ]
            ]
        }
    ]
    
    with open(test_eschizo_dir / "1.json", "w", encoding="utf-8") as f:
        json.dump(eschizo_questionnaire, f)
    
    # Override paths in the main application
    monkeypatch.setattr("main.DATA_DIR", TEST_DATA_DIR)
    monkeypatch.setattr("main.DATABASES_FILE", TEST_DATA_DIR / "databases.json")
    monkeypatch.setattr("main.QUESTIONNAIRES_DIR", test_questionnaires_dir)
    
    yield
    
    # Cleanup (optional - comment out if you want to inspect the test files)
    shutil.rmtree(TEST_DATA_DIR)

# Tests
def test_health_check():
    """Test health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_read_databases(setup_test_env):
    """Test reading all databases"""
    response = client.get("/api/databases")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == "ebipolar"
    assert data[1]["id"] == "eschizo"

def test_read_database(setup_test_env):
    """Test reading a specific database"""
    response = client.get("/api/databases/ebipolar")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "ebipolar"
    assert data["title"] == "Clinical Assessment Database"

def test_read_database_not_found(setup_test_env):
    """Test reading a non-existent database"""
    response = client.get("/api/databases/nonexistent")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_read_questionnaires(setup_test_env, monkeypatch):
    """Test reading questionnaires for a database"""
    # Need to monkey patch the questionnaires path resolution
    def mock_get_questionnaires(dataset_id):
        if dataset_id == "ebipolar":
            return [
                {
                    "form": {
                        "nomFormulaire": "BFI",
                        "nomTable": "autoq_bfi"
                    },
                    "fields": [
                        [
                            {
                                "description": "1.  est bavard",
                                "variable_name": "BFI1",
                                "possible_answers": {
                                    "1": "désapprouve fortement",
                                    "2": "désapprouve un peu",
                                    "3": "n'approuve ni ne désapprouve",
                                    "4": "approuve un peu",
                                    "5": "approuve fortement"
                                },
                                "data_type": "int"
                            }
                        ],
                        [
                            {
                                "description": "2. a tendance à critiquer les autres",
                                "variable_name": "BFI2",
                                "possible_answers": {
                                    "5": "désapprouve fortement",
                                    "4": "désapprouve un peu",
                                    "3": "n'approuve ni ne désapprouve",
                                    "2": "approuve un peu",
                                    "1": "approuve fortement"
                                },
                                "data_type": "int"
                            }
                        ]
                    ]
                }
            ]
        else:
            return []
    
    monkeypatch.setattr("main.get_questionnaires", mock_get_questionnaires)
    
    response = client.get("/api/databases/ebipolar/questionnaires")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["form"]["nomFormulaire"] == "BFI"
    assert data[0]["form"]["nomTable"] == "autoq_bfi"

def test_extract_data(setup_test_env, monkeypatch):
    """Test data extraction endpoint"""
    # Mock the get_database and get_questionnaires functions
    def mock_get_database(dataset_id):
        return {
            "id": "ebipolar",
            "title": "Clinical Assessment Database",
            "description": "Structured clinical data",
            "record_count": 250
        }
    
    def mock_get_questionnaires(dataset_id):
        return [
            {
                "form": {
                    "nomFormulaire": "BFI",
                    "nomTable": "autoq_bfi"
                },
                "fields": []
            }
        ]
    
    monkeypatch.setattr("main.get_database", mock_get_database)
    monkeypatch.setattr("main.get_questionnaires", mock_get_questionnaires)
    
    # Test payload
    payload = {
        "datasetId": "ebipolar",
        "selections": [
            {
                "questionnaireId": "autoq_bfi",
                "variables": ["BFI1", "BFI2"]
            }
        ]
    }
    
    response = client.post("/api/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["dataset"] == "Clinical Assessment Database"
    assert data["total_variables"] == 2

def test_extract_data_invalid_questionnaire(setup_test_env, monkeypatch):
    """Test extraction with invalid questionnaire ID"""
    # Mock the get_database and get_questionnaires functions
    def mock_get_database(dataset_id):
        return {
            "id": "ebipolar",
            "title": "Clinical Assessment Database",
            "description": "Structured clinical data",
            "record_count": 250
        }
    
    def mock_get_questionnaires(dataset_id):
        return [
            {
                "form": {
                    "nomFormulaire": "BFI",
                    "nomTable": "autoq_bfi"
                },
                "fields": []
            }
        ]
    
    monkeypatch.setattr("main.get_database", mock_get_database)
    monkeypatch.setattr("main.get_questionnaires", mock_get_questionnaires)
    
    # Test payload with invalid questionnaire
    payload = {
        "datasetId": "ebipolar",
        "selections": [
            {
                "questionnaireId": "nonexistent_questionnaire",
                "variables": ["VAR1", "VAR2"]
            }
        ]
    }
    
    response = client.post("/api/extract", json=payload)
    assert response.status_code == 400
    assert "not found in database" in response.json()["detail"]
