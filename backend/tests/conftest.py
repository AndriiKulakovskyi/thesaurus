import pytest
import os
from dotenv import load_dotenv
from backend.models.database import DatabaseManager

# Load environment variables
load_dotenv()

@pytest.fixture(scope="session")
def database_url():
    """Get database URL from environment"""
    url = os.getenv('DATABASE_URL')
    if not url:
        pytest.skip("DATABASE_URL not set")
    return url

@pytest.fixture(scope="session")
def db_manager(database_url):
    """Create a database manager instance"""
    return DatabaseManager(database_url)

@pytest.fixture(scope="session")
def test_schema():
    """Test schema name"""
    return "_prod_clean_easperger"

@pytest.fixture(scope="session")
def test_table():
    """Test table name"""
    return "questionnaire"

@pytest.fixture(scope="session")
def test_columns():
    """Test column names"""
    return ["patient_id", "question_1", "question_2"] 