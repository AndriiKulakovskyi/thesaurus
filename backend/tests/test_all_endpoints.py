import pytest
import pytest_asyncio
from httpx import AsyncClient
from unittest.mock import Mock, patch
import pandas as pd
import io
from backend.main import app, DatabaseInspector
from httpx import ASGITransport

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

# Mock data for database inspector
MOCK_SCHEMAS = ["_prod_clean_easperger", "_prod_clean_ebipolar"]

MOCK_SCHEMAS_WITH_METADATA = [
    {
        "id": "_prod_clean_easperger",
        "title": "Asperger",
        "description": "Clinical dataset for Asperger study",
        "metadata": {
            "study_type": "Longitudinal Cohort Study",
            "year_started": 2018,
            "principal_investigator": "Dr. Emily Chen",
            "patient_count": 742
        }
    },
    {
        "id": "_prod_clean_ebipolar",
        "title": "Bipolarity",
        "description": "Clinical dataset for bipolar study",
        "metadata": {
            "study_type": "Clinical Trial",
            "year_started": 2019,
            "principal_investigator": "Dr. Michael Rodriguez",
            "patient_count": 895
        }
    }
]

MOCK_ANALYSIS = {
    'summary': {
        'total_schemas': 2,
        'total_tables': 10,
        'total_columns': 150,
        'total_relationships': 5
    },
    'schemas': {
        '_prod_clean_easperger': {
            'tables': {
                '_prod_clean_easperger.questionnaire': {
                    'name': 'questionnaire',
                    'columns': [
                        {'name': 'id', 'type': 'INTEGER', 'nullable': False, 'primary_key': True},
                        {'name': 'patient_id', 'type': 'INTEGER', 'nullable': False},
                        {'name': 'question_1', 'type': 'TEXT', 'nullable': True},
                        {'name': 'question_2', 'type': 'TEXT', 'nullable': True}
                    ],
                    'primary_keys': ['id'],
                    'foreign_keys': [{'column': 'patient_id', 'references_table': 'patients', 'references_column': 'id'}],
                    'indexes': []
                }
            },
            'total_tables': 1,
            'total_columns': 4
        }
    }
}

@pytest.fixture
def mock_db_inspector():
    """Create a mock database inspector"""
    with patch('backend.main.DatabaseInspector') as MockInspector:
        mock_inspector = Mock()
        mock_inspector.get_schemas.return_value = MOCK_SCHEMAS
        mock_inspector.get_schemas_with_metadata.return_value = MOCK_SCHEMAS_WITH_METADATA
        mock_inspector.analyze_database.return_value = MOCK_ANALYSIS
        MockInspector.return_value = mock_inspector
        yield mock_inspector

@pytest.fixture(autouse=True)
def setup_db_inspector(mock_db_inspector):
    """Setup database inspector for all tests"""
    with patch('backend.main.db_inspector', mock_db_inspector):
        yield

@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test the root endpoint"""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Clinical Study Data API"
    assert "version" in data
    assert "docs_url" in data

@pytest.mark.asyncio
async def test_get_schemas(client, mock_db_inspector):
    """Test getting all schemas"""
    response = await client.get("/schemas")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert "_prod_clean_easperger" in data
    assert "_prod_clean_ebipolar" in data

@pytest.mark.asyncio
async def test_get_schemas_with_metadata(client, mock_db_inspector):
    """Test getting schemas with metadata"""
    response = await client.get("/schemas-with-metadata")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["id"] == "_prod_clean_easperger"
    assert "metadata" in data[0]
    assert data[0]["metadata"]["study_type"] == "Longitudinal Cohort Study"

@pytest.mark.asyncio
async def test_get_schema_tables(client, mock_db_inspector):
    """Test getting tables for a specific schema"""
    response = await client.get("/schemas/_prod_clean_easperger/tables")
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data
    assert "_prod_clean_easperger.questionnaire" in data["tables"]

@pytest.mark.asyncio
async def test_get_schema_tables_invalid_schema(client, mock_db_inspector):
    """Test getting tables for an invalid schema"""
    response = await client.get("/schemas/invalid_schema/tables")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_get_table_details(client, mock_db_inspector):
    """Test getting details for a specific table"""
    response = await client.get("/schemas/_prod_clean_easperger/tables/questionnaire")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "questionnaire"
    assert len(data["columns"]) == 4
    assert "primary_keys" in data
    assert "foreign_keys" in data

@pytest.mark.asyncio
async def test_get_database_summary(client, mock_db_inspector):
    """Test getting database summary"""
    response = await client.get("/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_schemas"] == 2
    assert data["total_tables"] == 10
    assert data["total_columns"] == 150
    assert data["total_relationships"] == 5

@pytest.mark.asyncio
async def test_extract_data(client, mock_db_inspector):
    """Test data extraction endpoint"""
    # Mock the pandas DataFrame creation
    mock_data = pd.DataFrame({
        'patient_id': [1, 2],
        'question_1': ['answer1', 'answer2'],
        'question_2': ['answer3', 'answer4']
    })
    
    with patch('pandas.read_sql', return_value=mock_data):
        request_data = {
            "datasetId": "_prod_clean_easperger",
            "selections": [
                {
                    "questionnaireId": "questionnaire",
                    "variables": ["patient_id", "question_1", "question_2"]
                }
            ]
        }
        
        response = await client.post("/extract", json=request_data)
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv"
        assert "attachment" in response.headers["content-disposition"]
        
        # Check CSV content
        csv_content = pd.read_csv(io.StringIO(response.content.decode()))
        assert list(csv_content.columns) == ['patient_id', 'question_1', 'question_2']
        assert len(csv_content) == 2

@pytest.mark.asyncio
async def test_extract_data_invalid_schema(client, mock_db_inspector):
    """Test data extraction with invalid schema"""
    request_data = {
        "datasetId": "invalid_schema",
        "selections": [
            {
                "questionnaireId": "questionnaire",
                "variables": ["patient_id"]
            }
        ]
    }
    
    with patch('pandas.read_sql', side_effect=Exception("Schema not found")):
        response = await client.post("/extract", json=request_data)
        assert response.status_code == 500
        assert "error" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_extract_data_invalid_table(client, mock_db_inspector):
    """Test data extraction with invalid table"""
    request_data = {
        "datasetId": "_prod_clean_easperger",
        "selections": [
            {
                "questionnaireId": "invalid_table",
                "variables": ["patient_id"]
            }
        ]
    }
    
    response = await client.post("/extract", json=request_data)
    # The response should still be 200 but contain diagnostic information
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]

@pytest.mark.asyncio
async def test_extract_data_multiple_tables(client, mock_db_inspector):
    """Test data extraction from multiple tables"""
    # Mock data for multiple tables
    mock_data1 = pd.DataFrame({
        'patient_id': [1, 2],
        'question_1': ['answer1', 'answer2']
    })
    mock_data2 = pd.DataFrame({
        'patient_id': [1, 2],
        'score': [85, 90]
    })
    
    with patch('pandas.read_sql', side_effect=[mock_data1, mock_data2]):
        request_data = {
            "datasetId": "_prod_clean_easperger",
            "selections": [
                {
                    "questionnaireId": "questionnaire",
                    "variables": ["patient_id", "question_1"]
                },
                {
                    "questionnaireId": "scores",
                    "variables": ["patient_id", "score"]
                }
            ]
        }
        
        response = await client.post("/extract", json=request_data)
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]

@pytest.mark.asyncio
async def test_extract_data_empty_selection(client, mock_db_inspector):
    """Test data extraction with empty variable selection"""
    request_data = {
        "datasetId": "_prod_clean_easperger",
        "selections": [
            {
                "questionnaireId": "questionnaire",
                "variables": []
            }
        ]
    }
    
    response = await client.post("/extract", json=request_data)
    assert response.status_code == 200
    # Should return a CSV with diagnostic information
    assert "text/csv" in response.headers["content-type"] 