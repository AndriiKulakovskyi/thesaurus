from typing import Dict, List, Type, Any
from pydantic import create_model, BaseModel
from sqlalchemy import MetaData, Table, Column
from .base import BaseORMModel, TableInfo, ColumnInfo

class ModelFactory:
    """Factory class for creating Pydantic models from database tables"""
    
    @staticmethod
    def _get_pydantic_type(sql_type: str) -> Type:
        """Convert SQL type to Python/Pydantic type"""
        type_mapping = {
            'INTEGER': int,
            'BIGINT': int,
            'SMALLINT': int,
            'FLOAT': float,
            'REAL': float,
            'DOUBLE': float,
            'DECIMAL': float,
            'NUMERIC': float,
            'VARCHAR': str,
            'TEXT': str,
            'CHAR': str,
            'BOOLEAN': bool,
            'TIMESTAMP': str,  # You might want to use datetime here
            'DATE': str,       # You might want to use date here
            'JSON': dict,
            'JSONB': dict,
        }
        
        # Default to str if type not found
        for sql_type_key in type_mapping:
            if sql_type_key in sql_type.upper():
                return type_mapping[sql_type_key]
        return str

    @classmethod
    def create_table_model(cls, table_info: TableInfo) -> Type[BaseORMModel]:
        """Create a Pydantic model for a database table"""
        fields: Dict[str, tuple] = {}
        
        for column in table_info.columns:
            python_type = cls._get_pydantic_type(column.type)
            # Make field optional if nullable
            if column.nullable:
                python_type = Any | None
            
            fields[column.name] = (python_type, ...)
            
        # Create model name - capitalize schema and table name
        model_name = f"{table_info.schema.capitalize()}{table_info.name.capitalize()}Model"
        
        # Create and return the model class
        model = create_model(
            model_name,
            __base__=BaseORMModel,
            **fields
        )
        
        # Add metadata to the model
        model.__doc__ = table_info.description or f"Model for {table_info.schema}.{table_info.name}"
        
        return model

    @classmethod
    def create_schema_models(cls, tables_info: List[TableInfo]) -> Dict[str, Type[BaseORMModel]]:
        """Create all models for a database schema"""
        models = {}
        for table_info in tables_info:
            model = cls.create_table_model(table_info)
            models[f"{table_info.schema}.{table_info.name}"] = model
        return models

def create_models_from_metadata(metadata: MetaData) -> Dict[str, Type[BaseORMModel]]:
    """Create Pydantic models from SQLAlchemy metadata"""
    tables_info = []
    
    for table_name, table in metadata.tables.items():
        schema, name = table_name.split('.')
        
        columns = []
        for col in table.columns:
            column_info = ColumnInfo(
                name=col.name,
                type=str(col.type),
                nullable=col.nullable,
                primary_key=col.primary_key,
                default=str(col.default) if col.default else None
            )
            columns.append(column_info)
            
        table_info = TableInfo(
            name=name,
            schema=schema,
            columns=columns,
            primary_keys=[pk.name for pk in table.primary_key],
            foreign_keys=[{
                'column': fk.parent.name,
                'references_table': f"{fk.column.table.schema}.{fk.column.table.name}",
                'references_column': fk.column.name
            } for fk in table.foreign_keys]
        )
        tables_info.append(table_info)
    
    return ModelFactory.create_schema_models(tables_info) 