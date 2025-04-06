from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.core.yaml_loader import get_study_by_name, get_table_by_name
from app.schemas.study import Table

router = APIRouter()

@router.get("/{study_name}", response_model=List[Table])
async def get_tables(study_name: str, db: Session = Depends(get_db)):
    """
    Get all tables for a specific study.
    """
    study = get_study_by_name(study_name)
    if study is None:
        raise HTTPException(status_code=404, detail=f"Study {study_name} not found")
    
    return study.get("tables", [])

@router.get("/{study_name}/{table_name}", response_model=Table)
async def get_table(study_name: str, table_name: str, db: Session = Depends(get_db)):
    """
    Get details about a specific table in a study.
    """
    table = get_table_by_name(study_name, table_name)
    if table is None:
        raise HTTPException(status_code=404, detail=f"Table {table_name} not found in study {study_name}")
    
    return table 