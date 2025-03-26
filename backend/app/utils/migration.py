"""Module containing the migration utils functions"""
import json
from pathlib import Path
from typing import Any, Dict, List

from fastapi import HTTPException, status

# Path configurations
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASES_FILE = DATA_DIR / "databases.json"
QUESTIONNAIRES_DIR = DATA_DIR / "questionnaires"

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


def get_datasets_json_file_data():
    """Extracts databases data from databases.json file"""
    return load_json_file(DATABASES_FILE)

def get_database(dataset_id: str) -> Dict[str, Any]:
    """Get a specific database by ID."""
    databases = get_datasets_json_file_data()
    for db in databases:
        if db.get("id") == dataset_id:
            return db
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Database with ID {dataset_id} not found"
    )

def get_all_questionnaires() -> Dict[str, List[Dict[str, Any]]]:
    """Load all questionnaires"""
    questionnaires = dict()
    datasets_ids = [dataset["id"] for dataset in get_datasets_json_file_data()]
    
    for dataset_id in datasets_ids:
        questionnaires[dataset_id] = get_questionnaires(dataset_id)
    
    return questionnaires

def get_questionnaires(dataset_id: str) -> List[Dict[str, Any]]:
    """Load all questionnaires for a specific dataset."""
    database = get_database(dataset_id)
    questionnaires_folder = database.get("questionnaires_folder", "")
    questionnaires_models = database.get("questionnaires_models", [])
    
    # Convert to Path object and ensure it's within the allowed directory
    questionnaire_dir = QUESTIONNAIRES_DIR / Path(questionnaires_folder).relative_to("data/questionnaires")
    
    if not questionnaire_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Questionnaire directory for dataset {dataset_id} not found"
        )
    
    questionnaires = []
    for model_file in questionnaires_models:
        model_path = questionnaire_dir / model_file
        if model_path.exists():
            questionnaires.extend(load_json_file(model_path))
    
    return questionnaires
