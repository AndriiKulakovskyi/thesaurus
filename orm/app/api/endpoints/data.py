from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, select, inspect
from typing import List, Dict, Any, Optional, Tuple
import os
import re
import glob
import logging
from difflib import SequenceMatcher

from app.core.database import get_db, engine
from app.core.yaml_loader import get_study_by_name, get_table_by_name, load_yaml_file
from app.models.study import create_dynamic_model
from app.schemas.study import DataQuery, DataResponse, TableVariables, DataRecord
from app.core.config import settings

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def similarity_score(a: str, b: str) -> float:
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def get_column_mapping(study_name: str, table_name: str) -> Dict[str, Dict[str, Any]]:
    """
    Create a mapping between YAML column names and actual database column names
    by analyzing both YAML and SQL files.
    
    Returns dict where:
    - keys are YAML column names (lowercase)
    - values are dicts with:
        - 'db_name': actual database column name
        - 'data_type': column data type from YAML
        - 'similarity': similarity score if fuzzy matched
        - 'match_type': how this mapping was determined ('exact', 'fuzzy', 'partial', etc.)
    """
    # Default mapping (identity)
    mapping = {}
    yaml_columns = []
    
    # Step 1: Try to read column names from YAML file
    yaml_path = os.path.join(settings.YAML_DIR, study_name, f"{table_name}.yml")
    if os.path.exists(yaml_path):
        try:
            yaml_data = load_yaml_file(yaml_path)
            if 'models' in yaml_data and yaml_data['models']:
                model = yaml_data['models'][0]
                for col in model.get('columns', []):
                    col_name = col.get('name', '')
                    data_type = col.get('data_type', '')
                    if col_name:
                        yaml_columns.append({
                            'name': col_name,
                            'data_type': data_type
                        })
                        # Initially map to itself
                        mapping[col_name.lower()] = {
                            'db_name': col_name,
                            'data_type': data_type,
                            'similarity': 1.0,
                            'match_type': 'identity'
                        }
        except Exception as e:
            logger.warning(f"Error parsing YAML file {yaml_path}: {str(e)}")
    
    # Step 2: Try to read column names from SQL file to get actual DB names
    sql_path = os.path.join(settings.YAML_DIR, study_name, f"{table_name}.sql")
    if os.path.exists(sql_path):
        try:
            with open(sql_path, 'r') as file:
                sql_content = file.read()
                
                # Extract SQL column aliases with improved regex patterns
                # This pattern handles various forms of aliases, including quoted ones
                pattern1 = r'(\w+(?:\([^)]*\))?)\s+AS\s+(?:"|\')?([a-zA-Z0-9_]+)(?:"|\')?,?'
                # This pattern captures more complex expressions like function calls that are aliased
                pattern2 = r'([^,\s]+(?:\([^)]*\))?)\s+AS\s+(?:"|\')?([a-zA-Z0-9_]+)(?:"|\')?,?'
                
                # Find all matches from both patterns
                matches1 = re.findall(pattern1, sql_content, re.IGNORECASE)
                matches2 = re.findall(pattern2, sql_content, re.IGNORECASE)
                
                # Combine matches, prioritizing the more specific pattern1
                db_aliases = {}
                for field, alias in matches1:
                    db_aliases[alias.lower()] = field
                
                for field, alias in matches2:
                    if alias.lower() not in db_aliases:
                        db_aliases[alias.lower()] = field
                
                # Try to find mappings using various strategies
                for yaml_col_lower, map_info in list(mapping.items()):
                    # 1. Check for exact match (case-insensitive)
                    if yaml_col_lower in db_aliases:
                        map_info['db_name'] = yaml_col_lower
                        map_info['match_type'] = 'exact'
                        continue
                    
                    # 2. Check for presence in any alias
                    matched = False
                    for alias, field in db_aliases.items():
                        # 2a. Check if yaml column name contains the alias or vice versa
                        if yaml_col_lower in alias or alias in yaml_col_lower:
                            map_info['db_name'] = alias
                            map_info['similarity'] = similarity_score(yaml_col_lower, alias)
                            map_info['match_type'] = 'partial_contain'
                            matched = True
                            break
                    
                    if matched:
                        continue
                    
                    # 3. Try fuzzy matching for similar names
                    best_match = None
                    best_score = 0.7  # Threshold for similarity
                    for alias in db_aliases.keys():
                        score = similarity_score(yaml_col_lower, alias)
                        if score > best_score:
                            best_score = score
                            best_match = alias
                    
                    if best_match:
                        map_info['db_name'] = best_match
                        map_info['similarity'] = best_score
                        map_info['match_type'] = 'fuzzy'
                
                # Log the mapping decisions for debugging
                logger.debug(f"Column mapping for {study_name}.{table_name}:")
                for yaml_col, info in mapping.items():
                    logger.debug(f"  {yaml_col} -> {info}")
                
        except Exception as e:
            logger.warning(f"Error parsing SQL file {sql_path}: {str(e)}")
    
    return mapping

def get_column_data_types(inspector, schema: str, table_name: str) -> Dict[str, str]:
    """
    Get the data types of columns in a table
    
    Returns dict where keys are column names and values are data types
    """
    try:
        columns = inspector.get_columns(table_name, schema=schema)
        return {col['name']: str(col['type']) for col in columns}
    except Exception as e:
        logger.warning(f"Error getting column types for {schema}.{table_name}: {str(e)}")
        return {}  # Return empty dict if we can't get types

def find_matching_column(
    column_name: str, 
    column_map: Dict[str, str], 
    column_mapping: Dict[str, Dict[str, Any]]
) -> Optional[str]:
    """
    Find a matching column in the database using multiple strategies.
    
    Args:
        column_name: The column name to look for
        column_map: Map of lowercase column names to actual column names in DB
        column_mapping: The YAML to DB column mapping
    
    Returns:
        Actual column name in the database or None if not found
    """
    col_lower = column_name.lower()
    
    # Strategy 1: Check if it's in our YAML to DB mapping
    if col_lower in column_mapping:
        db_col_name = column_mapping[col_lower]['db_name']
        if db_col_name.lower() in column_map:
            return column_map[db_col_name.lower()]
    
    # Strategy 2: Direct match in database columns
    if col_lower in column_map:
        return column_map[col_lower]
    
    # Strategy 3: Look for columns that contain our column name
    for db_col_lower, db_col in column_map.items():
        # Special case for user IDs which often have suffixes
        if col_lower == 'usubjid' and 'usubjid' in db_col_lower:
            return db_col
        
        # General case - look for column name at the start or end of the DB column
        if db_col_lower.startswith(col_lower) or db_col_lower.endswith(col_lower):
            return db_col
    
    # Strategy 4: Fuzzy match
    best_match = None
    best_score = 0.6  # Threshold
    
    for db_col_lower, db_col in column_map.items():
        score = similarity_score(col_lower, db_col_lower)
        if score > best_score:
            best_score = score
            best_match = db_col
    
    if best_match:
        logger.info(f"Fuzzy matched '{column_name}' to '{best_match}' with score {best_score:.2f}")
        return best_match
    
    # No match found
    return None

def process_table_data(
    db: Session, 
    study_name: str, 
    table_name: str, 
    variable_names: Optional[List[str]] = None,
    filters: Optional[Dict[str, Any]] = None,
    limit: Optional[int] = 1000
) -> List[Dict[str, Any]]:
    """
    Process a single table's data extraction
    
    Args:
        db: Database session
        study_name: Name of the study
        table_name: Name of the table
        variable_names: List of variables to extract (or None for all)
        filters: Dictionary of filters to apply
        limit: Maximum number of records to return
        
    Returns:
        List of records with normalized column names
    """
    schema = f"_prod_thesaurus_{study_name}"
    inspector = inspect(engine)
    
    try:
        # Get column mapping between YAML names and actual DB names
        column_mapping = get_column_mapping(study_name, table_name)
        
        # Get column data types
        column_types = get_column_data_types(inspector, schema, table_name)
        
        # Get actual column names from database
        try:
            actual_columns = [col['name'] for col in inspector.get_columns(table_name, schema=schema)]
        except:
            # If we can't get columns directly, try a simpler approach
            info_sql = f"SELECT * FROM {schema}.{table_name} LIMIT 0"
            info_result = db.execute(text(info_sql))
            actual_columns = info_result.keys()
        
        # Create a case-insensitive map of actual database column names
        column_map = {col.lower(): col for col in actual_columns}
        
        # Validate requested variables and map to actual column names
        requested_columns = []
        yaml_to_db_map = {}  # For mapping results back to requested names
        missing_columns = []  # Track columns that don't exist in this table
        
        if variable_names:
            for var_name in variable_names:
                # Use the enhanced column matching function
                db_col = find_matching_column(var_name, column_map, column_mapping)
                
                if db_col:
                    requested_columns.append(db_col)
                    yaml_to_db_map[var_name] = db_col
                else:
                    # Instead of failing, just track missing columns
                    logger.info(f"Column '{var_name}' not found in table {table_name}. Will return null values.")
                    missing_columns.append(var_name)
            
            # If all requested columns are missing, return empty result with structure
            if not requested_columns and variable_names:
                # Return a single empty record with nulls for all requested columns
                return [{var_name: None for var_name in variable_names}]
        else:
            # Use all columns if no specific ones are requested
            requested_columns = actual_columns
            yaml_to_db_map = {col: col for col in actual_columns}
        
        # Build and execute SQL query with properly quoted column names
        columns_str = ', '.join(f'"{col}"' for col in requested_columns)
        
        # Use the schema pattern "_prod_thesaurus_[study_name]"
        sql = f'SELECT {columns_str} FROM {schema}."{table_name}"'
        
        # Apply filters if provided
        where_clauses = []
        if filters:
            for col, condition in filters.items():
                # Use the enhanced column matching function for filter columns too
                db_col = find_matching_column(col, column_map, column_mapping)
                
                if db_col:
                    # Get the column's data type
                    col_type = column_types.get(db_col, '').lower()
                    
                    # Check if it's a string/character type
                    is_string_type = 'char' in col_type or 'text' in col_type
                    
                    actual_col = f'"{db_col}"'
                    if isinstance(condition, dict):
                        for op, value in condition.items():
                            # Handle different operators
                            if op == "eq":
                                where_clauses.append(f"{actual_col} = '{value}'")
                            elif op == "gt":
                                # For string columns being compared with numbers, cast as needed
                                if is_string_type and (isinstance(value, (int, float)) or str(value).isdigit()):
                                    # Filter out non-numeric values and then cast to numeric for comparison
                                    where_clauses.append(f"{actual_col} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST({actual_col} AS NUMERIC) > {value}")
                                elif is_string_type:
                                    where_clauses.append(f"{actual_col} > '{value}'")
                                else:
                                    where_clauses.append(f"{actual_col} > {value}")
                            elif op == "lt":
                                if is_string_type and (isinstance(value, (int, float)) or str(value).isdigit()):
                                    where_clauses.append(f"{actual_col} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST({actual_col} AS NUMERIC) < {value}")
                                elif is_string_type:
                                    where_clauses.append(f"{actual_col} < '{value}'")
                                else:
                                    where_clauses.append(f"{actual_col} < {value}")
                            elif op == "gte":
                                if is_string_type and (isinstance(value, (int, float)) or str(value).isdigit()):
                                    where_clauses.append(f"{actual_col} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST({actual_col} AS NUMERIC) >= {value}")
                                elif is_string_type:
                                    where_clauses.append(f"{actual_col} >= '{value}'")
                                else:
                                    where_clauses.append(f"{actual_col} >= {value}")
                            elif op == "lte":
                                if is_string_type and (isinstance(value, (int, float)) or str(value).isdigit()):
                                    where_clauses.append(f"{actual_col} ~ '^[0-9]+(\\.[0-9]+)?$' AND CAST({actual_col} AS NUMERIC) <= {value}")
                                elif is_string_type:
                                    where_clauses.append(f"{actual_col} <= '{value}'")
                                else:
                                    where_clauses.append(f"{actual_col} <= {value}")
                            elif op == "like":
                                where_clauses.append(f"{actual_col} LIKE '{value}'")
                            elif op == "ilike":  # Case-insensitive LIKE
                                where_clauses.append(f"{actual_col} ILIKE '{value}'")
                            elif op == "in":
                                if isinstance(value, list):
                                    values_str = ", ".join([f"'{v}'" for v in value])
                                    where_clauses.append(f"{actual_col} IN ({values_str})")
                            elif op == "not":
                                if value is None:
                                    where_clauses.append(f"{actual_col} IS NOT NULL")
                                else:
                                    where_clauses.append(f"{actual_col} != '{value}'")
                            elif op == "is":
                                if value is None:
                                    where_clauses.append(f"{actual_col} IS NULL")
                                elif str(value).lower() == 'true':
                                    where_clauses.append(f"{actual_col} IS TRUE")
                                elif str(value).lower() == 'false':
                                    where_clauses.append(f"{actual_col} IS FALSE")
                    else:
                        # Direct value comparison
                        if is_string_type or not isinstance(condition, (int, float)):
                            where_clauses.append(f"{actual_col} = '{condition}'")
                        else:
                            where_clauses.append(f"{actual_col} = {condition}")
                else:
                    # Skip filter for non-existent column but log it
                    logger.warning(f"Filter column '{col}' not found in table {table_name}. Filter will be ignored.")
        
        if where_clauses:
            sql += " WHERE " + " AND ".join(where_clauses)
        
        # Apply limit
        if limit:
            sql += f" LIMIT {limit}"
        
        # Log the generated SQL for debugging
        logger.debug(f"Generated SQL: {sql}")
        
        # Execute query
        result = db.execute(text(sql))
        
        # Process results
        columns = result.keys()
        records = [dict(zip(columns, row)) for row in result.fetchall()]
        
        # Map column names back to the ones requested by user if needed
        normalized_records = []
        for record in records:
            normalized_record = {}
            
            # First add the columns we have data for
            for db_col, value in record.items():
                # Find the original column name requested by the user
                for yaml_col, mapped_db_col in yaml_to_db_map.items():
                    if mapped_db_col == db_col:
                        normalized_record[yaml_col] = value
                        break
                else:
                    # If no mapping found, keep the original name
                    normalized_record[db_col] = value
            
            # Then add null values for missing columns
            for missing_col in missing_columns:
                normalized_record[missing_col] = None
                
            normalized_records.append(normalized_record)
        
        # If we got no results but had missing columns, return a single record with nulls
        if not normalized_records and variable_names:
            return [{var_name: None if var_name in missing_columns else "" for var_name in variable_names}]
        
        return normalized_records
        
    except Exception as e:
        logger.error(f"Error processing table {table_name}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database query error for table {table_name}: {str(e)}")

@router.post("/extract", response_model=DataResponse)
async def extract_data(query: DataQuery, db: Session = Depends(get_db)):
    """
    Extract data from the clinical studies database based on the provided query.
    
    You can use this endpoint in two ways:
    
    1. Simple format: Specify study_name, table_names, and optional variable_names and filters
       This will apply the same variables and filters to all tables.
       
    2. Advanced format: Specify study_name and tables_with_variables
       This allows you to specify different variables and filters for each table.
       
    Examples:
    
    Simple format:
    ```json
    {
      "study_name": "face_bp",
      "table_names": ["face_bp_1_patients", "face_bp_2_autoquestionnaires"],
      "variable_names": ["usubjid", "age", "sex"],
      "filters": {"age": {"gt": 30}},
      "limit": 100
    }
    ```
    
    Advanced format:
    ```json
    {
      "study_name": "face_bp",
      "tables_with_variables": [
        {
          "table_name": "face_bp_1_patients",
          "variable_names": ["usubjid", "age", "sex"],
          "filters": {"age": {"gt": 30}}
        },
        {
          "table_name": "face_bp_11_soin_suivi_hosp_arret_travail",
          "variable_names": ["usubjid", "agedebut_hospitalisation"]
        }
      ],
      "limit": 100
    }
    ```
    """
    study = get_study_by_name(query.study_name)
    if study is None:
        raise HTTPException(status_code=404, detail=f"Study {query.study_name} not found")
    
    # Get list of tables in the study
    study_tables = {table['name']: table for table in study.get('tables', [])}
    
    # Validate the request format
    if not query.table_names and not query.tables_with_variables:
        raise HTTPException(
            status_code=400,
            detail="Either table_names or tables_with_variables must be provided"
        )
    
    # Normalize the request to the advanced format for simpler processing
    tables_to_process = []
    
    if query.tables_with_variables:
        # Using advanced format with table-specific variables and filters
        tables_to_process = query.tables_with_variables
    else:
        # Using simple format - convert to advanced format
        for table_name in query.table_names:
            tables_to_process.append(
                TableVariables(
                    table_name=table_name,
                    variable_names=query.variable_names if query.variable_names else [],
                    filters=query.filters
                )
            )
    
    # Check for invalid tables, but don't fail - just log warnings
    invalid_tables = [t.table_name for t in tables_to_process if t.table_name not in study_tables]
    if invalid_tables:
        logger.warning(f"Some tables requested do not exist in study {query.study_name}: {', '.join(invalid_tables)}")
    
    # Filter out invalid tables
    tables_to_process = [t for t in tables_to_process if t.table_name in study_tables]
    
    # Handle case where no valid tables were provided
    if not tables_to_process:
        logger.warning(f"No valid tables were requested for study {query.study_name}")
        # Return empty result with structure
        if query.variable_names:
            return DataResponse(
                study_name=query.study_name,
                data=[{"table_name": invalid_tables[0] if invalid_tables else "unknown", "data": {var: None for var in query.variable_names}}],
                count=0
            )
        else:
            return DataResponse(
                study_name=query.study_name,
                data=[],
                count=0
            )
    
    # Process each table
    all_data = []
    
    for table_config in tables_to_process:
        try:
            table_data = process_table_data(
                db=db,
                study_name=query.study_name,
                table_name=table_config.table_name,
                variable_names=table_config.variable_names,
                filters=table_config.filters,
                limit=query.limit
            )
            
            # Add table name to each record for identification
            for record in table_data:
                all_data.append({
                    "table_name": table_config.table_name,
                    "data": record
                })
        except Exception as e:
            # Don't fail the entire request if one table fails
            logger.error(f"Error processing table {table_config.table_name}: {str(e)}", exc_info=True)
            
            # Add a placeholder record with null values for this table
            if table_config.variable_names:
                all_data.append({
                    "table_name": table_config.table_name,
                    "data": {var: None for var in table_config.variable_names}
                })
    
    return DataResponse(
        study_name=query.study_name,
        data=all_data,
        count=len(all_data)
    ) 