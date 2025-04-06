from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union


class StudyMetadata(BaseModel):
    study_type: Optional[str] = None
    year_started: Optional[int] = None
    principal_investigator: Optional[str] = None
    patient_count: Optional[int] = None


class Variable(BaseModel):
    name: str
    data_type: str
    description: Optional[str] = None


class Table(BaseModel):
    name: str
    description: Optional[str] = None
    variables: List[Variable] = []


class Study(BaseModel):
    schema: str
    name: str
    description: Optional[str] = None
    study_metadata: StudyMetadata
    tables: Optional[List[Table]] = None


class StudyList(BaseModel):
    studies: List[Study]


class TableVariables(BaseModel):
    """Defines variables to extract from a specific table"""
    table_name: str
    variable_names: List[str]
    filters: Optional[Dict[str, Any]] = None


class DataQuery(BaseModel):
    """
    Query for extracting data from one or more tables
    
    You can use either the simple format (table_names + variable_names)
    or the more specific format (tables_with_variables) for complex queries.
    """
    study_name: str
    
    # Simple format (all variables apply to all tables)
    table_names: Optional[List[str]] = None
    variable_names: Optional[List[str]] = None
    filters: Optional[Dict[str, Any]] = None
    
    # Advanced format (table-specific variables and filters)
    tables_with_variables: Optional[List[TableVariables]] = None
    
    # Common parameters
    limit: Optional[int] = 1000


class DataRecord(BaseModel):
    """A single record of data with source table information"""
    table_name: str
    data: Dict[str, Any]


class DataResponse(BaseModel):
    """Response for data extraction query"""
    study_name: str
    data: List[Dict[str, Any]]
    count: int 