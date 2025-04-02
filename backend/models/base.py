from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class BaseORMModel(BaseModel):
    """Base model for all database models with common configuration"""
    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM mode
        validate_assignment=True,  # Validate during assignment
        extra='ignore',  # Ignore extra fields
        arbitrary_types_allowed=True  # Allow arbitrary types
    )

class MetadataModel(BaseModel):
    """Common metadata model for all studies"""
    study_type: str
    year_started: int
    principal_investigator: str
    patient_count: int

class StudyInfoModel(BaseModel):
    """Base model for study information"""
    name: str
    description: str
    metadata: MetadataModel
    
class DatabaseConfig(BaseModel):
    """Configuration model for database connection"""
    schema_name: str
    connection_string: str
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()

class ColumnInfo(BaseModel):
    """Model for column information"""
    name: str
    type: str
    nullable: bool
    primary_key: bool
    default: Optional[str] = None
    description: Optional[str] = None

class TableInfo(BaseModel):
    """Model for table information"""
    name: str
    schema: str
    columns: List[ColumnInfo]
    primary_keys: List[str]
    foreign_keys: List[Dict[str, str]]
    description: Optional[str] = None 