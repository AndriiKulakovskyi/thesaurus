from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database_parser import DatabaseInspector
from typing import List, Dict, Any
import logging

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 