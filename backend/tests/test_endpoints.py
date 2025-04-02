import pytest
import pytest_asyncio
from httpx import AsyncClient
from unittest.mock import Mock, patch
import pandas as pd
import io
from backend.main import app, DatabaseInspector

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_db_inspector():
    with patch('backend.main.DatabaseInspector') as mock:
        inspector = Mock()
        inspector.get_schemas.return_value = ["_prod_clean_easperger", "_prod_clean_ebipolar"]
        inspector.get_schema_metadata.return_value = {
            "_prod_clean_easperger": {
                "study_type": "Longitudinal Cohort Study",
                "participants": 500,
                "duration": "2 years"
            },
            "_prod_clean_ebipolar": {
                "study_type": "Cross-sectional Study",
                "participants": 300,
                "duration": "6 months"
            }
        }
        inspector.get_schema_tables.return_value = {
            "tables": [
                "_prod_clean_easperger.questionnaire",
                "_prod_clean_easperger.scores"
            ]
        }
        inspector.get_table_details.return_value = {
            "name": "questionnaire",
            "columns": [
                {"name": "id", "type": "INTEGER"},
                {"name": "patient_id", "type": "INTEGER"},
                {"name": "question", "type": "TEXT"},
                {"name": "answer", "type": "TEXT"}
            ],
            "primary_keys": ["id"],
            "foreign_keys": [
                {
                    "column": "patient_id",
                    "references": {
                        "table": "patients",
                        "column": "id"
                    }
                }
            ]
        }
        mock.return_value = inspector
        yield inspector

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