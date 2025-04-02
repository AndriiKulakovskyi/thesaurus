from typing import Dict, Type, List, Optional
import yaml
import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager
import logging

from .base import BaseORMModel, StudyInfoModel, MetadataModel
from .model_factory import create_models_from_metadata

class DatabaseManager:
    """Manages database connections and models for different schemas"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.engine = create_engine(connection_string)
        self.metadata = MetaData()
        self.Session = sessionmaker(bind=self.engine)
        self.models: Dict[str, Dict[str, Type[BaseORMModel]]] = {}
        self.study_info: Dict[str, StudyInfoModel] = {}
        self._load_study_info()
        
    def _load_study_info(self):
        """Load study information from YAML config"""
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'databases.yaml')
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                
            for schema, info in config.items():
                self.study_info[schema] = StudyInfoModel(
                    name=info['name'],
                    description=info['description'],
                    metadata=MetadataModel(**info['metadata'])
                )
        except Exception as e:
            logging.error(f"Error loading study info: {e}")
            
    def init_schema_models(self, schema_name: str) -> Dict[str, Type[BaseORMModel]]:
        """Initialize models for a specific schema"""
        try:
            # Reflect tables for the schema
            self.metadata.reflect(bind=self.engine, schema=schema_name)
            
            # Create models
            schema_models = create_models_from_metadata(self.metadata)
            self.models[schema_name] = schema_models
            
            return schema_models
        except SQLAlchemyError as e:
            logging.error(f"Error initializing models for schema {schema_name}: {e}")
            raise
            
    def get_schema_models(self, schema_name: str) -> Dict[str, Type[BaseORMModel]]:
        """Get or create models for a schema"""
        if schema_name not in self.models:
            return self.init_schema_models(schema_name)
        return self.models[schema_name]
    
    def get_study_info(self, schema_name: str) -> Optional[StudyInfoModel]:
        """Get study information for a schema"""
        return self.study_info.get(schema_name)
    
    @contextmanager
    def get_session(self):
        """Get a database session"""
        session = self.Session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
            
    def get_table_columns(self, schema_name: str, table_name: str) -> List[str]:
        """Get column names for a specific table"""
        models = self.get_schema_models(schema_name)
        model = models.get(f"{schema_name}.{table_name}")
        if model:
            return list(model.model_fields.keys())
        return []
    
    def extract_data(self, schema_name: str, table_name: str, columns: List[str], filters: Optional[Dict] = None):
        """Extract data from a table with specified columns"""
        with self.get_session() as session:
            # Get the model for this table
            models = self.get_schema_models(schema_name)
            model = models.get(f"{schema_name}.{table_name}")
            
            if not model:
                raise ValueError(f"No model found for {schema_name}.{table_name}")
            
            # Build query
            query = f"SELECT {', '.join(columns)} FROM {schema_name}.{table_name}"
            
            # Add filters if provided
            if filters:
                conditions = []
                for column, value in filters.items():
                    conditions.append(f"{column} = :{column}")
                if conditions:
                    query += " WHERE " + " AND ".join(conditions)
            
            # Execute query
            result = session.execute(query, filters or {})
            
            # Convert to list of dicts
            return [dict(zip(columns, row)) for row in result] 