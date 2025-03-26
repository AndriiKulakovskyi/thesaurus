"""Module containing the root API router"""
import json
import logging
from typing import List, Dict, Any
from pathlib import Path

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from supabase import Client

from backend.app.utils.datetime import convert_timestamptz
from backend.app.database.connection import get_db

logger = logging.getLogger('uvicorn')

router = APIRouter(prefix="/api", tags=["api", "v1"])

# Path configurations
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASES_FILE = DATA_DIR / "databases.json"
QUESTIONNAIRES_DIR = DATA_DIR / "questionnaires"

# Ensure directories exist
QUESTIONNAIRES_DIR.mkdir(parents=True, exist_ok=True)

# Data models
class VariableSelection(BaseModel):
    """Type for variable selections"""
    questionnaireId: str
    variables: List[str]

class ExtractionRequest(BaseModel):
    """Type for an extraction request"""
    datasetId: str
    selections: List[VariableSelection]

# Helper functions
def load_json_file(file_path: Path) -> Any:
    """Load and parse a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading file {file_path}: {str(e)}"
        ) from e

def get_datasets(db: Client) -> List[Dict[str, Any]]:
    """Returns all datasets from the 'datasets' table in the PostgreSQL database."""
    try:
        response= db.table("datasets").select("*").execute()
        return response.data
    except Exception as e:
        logger.error("Datasets data not found: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Datasets data not found: {str(e)}"
        ) from e

def get_dataset(dataset_id: str, db: Client) -> Dict[str, Any]:
    """Returns a specific dataset from the 'datasets' table in the PostgreSQL database."""
    datasets = get_datasets(db)
    for ds in datasets:
        if ds.get("dataset_id") == dataset_id:
            return ds
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Database with ID {dataset_id} not found"
    )

def get_questionnaires(dataset_id: str, db: Client = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Load all questionnaires for a specific dataset, 
    from the 'questionnaires' table in the PostgreSQL database.
    """
    try:
        response = db.table("questionnaires").select("*").eq("dataset_id", dataset_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error while retrieving dictionnaires for {dataset_id} dataset: {str(e)}"
        ) from e

# API endpoints
@router.get("/databases", response_model=List[Dict[str, Any]])
async def read_databases(db: Client = Depends(get_db)):
    """Get all available databases."""
    data = get_datasets(db)
    for record in data:
        if record["dataset_id"]:
            record["id"] = record["dataset_id"]
            del record["dataset_id"]
        if record["last_updated"]:
            if isinstance(record["last_updated"], str):
                record["last_updated"] = convert_timestamptz(record["last_updated"], "YYYY-MM-DD")
    return data

@router.get("/databases/{dataset_id}", response_model=Dict[str, Any])
async def read_database(dataset_id: str, db: Client = Depends(get_db)):
    """Get a specific database by ID."""
    data = get_dataset(dataset_id, db)
    data["id"] = data["dataset_id"]
    del data["dataset_id"]
    return data

@router.get("/databases/{dataset_id}/questionnaires", response_model=List[Dict[str, Any]])
async def read_questionnaires(dataset_id: str, db: Client = Depends(get_db)):
    """Get all questionnaires for a specific dataset."""
    data = get_questionnaires(dataset_id, db)
    for q in data:
        q["form"] = dict()
        q["form"]["nomTable"] = q["nomTable"]
        q["form"]["nomFormulaire"] = q["nomFormulaire"]
        q["id"] = q["dataset_id"]
        q["fields"] = json.loads(q["fields"])
        del q["nomTable"]
        del q["nomFormulaire"]
        del q["dataset_id"]
    return data

@router.post("/extract", response_model=Dict[str, Any])
async def extract_data(request: ExtractionRequest, db: Client = Depends(get_db)):
    """Process a data extraction request."""
    try:
        logger.info("Proceeding to a data extraction request: %s", str(request.model_dump()))
        # Validate that the database exists
        database = get_dataset(request.datasetId, db)

        # Validate that all questionnaires exist
        all_questionnaires = get_questionnaires(request.datasetId, db)
        for q in all_questionnaires:
            q["form"] = {}
            q["form"]["nomTable"] = q["nomTable"]
            q["form"]["nomFormulaire"] = q["nomFormulaire"]
            q["id"] = q["dataset_id"]
            q["fields"] = json.loads(q["fields"])
            del q["nomTable"]
            del q["nomFormulaire"]
            del q["dataset_id"]
        
        questionnaire_tables = ["{}_{}".format(
            q["form"]["nomFormulaire"],
            q["form"]["nomTable"])
            for q in all_questionnaires
        ]

        for selection in request.selections:
            if selection.questionnaireId not in questionnaire_tables:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Questionnaire {selection.questionnaireId} not found in database {request.datasetId}"
                )

        #* In a real application, this would trigger a data extraction process
        #* For now, we just acknowledge the request
        return {
            "status": "success",
            "message": "Extraction request processed successfully",
            "request": request.model_dump(),
            "dataset": database["title"],
            "selections_count": len(request.selections),
            "total_variables": sum(len(selection.variables) for selection in request.selections)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing extraction request: {str(e)}"
        ) from e


@router.get("/health")
async def health_check(db: Client = Depends(get_db)):
    """Checks the API's database connection's health"""
    try:
        response= db.table("datasets").select("*", count="exact").execute()
        return {
            "status": "healthy",
            "database_connection": "ok",
            "details": {
                "datasets_count": response.count
            }
        }
    except Exception as e:
        logger.error("Health check failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération d'un fruit: {str(e)}"
        ) from e
