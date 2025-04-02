from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from .database import DatabaseManager

# Load environment variables
load_dotenv()

def get_available_studies(db_manager: DatabaseManager) -> List[Dict[str, Any]]:
    """Get list of available studies with their metadata"""
    studies = []
    for schema, study_info in db_manager.study_info.items():
        studies.append({
            "schema": schema,
            "name": study_info.name,
            "description": study_info.description,
            "metadata": study_info.metadata.model_dump()
        })
    return studies

def get_study_tables(db_manager: DatabaseManager, schema_name: str) -> List[Dict[str, Any]]:
    """Get list of tables (questionnaires) for a specific study"""
    models = db_manager.get_schema_models(schema_name)
    tables = []
    
    for table_name in models:
        schema, name = table_name.split('.')
        if schema == schema_name:
            model = models[table_name]
            tables.append({
                "name": name,
                "description": model.__doc__,
                "columns": list(model.model_fields.keys())
            })
    
    return tables

def extract_study_data(
    db_manager: DatabaseManager,
    schema_name: str,
    table_name: str,
    columns: List[str],
    filters: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """Extract data from a specific table with selected columns"""
    return db_manager.extract_data(schema_name, table_name, columns, filters)

def main():
    """Example usage of the database models"""
    # Initialize database manager
    connection_string = os.getenv('DATABASE_URL')
    if not connection_string:
        raise ValueError("DATABASE_URL environment variable not set")
    
    db_manager = DatabaseManager(connection_string)
    
    # Example 1: List available studies
    print("\nAvailable Studies:")
    studies = get_available_studies(db_manager)
    for study in studies:
        print(f"\nStudy: {study['name']}")
        print(f"Description: {study['description']}")
        print("Metadata:")
        for key, value in study['metadata'].items():
            print(f"  {key}: {value}")
    
    # Example 2: Get tables for a specific study
    schema_name = "_prod_clean_easperger"  # Example schema
    print(f"\nTables in {schema_name}:")
    tables = get_study_tables(db_manager, schema_name)
    for table in tables:
        print(f"\nTable: {table['name']}")
        print(f"Description: {table['description']}")
        print("Available columns:")
        for column in table['columns']:
            print(f"  - {column}")
    
    # Example 3: Extract data from a specific table
    if tables:  # If we have any tables
        example_table = tables[0]['name']
        example_columns = tables[0]['columns'][:3]  # First 3 columns
        
        print(f"\nExtracting data from {schema_name}.{example_table}")
        print(f"Selected columns: {example_columns}")
        
        data = extract_study_data(
            db_manager,
            schema_name,
            example_table,
            example_columns,
            filters={"patient_id": 1}  # Example filter
        )
        
        print("\nExtracted data:")
        for row in data[:5]:  # Show first 5 rows
            print(row)

if __name__ == "__main__":
    main() 