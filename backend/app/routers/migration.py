"""Module containing the /migration API router"""
import json
import logging
import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel
from supabase import Client
from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.middleware.auth import verify_admin_key
from backend.app.utils.datetime import convert_datestring_to_datetime_object
from backend.app.utils.migration import (
    get_datasets_json_file_data, get_all_questionnaires, get_questionnaires
)
from backend.app.database.connection import get_db

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/migration", tags=["migration"])

class DatasetDTO(BaseModel):
    """Type for the Dataset DTO (Data Transfer Object)"""
    id: Optional[int] = None
    dataset_id: str
    title: str
    description: str
    record_count: int
    last_updated: str

class QuestionnaireDTO(BaseModel):
    """Type for the Questionnaire DTO (Data Transfer Object)"""
    id: Optional[int] = None
    dataset_id: str
    nomFormulaire: str
    nomTable: str
    fields: str

class DatasetsMigration(BaseModel):
    """Type for the datasets migration"""
    input: List[DatasetDTO]
    output: Dict

class QuestionnairesMigration(BaseModel):
    """Type for the questionnaires migration"""
    input: Dict[str, List[QuestionnaireDTO]]
    output: Dict

class Migration(BaseModel):
    """Type for the migration"""
    datasets: Union[DatasetsMigration, None] = None
    questionnaires: Union[QuestionnairesMigration, None] = None

def migrate_datasets(db:Client) -> DatasetsMigration:
    """Migrates the datasets json file data to the database's 'datasets' table"""
    try:
        logger.info("Migrating datasets json file data to PostgreSQL database 'datasets' table...")

        datasets_migration = DatasetsMigration(input=[], output={})
        json_file_data = list(get_datasets_json_file_data())
        
        if len(json_file_data) > 0:

            rows_list: List[Dict[str, Any]] = []

            for dataset in json_file_data:

                dataset_dto = DatasetDTO(
                    dataset_id = dataset["id"],
                    title = dataset["title"],
                    description = dataset["description"],
                    record_count = int(dataset["record_count"]),
                    last_updated = convert_datestring_to_datetime_object(dataset["last_updated"]).replace(tzinfo=datetime.timezone.utc).isoformat()
                )
                datasets_migration.input.append(dataset_dto)
                rows_list.append(dataset_dto.model_dump(exclude="id"))

            logger.info("%s datasets to migrate. %s",
                len(datasets_migration.input),
                {[d.dataset_id for d in datasets_migration.input]}
            )
            
            response = db.table("datasets").insert(rows_list).execute()

            rows_inserted = len(response.data)
            logger.info("%s rows inserted in 'datasets' table", rows_inserted)
            
            datasets_migration.output = {
                "rows_inserted": rows_inserted,
                "success": True,
                "timestamp": datetime.datetime.now().isoformat()
            }

        return datasets_migration
    
    except Exception as e:
        raise e


def migrate_questionnaires(db:Client) -> QuestionnairesMigration:
    """Migrates the questionnaires json files data to the database's 'questionnaires' table"""
    try:
        logger.info("Migrating questionnaires json files data to PostgreSQL database 'questionnaires' table...")

        questionnaires_migration = QuestionnairesMigration(input={}, output={})
        json_file_data = get_all_questionnaires()
        datasets_ids = json_file_data.keys()

        if len(json_file_data.keys()) > 0:
            
            rows_list: List[Dict[str, Any]] = []

            for dataset_id in datasets_ids:
                questionnaires_migration.input[dataset_id] = []
                dataset_questionnaires = get_questionnaires(dataset_id)
                for q in dataset_questionnaires:
                    questionnaire_dto = QuestionnaireDTO(
                        dataset_id = dataset_id,
                        nomFormulaire = q["form"]["nomFormulaire"],
                        nomTable = q["form"]["nomTable"],
                        fields = json.dumps(q["fields"])
                    )
                    questionnaires_migration.input[dataset_id].append(questionnaire_dto)
                    rows_list.append(questionnaire_dto.model_dump(exclude="id"))
            
            logger.info("%s questionnaires to migrate, on %s distinct datasets.",
                len(rows_list),
                len(datasets_ids)
            )
            
            response = db.table("questionnaires").insert(rows_list).execute()
            rows_inserted = len(response.data)

            logger.info("%s rows inserted in 'questionnaires' table", rows_inserted)

            questionnaires_migration.output = {
                "rows_inserted": rows_inserted,
                "success": True,
                "timestamp": datetime.datetime.now().timestamp()
            }
                    
        return questionnaires_migration
    
    except Exception as e:
        raise e


@router.get('/', dependencies=[Depends(verify_admin_key)])
def migrate_if_necessary(db: Client = Depends(get_db)):
# def migrate_if_necessary(api_key: str = Depends(verify_admin_key), db: Client = Depends(get_db)):
    """Lance la migration si nécessaire"""
    try:
        datasets = db.table("datasets").select("*", count="exact").execute()
        questionnaires = db.table("questionnaires").select("*", count="exact").execute()

        if datasets.count > 0 and questionnaires.count > 0: 
            return {"message": "Migration is not required"}
        
        migration = Migration(datasets=None, questionnaires=None)
        if datasets.count == 0:
            migration.datasets = migrate_datasets(db)
        if questionnaires.count == 0:
            migration.questionnaires = migrate_questionnaires(db)

        return {
            "migration": {
                "output": {
                    "datasets": migration.datasets.output if migration.datasets else None,
                    "questionnaires": migration.questionnaires.output if migration.questionnaires else None
                }
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error while getting PostgreSQL database data: {str(e)}"
        ) from e

@router.get('/clear', dependencies=[Depends(verify_admin_key)])
def clear_tables(db: Client = Depends(get_db)):
    """Nettoie les tables en cas d'erreur durant le développement"""
    try:
        datasets_response = db.table("datasets").delete().neq("id", 0).execute()
        questionnaires_response = db.table("questionnaires").delete().neq("id", 0).execute()
        return {
            "cleared": {
                "datasets": {
                    "count": datasets_response.count
                },
                "questionnaires": {
                    "count": questionnaires_response.count
                }
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error while clearing tables in PostgreSQL database : {str(e)}"
        ) from e
