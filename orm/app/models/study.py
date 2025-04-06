from sqlalchemy import Column, String, Integer, DateTime, Float, JSON, MetaData, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import relationship
from typing import Dict, Any, List, Optional

from app.core.database import Base, engine

def create_dynamic_model(table_name: str, schema: str = "public"):
    """
    Dynamically create an SQLAlchemy model for a database table.
    This function uses reflection to create models from existing database tables.
    """
    metadata = MetaData(schema=schema)
    metadata.reflect(engine, only=[table_name])
    
    if table_name in metadata.tables:
        DynamicBase = automap_base(metadata=metadata)
        DynamicBase.prepare()
        return DynamicBase.classes.get(table_name)
    return None

class Study(Base):
    """
    SQLAlchemy model for storing study metadata.
    This model is not reflected from the database but created to track
    study information for the API.
    """
    __tablename__ = "studies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    schema = Column(String, default="public")
    description = Column(String)
    study_metadata = Column(JSON) 