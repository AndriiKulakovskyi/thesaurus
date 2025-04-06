# Clinical Studies API

This FastAPI application serves as an interface to clinical studies data that is transformed by DBT. It uses SQLAlchemy to interface with the database and reads study metadata from YAML files in the thesaurus model.

## Features

- List all available studies
- View detailed information about each study
- View tables and variables for each study
- Extract data from specific studies, tables, and variables using custom queries
- Support for multi-table queries with table-specific variables and filters
- Intelligent column name matching between YAML docs and database
- Fuzzy matching for column names to handle discrepancies
- Graceful error handling for missing columns and tables

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

Create a `.env` file in the `orm` directory with the following variables:

```
DB_USER=postgres
DB_PASSWORD=Sofiyyka&&1
DB_NAME=fondamental
DB_HOST=localhost
DB_PORT=5432
YAML_DIR=../clean_to_extract_all/models/thesaurus
```

## Running the application

```bash
cd orm
python run.py
```

The API will be available at `http://localhost:8080`

## API Endpoints

- `GET /api/v1/studies`: Get list of all studies
- `GET /api/v1/studies/{study_name}`: Get detailed information about a specific study
- `GET /api/v1/tables/{study_name}`: Get all tables for a specific study
- `GET /api/v1/tables/{study_name}/{table_name}`: Get detailed information about a specific table
- `POST /api/v1/data/extract`: Extract data from the database based on a query

### Example Queries

#### Basic single-table query:

```json
{
  "study_name": "face_bp",
  "table_names": ["face_bp_11_soin_suivi_hosp_arret_travail"],
  "variable_names": ["usubjid", "agedebut_hospitalisation", "hodur_hospitalisation_ly"],
  "filters": {
    "agedebut_hospitalisation": {"gt": "20"}
  },
  "limit": 100
}
```

#### Multi-table query with the same variables:

```json
{
  "study_name": "face_bp",
  "table_names": ["face_bp_11_soin_suivi_hosp_arret_travail", "face_bp_14_social"],
  "variable_names": ["usubjid"],
  "limit": 100
}
```

#### Advanced query with table-specific variables and filters:

```json
{
  "study_name": "face_bp",
  "tables_with_variables": [
    {
      "table_name": "face_bp_11_soin_suivi_hosp_arret_travail",
      "variable_names": ["usubjid", "agedebut_hospitalisation", "hodur_hospitalisation_ly"],
      "filters": {
        "agedebut_hospitalisation": {"gt": "20"}
      }
    },
    {
      "table_name": "face_bp_14_social",
      "variable_names": ["usubjid", "maristat", "visitnum"],
      "filters": {
        "visitnum": {"eq": "1"}
      }
    }
  ],
  "limit": 50
}
```

### Notes:

- **Missing columns**: If you request a column that doesn't exist in a table, the API will return `null` values for that column instead of failing. This makes it easier to query multiple tables with the same set of variables.
- **Missing tables**: If you request a table that doesn't exist, the API will skip it and return results from the tables that do exist, rather than failing the entire request.
- **Failed filters**: If you specify a filter on a column that doesn't exist, the filter will be ignored (with a warning in the logs).
- You can use either the column names from the YAML files or the actual column names in the database.
- The API is smart enough to find the correct column names by looking at both the YAML and SQL files.
- If you're unsure what columns are available, make a request without specifying variable_names to get all columns.
- Each record in the response includes a `table_name` field that indicates which table the data came from.
- You can use either the simple format (table_names + variable_names) or the advanced format (tables_with_variables) depending on your needs.
- **Intelligent column matching**: The API uses several strategies to match column names:
  1. Direct matches from YAML to database
  2. Prefix/suffix matching (e.g., "usubjid" matches "usubjid_soin_suivi_hosp_arret_travail")
  3. Fuzzy matching for similar names
- **Filters for string columns**: When filtering string columns that contain numeric values (e.g., age stored as a string), the API will automatically cast them to numeric types for comparison. It's recommended to use string values in your filter conditions (e.g., `{"gt": "20"}` instead of `{"gt": 20}`) to avoid type conversion issues.
- **Handling non-numeric values**: When comparing string columns with numeric values (e.g., `{"agedebut_hospitalisation": {"gt": "20"}}`), the API will automatically filter out non-numeric values like "Ne sais pas" (Don't know) before applying the comparison. This means that rows with non-numeric values will be excluded from the results when using numeric comparisons.
- **Filter operators**: Supported filter operators include:
  - `eq`: Equal to
  - `gt`: Greater than
  - `lt`: Less than
  - `gte`: Greater than or equal to
  - `lte`: Less than or equal to
  - `like`: SQL LIKE pattern matching (use % for wildcards)
  - `ilike`: Case-insensitive LIKE pattern matching
  - `in`: Match any value in a list
  - `not`: Not equal to / not null
  - `is`: Is null, true, or false

## API Documentation

API documentation is available at `/docs` endpoint when the application is running. 