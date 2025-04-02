from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.models.database import DatabaseManager
import os

router = APIRouter(prefix="/api/v1")

# Initialize database manager
db_manager = DatabaseManager(os.getenv('DATABASE_URL', ''))

class StudyMetadata(BaseModel):
    """Study metadata response model"""
    study_type: str
    year_started: int
    principal_investigator: str
    patient_count: int

class StudyInfo(BaseModel):
    """Study information response model"""
    schema: str
    name: str
    description: str
    metadata: StudyMetadata

class TableInfo(BaseModel):
    """Table information response model"""
    name: str
    description: str
    columns: List[str]

class DataRequest(BaseModel):
    """Data request model for extracting variables from tables"""
    schema_name: str
    table_selections: Dict[str, List[str]]
    filters: Optional[Dict[str, Any]] = None

class DataResponse(BaseModel):
    """Data response model"""
    schema_name: str
    data: Dict[str, List[Dict[str, Any]]]
    row_counts: Dict[str, int]

@router.get("/studies", response_model=List[StudyInfo])
async def get_studies():
    """Get list of available studies"""
    try:
        studies = []
        for schema, study_info in db_manager.study_info.items():
            studies.append(StudyInfo(
                schema=schema,
                name=study_info.name,
                description=study_info.description,
                metadata=StudyMetadata(**study_info.metadata.model_dump())
            ))
        return studies
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/studies/{schema_name}/tables", response_model=List[TableInfo])
async def get_study_tables(schema_name: str):
    """Get list of tables (questionnaires) for a specific study"""
    try:
        models = db_manager.get_schema_models(schema_name)
        tables = []
        
        for table_name in models:
            schema, name = table_name.split('.')
            if schema == schema_name:
                model = models[table_name]
                tables.append(TableInfo(
                    name=name,
                    description=model.__doc__ or "",
                    columns=list(model.model_fields.keys())
                ))
        return tables
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/studies/{schema_name}/tables/{table_name}/columns")
async def get_table_columns(schema_name: str, table_name: str):
    """Get available columns for a specific table"""
    try:
        columns = db_manager.get_table_columns(schema_name, table_name)
        if not columns:
            raise HTTPException(
                status_code=404,
                detail=f"Table '{table_name}' not found in schema '{schema_name}'"
            )
        return {"columns": columns}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/data", response_model=DataResponse)
async def extract_data(request: DataRequest):
    """Extract data from multiple tables in a study"""
    try:
        # Validate schema exists
        if not db_manager.get_study_info(request.schema_name):
            raise HTTPException(
                status_code=404,
                detail=f"Study schema '{request.schema_name}' not found"
            )
        
        # Extract data from each table
        result_data = {}
        row_counts = {}
        
        for table_name, columns in request.table_selections.items():
            # Validate columns exist in table
            available_columns = db_manager.get_table_columns(
                request.schema_name, 
                table_name
            )
            invalid_columns = set(columns) - set(available_columns)
            if invalid_columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid columns for table '{table_name}': {invalid_columns}"
                )
            
            # Extract data
            table_data = db_manager.extract_data(
                request.schema_name,
                table_name,
                columns,
                request.filters
            )
            
            result_data[table_name] = table_data
            row_counts[table_name] = len(table_data)
        
        return DataResponse(
            schema_name=request.schema_name,
            data=result_data,
            row_counts=row_counts
        )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 