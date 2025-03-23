# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
from pathlib import Path

app = FastAPI(title="Clinical Data Extraction API",
              description="API for psychiatric research data extraction",
              version="1.0.0")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path configurations
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATABASES_FILE = DATA_DIR / "databases.json"
QUESTIONNAIRES_DIR = DATA_DIR / "questionnaires"

# Ensure directories exist
QUESTIONNAIRES_DIR.mkdir(parents=True, exist_ok=True)

# Data models
class VariableSelection(BaseModel):
    questionnaireId: str
    variables: List[str]

class ExtractionRequest(BaseModel):
    datasetId: str
    selections: List[VariableSelection]

# Helper functions
def load_json_file(file_path: Path) -> Any:
    """Load and parse a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        raise HTTPException(status_code=500, detail=f"Error loading file {file_path}: {str(e)}")

def get_databases() -> List[Dict[str, Any]]:
    """Load all databases from the databases.json file."""
    return load_json_file(DATABASES_FILE)

def get_database(dataset_id: str) -> Dict[str, Any]:
    """Get a specific database by ID."""
    databases = get_databases()
    for db in databases:
        if db.get("id") == dataset_id:
            return db
    raise HTTPException(status_code=404, detail=f"Database with ID {dataset_id} not found")

def get_questionnaires(dataset_id: str) -> List[Dict[str, Any]]:
    """Load all questionnaires for a specific dataset."""
    database = get_database(dataset_id)
    questionnaires_folder = database.get("questionnaires_folder", "")
    questionnaires_models = database.get("questionnaires_models", [])
    
    # Convert to Path object and ensure it's within the allowed directory
    questionnaire_dir = QUESTIONNAIRES_DIR / Path(questionnaires_folder).relative_to("data/questionnaires")
    
    if not questionnaire_dir.exists():
        raise HTTPException(status_code=404, detail=f"Questionnaire directory for dataset {dataset_id} not found")
    
    questionnaires = []
    for model_file in questionnaires_models:
        model_path = questionnaire_dir / model_file
        if model_path.exists():
            questionnaires.extend(load_json_file(model_path))
    
    return questionnaires

# API endpoints
@app.get("/api/databases", response_model=List[Dict[str, Any]])
async def read_databases():
    """Get all available databases."""
    return get_databases()

@app.get("/api/databases/{dataset_id}", response_model=Dict[str, Any])
async def read_database(dataset_id: str):
    """Get a specific database by ID."""
    return get_database(dataset_id)

@app.get("/api/databases/{dataset_id}/questionnaires", response_model=List[Dict[str, Any]])
async def read_questionnaires(dataset_id: str):
    """Get all questionnaires for a specific dataset."""
    return get_questionnaires(dataset_id)

@app.post("/api/extract", response_model=Dict[str, Any])
async def extract_data(request: ExtractionRequest):
    """Process a data extraction request."""
    try:
        # Validate that the database exists
        database = get_database(request.datasetId)
        
        # Validate that all questionnaires exist
        all_questionnaires = get_questionnaires(request.datasetId)
        questionnaire_tables = {q["form"]["nomTable"] for q in all_questionnaires}
        
        for selection in request.selections:
            if selection.questionnaireId not in questionnaire_tables:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Questionnaire {selection.questionnaireId} not found in database {request.datasetId}"
                )
        
        # In a real application, this would trigger a data extraction process
        # For now, we just acknowledge the request
        return {
            "status": "success",
            "message": "Extraction request processed successfully",
            "request": request.dict(),
            "dataset": database["title"],
            "selections_count": len(request.selections),
            "total_variables": sum(len(selection.variables) for selection in request.selections)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing extraction request: {str(e)}")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
