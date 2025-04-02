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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize database inspector
db_inspector = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application"""
    global db_inspector
    try:
        db_inspector = DatabaseInspector()
        db_inspector.connect()
        logger.info("Database connection established successfully")
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
    return {
        "message": "Clinical Study Data API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 