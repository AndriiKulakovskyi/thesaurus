from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.yaml_loader import get_all_studies, get_study_by_name
from app.schemas.study import Study, StudyList

router = APIRouter()

@router.get("/", response_model=List[Study])
async def get_studies(db: Session = Depends(get_db)):
    """
    Get all available studies from the thesaurus.
    """
    studies = get_all_studies()
    return studies

@router.get("/{study_name}", response_model=Study)
async def get_study(study_name: str, db: Session = Depends(get_db)):
    """
    Get details about a specific study by name.
    """
    study = get_study_by_name(study_name)
    if study is None:
        raise HTTPException(status_code=404, detail=f"Study {study_name} not found")
    return study 