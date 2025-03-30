from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database_parser import DatabaseInspector
from typing import List, Dict, Any
import logging
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import csv
import pandas as pd
from sqlalchemy import inspect

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Clinical Database API",
    description="API for accessing clinical database schemas and metadata",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database inspector
db_inspector = None

@app.on_event("startup")
async def startup_event():
    global db_inspector
    try:
        db_inspector = DatabaseInspector()
        db_inspector.connect()
        logger.info("Database connection established successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

@app.get("/schemas", response_model=List[str])
async def get_schemas():
    """Get all available database schemas."""
    try:
        schemas = db_inspector.get_schemas()
        return schemas
    except Exception as e:
        logger.error(f"Error fetching schemas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/schemas/{schema}/tables", response_model=Dict[str, Any])
async def get_schema_tables(schema: str):
    """Get all tables and their details for a specific schema."""
    try:
        analysis = db_inspector.analyze_database()
        if schema not in analysis['schemas']:
            raise HTTPException(status_code=404, detail=f"Schema '{schema}' not found")
        return analysis['schemas'][schema]
    except Exception as e:
        logger.error(f"Error fetching tables for schema {schema}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/schemas/{schema}/tables/{table}", response_model=Dict[str, Any])
async def get_table_details(schema: str, table: str):
    """Get detailed information about a specific table."""
    try:
        analysis = db_inspector.analyze_database()
        if schema not in analysis['schemas']:
            raise HTTPException(status_code=404, detail=f"Schema '{schema}' not found")
        
        full_table_name = f"{schema}.{table}"
        if full_table_name not in analysis['schemas'][schema]['tables']:
            raise HTTPException(status_code=404, detail=f"Table '{table}' not found in schema '{schema}'")
        
        return analysis['schemas'][schema]['tables'][full_table_name]
    except Exception as e:
        logger.error(f"Error fetching details for table {schema}.{table}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/summary", response_model=Dict[str, Any])
async def get_database_summary():
    """Get a summary of the database structure."""
    try:
        analysis = db_inspector.analyze_database()
        return analysis['summary']
    except Exception as e:
        logger.error(f"Error fetching database summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Models for data extraction
class VariableSelection(BaseModel):
    questionnaireId: str
    variables: List[str]

class ExtractionRequest(BaseModel):
    datasetId: str
    selections: List[VariableSelection]

@app.post("/extract")
async def extract_data(request: ExtractionRequest):
    """
    Extract selected data from the database based on selected variables.
    Returns a CSV file with the extracted data.
    """
    try:
        # Log the extraction request
        logger.info(f"Data extraction request for dataset {request.datasetId} received")
        logger.info(f"Extracting from {len(request.selections)} questionnaires")
        
        schema_name = request.datasetId
        
        # Prepare tables and columns for extraction
        tables_columns = {}
        total_variables = 0
        
        for selection in request.selections:
            logger.info(f"Processing selection: {selection.questionnaireId}")
            
            # Extract table name from questionnaireId (format: shortTableName_fullTableName)
            parts = selection.questionnaireId.split('_', 1)
            table_name = ""
            
            if len(parts) > 1:
                # Get the part after the first underscore
                full_name = parts[1]
                
                # Check if it already has a schema prefix
                if '.' in full_name:
                    # Use the full name as is - it already has schema.table format
                    table_name = full_name
                else:
                    # Add the schema name if it doesn't have one
                    table_name = f"{schema_name}.{full_name}"
            else:
                # No underscore, use the id as is with schema
                table_name = f"{schema_name}.{selection.questionnaireId}"
            
            # Debug log the table name being used
            logger.info(f"Using table name: {table_name}")
            
            tables_columns[table_name] = selection.variables
            total_variables += len(selection.variables)
        
        # Log the extraction details
        logger.info(f"Tables to extract from: {list(tables_columns.keys())}")
        logger.info(f"Total variables to extract: {total_variables}")
        
        # Connect to the database and extract data
        with db_inspector.engine.connect() as connection:
            # Build a dataframe to hold the results
            all_data = None
            extraction_stats = {
                "tables_processed": 0,
                "tables_skipped": 0,
                "rows_extracted": 0
            }
            
            # Extract data from each table
            for table_name, columns in tables_columns.items():
                if not columns:  # Skip if no columns selected
                    logger.warning(f"No columns selected for {table_name}, skipping")
                    extraction_stats["tables_skipped"] += 1
                    continue
                
                try:
                    # Try to get the table structure first to verify it exists
                    inspector = inspect(db_inspector.engine)
                    
                    # Extract schema and table from the full name
                    schema_part, table_part = table_name.split('.', 1) if '.' in table_name else (schema_name, table_name)
                    
                    # Check if the table exists in the schema
                    if table_part not in inspector.get_table_names(schema=schema_part):
                        logger.warning(f"Table {table_name} not found in database, skipping")
                        extraction_stats["tables_skipped"] += 1
                        continue
                    
                    # Get actual column names from the database to verify requested columns
                    available_columns = [col['name'] for col in inspector.get_columns(table_part, schema=schema_part)]
                    logger.info(f"Available columns in {table_name}: {available_columns}")
                    
                    # Filter out columns that don't exist in the table
                    valid_columns = [col for col in columns if col in available_columns]
                    invalid_columns = [col for col in columns if col not in available_columns]
                    
                    if invalid_columns:
                        logger.warning(f"Some requested columns don't exist in {table_name}: {invalid_columns}")
                    
                    if not valid_columns:
                        logger.warning(f"No valid columns for {table_name}, skipping")
                        extraction_stats["tables_skipped"] += 1
                        continue
                    
                    # Create column list for SQL query
                    column_list = ", ".join([f'"{c}"' for c in valid_columns])
                    
                    # Execute query
                    query = f'SELECT {column_list} FROM "{schema_part}"."{table_part}" LIMIT 1000'
                    logger.info(f"Executing query: {query}")
                    
                    # Load data into pandas DataFrame
                    table_data = pd.read_sql(query, connection)
                    
                    # Check if we got any data
                    if table_data.empty:
                        logger.warning(f"No data returned from {table_name}")
                        extraction_stats["tables_skipped"] += 1
                        continue
                    
                    logger.info(f"Extracted {len(table_data)} rows from {table_name}")
                    extraction_stats["rows_extracted"] += len(table_data)
                    extraction_stats["tables_processed"] += 1
                    
                    # If this is the first table with data, initialize the result DataFrame
                    if all_data is None:
                        all_data = table_data
                        logger.info(f"Initial dataset created with shape: {all_data.shape}")
                    else:
                        # For subsequent tables, we need a more careful merge strategy
                        # For simplicity, we'll do a cross join (cartesian product)
                        # In a real implementation, you would identify proper join keys
                        
                        # Add a temporary key for joining
                        all_data['_join_key'] = 1
                        table_data['_join_key'] = 1
                        
                        # Merge the datasets
                        pre_merge_shape = all_data.shape
                        all_data = pd.merge(all_data, table_data, on='_join_key')
                        post_merge_shape = all_data.shape
                        
                        # Remove the temporary join key
                        all_data.drop('_join_key', axis=1, inplace=True)
                        
                        logger.info(f"Merged dataset shape changed from {pre_merge_shape} to {post_merge_shape}")
                        
                except Exception as table_error:
                    logger.error(f"Error extracting data from table {table_name}: {table_error}")
                    extraction_stats["tables_skipped"] += 1
                    # Continue with other tables instead of failing completely
                    continue
            
            # Convert to CSV
            if all_data is None or all_data.empty:
                # Create a simple dataframe with diagnostic information if no data was found
                all_data = pd.DataFrame({
                    "message": ["No data found for the selected variables."],
                    "details": [f"Processed {extraction_stats['tables_processed']} tables, skipped {extraction_stats['tables_skipped']} tables"]
                })
                logger.warning("No data was found for the selected variables.")
            
            csv_data = io.StringIO()
            all_data.to_csv(csv_data, index=False)
            csv_data.seek(0)
            
            # Return CSV as a downloadable file
            response = StreamingResponse(
                iter([csv_data.getvalue()]), 
                media_type="text/csv"
            )
            response.headers["Content-Disposition"] = f"attachment; filename=extracted_data_{schema_name}.csv"
            
            # Log extraction statistics
            logger.info(f"Extraction stats: {extraction_stats}")
            
            return response
            
    except Exception as e:
        logger.error(f"Error extracting data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 