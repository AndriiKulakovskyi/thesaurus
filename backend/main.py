from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.database_parser import DatabaseInspector
from typing import List, Dict, Any
import logging
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import csv
import pandas as pd
from sqlalchemy import inspect
from dotenv import load_dotenv
import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.api.endpoints import router as api_router
from backend.models.database import DatabaseManager
from backend.models.synthetic_db import SyntheticDatabaseManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
env_path = Path(__file__).parent / '.env'
env_exists = env_path.exists()
if env_exists:
    load_dotenv(dotenv_path=env_path)
    logger.info("Loaded environment variables from .env file")
else:
    logger.warning(".env file not found, using default environment variables")

# Determine if we should use synthetic database
use_synthetic_db = True  # Default to true if no .env file
if env_exists:
    use_synthetic_db_str = os.getenv('USE_SYNTHETIC_DB', 'false').lower()
    use_synthetic_db = use_synthetic_db_str in ['true', '1', 'yes']

# Initialize database inspector
db_inspector = None
db_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application"""
    global db_inspector, db_manager
    try:
        if use_synthetic_db:
            logger.info("Using synthetic database for development")
            db_manager = SyntheticDatabaseManager()
            app.state.db_manager = db_manager
        else:
            logger.info("Connecting to real database")
            connection_string = os.getenv('DATABASE_URL')
            if not connection_string:
                logger.error("DATABASE_URL environment variable is not set")
                raise ValueError("DATABASE_URL environment variable is not set")
                
            db_inspector = DatabaseInspector()
            db_inspector.connect()
            logger.info("Database connection established successfully")
            
            db_manager = DatabaseManager(connection_string)
            app.state.db_manager = db_manager
            
        yield
    finally:
        # Add cleanup code here if needed
        pass

app = FastAPI(
    title="Clinical Study Data API",
    description="API for accessing clinical study data across multiple databases",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

@app.get("/")
async def root():
    """Root endpoint"""
    db_type = "Synthetic (Development)" if use_synthetic_db else "Real (Production)"
    return {
        "message": "Clinical Study Data API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "database_type": db_type
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 