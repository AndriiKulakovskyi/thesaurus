from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.models.database import DatabaseManager
import os
import logging
import io
import pandas as pd
from fastapi.responses import StreamingResponse
from sqlalchemy import inspect

router = APIRouter(prefix="/api/v1")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Function to get the database manager from the app state
def get_db_manager(request: Request):
    return request.app.state.db_manager

# Initialize database manager
# This is now handled in main.py and injected via dependency
# db_manager = DatabaseManager(os.getenv('DATABASE_URL', ''))

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

class VariableSelection(BaseModel):
    """Model for variable selection from a questionnaire/table"""
    questionnaireId: str
    variables: List[str]

class ExtractionRequest(BaseModel):
    """Model for data extraction request matching frontend format"""
    datasetId: str
    selections: List[VariableSelection]
    limit: Optional[int] = 1000
    format: Optional[str] = "csv"  # Support for different formats (csv, json)
    include_metadata: Optional[bool] = False

@router.get("/studies", response_model=List[StudyInfo])
async def get_studies(db_manager = Depends(get_db_manager)):
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
async def get_study_tables(schema_name: str, db_manager = Depends(get_db_manager)):
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
async def get_table_columns(schema_name: str, table_name: str, db_manager = Depends(get_db_manager)):
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
async def extract_data(request: DataRequest, db_manager = Depends(get_db_manager)):
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

@router.post("/extract")
async def extract_data_v1(request: ExtractionRequest, db_manager = Depends(get_db_manager)):
    """
    Enhanced data extraction endpoint that supports the frontend format.
    Returns data in CSV format by default, with option for JSON.
    """
    try:
        # Log extraction request details
        logger.info(f"Data extraction request for dataset {request.datasetId} received")
        logger.info(f"Extracting from {len(request.selections)} questionnaires")
        
        schema_name = request.datasetId
        row_limit = min(request.limit or 1000, 10000)  # Set a maximum limit of 10,000 rows
        
        # Prepare tables and columns mapping
        tables_columns = {}
        total_variables = 0
        
        for selection in request.selections:
            # Get the questionnaire ID without any parsing
            questionnaire_id = selection.questionnaireId
            logger.info(f"Processing questionnaire: {questionnaire_id}")
            
            # Simply use the original questionnaire ID as the table name
            # Just add the schema prefix if needed
            if '.' not in questionnaire_id:
                table_name = f"{schema_name}.{questionnaire_id}"
            else:
                table_name = questionnaire_id
                
            logger.info(f"Using full table name: {table_name}")
            
            tables_columns[table_name] = selection.variables
            total_variables += len(selection.variables)
            
            logger.info(f"Will extract {len(selection.variables)} variables from {table_name}")
        
        # Connect to database and extract data
        # Get engine from db_manager
        engine = getattr(db_manager, 'engine', None)
        inspector = inspect(engine) if engine else None
        
        # Initialize extraction statistics
        extraction_stats = {
            "tables_processed": 0,
            "tables_skipped": 0,
            "rows_extracted": 0
        }
        
        all_data = None
        
        # Get available schemas for debugging
        schema_list = inspector.get_schema_names() if inspector else []
        logger.info(f"Available schemas in database: {schema_list}")
        
        # Process each table and extract data
        for table_name, columns in tables_columns.items():
            if not columns:
                logger.warning(f"No columns selected for {table_name}, skipping")
                extraction_stats["tables_skipped"] += 1
                continue
            
            try:
                # Parse schema and table parts
                schema_part, table_part = table_name.split('.', 1) if '.' in table_name else (schema_name, table_name)
                
                logger.info(f"Parsed schema: '{schema_part}', table: '{table_part}'")
                
                # Try some variations if the schema doesn't exist
                if schema_part not in schema_list:
                    # Try without the leading underscore if it has one
                    if schema_part.startswith('_') and schema_part[1:] in schema_list:
                        logger.info(f"Trying schema without leading underscore: {schema_part[1:]}")
                        schema_part = schema_part[1:]
                    else:
                        logger.warning(f"Schema '{schema_part}' not found in database. Available schemas: {schema_list}")
                
                # Get list of tables in the schema for debugging
                try:
                    schema_tables = inspector.get_table_names(schema=schema_part)
                    logger.info(f"Available tables in schema {schema_part}: {schema_tables}")
                except Exception as e:
                    logger.error(f"Error getting tables for schema {schema_part}: {e}")
                    schema_tables = []
                
                # Verify table exists in schema with flexible matching
                table_found = False
                actual_table_name = table_part
                
                # First, try exact match
                if table_part in schema_tables:
                    table_found = True
                else:
                    # Try to find a close match if exact match fails
                    logger.info(f"Exact table match not found, trying alternate approaches")
                    
                    # Try case insensitive match
                    for schema_table in schema_tables:
                        if schema_table.lower() == table_part.lower():
                            actual_table_name = schema_table
                            table_found = True
                            logger.info(f"Found case-insensitive match: {schema_table}")
                            break
                    
                    # If still not found, try with/without schema prefix in table name
                    if not table_found and schema_part in table_part:
                        # Table name might already include schema
                        clean_table = table_part.replace(f"{schema_part}_", "")
                        if clean_table in schema_tables:
                            actual_table_name = clean_table
                            table_found = True
                            logger.info(f"Found match after removing schema prefix: {clean_table}")
                    
                    # If still not found, try looking for table with schema as prefix
                    if not table_found:
                        for schema_table in schema_tables:
                            if schema_table.startswith(f"{schema_part}_") or schema_table.endswith(f"_{table_part}"):
                                actual_table_name = schema_table
                                table_found = True
                                logger.info(f"Found partial match with schema prefix/suffix: {schema_table}")
                                break
                
                if not table_found:
                    logger.warning(f"Table '{table_part}' not found in schema '{schema_part}', skipping")
                    logger.warning(f"Available tables: {schema_tables}")
                    extraction_stats["tables_skipped"] += 1
                    continue
                else:
                    logger.info(f"Using table name: {actual_table_name}")
                
                # Get available columns from the database
                try:
                    available_columns = [col['name'] for col in inspector.get_columns(actual_table_name, schema=schema_part)]
                    logger.info(f"Available columns in {schema_part}.{actual_table_name}: {available_columns}")
                except Exception as e:
                    logger.error(f"Error getting columns for {schema_part}.{actual_table_name}: {e}")
                    extraction_stats["tables_skipped"] += 1
                    continue
                
                # Filter out invalid columns
                valid_columns = [col for col in columns if col in available_columns]
                invalid_columns = [col for col in columns if col not in available_columns]
                
                if invalid_columns:
                    logger.warning(f"Skipping invalid columns for {schema_part}.{actual_table_name}: {invalid_columns}")
                
                if not valid_columns:
                    logger.warning(f"No valid columns for {schema_part}.{actual_table_name}, skipping")
                    extraction_stats["tables_skipped"] += 1
                    continue
                
                # Build and execute SQL query
                column_list = ", ".join([f'"{c}"' for c in valid_columns])
                query = f'SELECT {column_list} FROM "{schema_part}"."{actual_table_name}" LIMIT {row_limit}'
                
                logger.info(f"Executing query: {query}")
                
                # Extract data into DataFrame
                with engine.connect() as connection:
                    table_data = pd.read_sql(query, connection)
                
                if table_data.empty:
                    logger.warning(f"No data returned from {schema_part}.{actual_table_name}")
                    extraction_stats["tables_skipped"] += 1
                    continue
                
                # Track statistics
                logger.info(f"Extracted {len(table_data)} rows from {schema_part}.{actual_table_name}")
                extraction_stats["rows_extracted"] += len(table_data)
                extraction_stats["tables_processed"] += 1
                
                # Add table name as prefix to columns to avoid collisions
                renamed_columns = {col: f"{actual_table_name}_{col}" for col in table_data.columns}
                table_data = table_data.rename(columns=renamed_columns)
                
                # Process the data
                if all_data is None:
                    all_data = table_data
                else:
                    # For simplicity, use cross join
                    # In a production environment, you might want to implement a smarter join strategy
                    # based on common keys or user-provided join instructions
                    all_data['_temp_join_key'] = 1
                    table_data['_temp_join_key'] = 1
                    
                    pre_shape = all_data.shape
                    all_data = pd.merge(all_data, table_data, on='_temp_join_key')
                    all_data = all_data.drop('_temp_join_key', axis=1)
                    
                    logger.info(f"Merged data: shape changed from {pre_shape} to {all_data.shape}")
                
            except Exception as e:
                logger.error(f"Error processing table {table_name}: {e}")
                extraction_stats["tables_skipped"] += 1
                continue
        
        # Handle case where no data was extracted
        if all_data is None or all_data.empty:
            all_data = pd.DataFrame({
                "message": ["No data found for the selected variables."],
                "details": [f"Processed {extraction_stats['tables_processed']} tables, skipped {extraction_stats['tables_skipped']} tables"]
            })
            logger.warning("No data was found for the selected variables.")
        
        # Return data in requested format
        if request.format == "json":
            # Return JSON response
            return {
                "status": "success",
                "schema": schema_name,
                "data": all_data.to_dict(orient='records'),
                "row_count": len(all_data),
                "column_count": len(all_data.columns),
                "stats": extraction_stats
            }
        else:
            # Return CSV as default
            csv_data = io.StringIO()
            all_data.to_csv(csv_data, index=False)
            csv_data.seek(0)
            
            # Create a streaming response with the CSV data
            response = StreamingResponse(
                iter([csv_data.getvalue()]),
                media_type="text/csv"
            )
            response.headers["Content-Disposition"] = f"attachment; filename=extract_{schema_name}_{extraction_stats['tables_processed']}tables.csv"
            
            logger.info(f"Returning CSV with {len(all_data)} rows and {len(all_data.columns)} columns")
            return response
        
    except Exception as e:
        logger.error(f"Error during extraction: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 