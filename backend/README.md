# Clinical Database API Backend

This FastAPI backend provides access to clinical database schemas and metadata, allowing frontend applications to explore available clinical databases, questionnaires, and variables.

## Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
Create a `.env` file in the backend directory with the following content:
```
DATABASE_URL=postgresql://username:password@host:port/database
```

Replace the values with your actual PostgreSQL database credentials.

## Running the Server

Start the server with:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### 1. Get All Schemas
```
GET /schemas
```
Returns a list of all available database schemas.

### 2. Get Schema Tables
```
GET /schemas/{schema}/tables
```
Returns all tables and their details for a specific schema.

### 3. Get Table Details
```
GET /schemas/{schema}/tables/{table}
```
Returns detailed information about a specific table, including columns, primary keys, foreign keys, and indexes.

### 4. Get Database Summary
```
GET /summary
```
Returns a summary of the database structure, including total counts of schemas, tables, columns, and relationships.

## API Documentation

Once the server is running, you can access:
- Interactive API documentation (Swagger UI): `http://localhost:8000/docs`
- Alternative API documentation (ReDoc): `http://localhost:8000/redoc`

## Error Handling

The API includes proper error handling for:
- Database connection issues
- Invalid schema names
- Invalid table names
- Server errors

All errors are returned with appropriate HTTP status codes and error messages.

## CORS

CORS is enabled for all origins in development. In production, you should configure the allowed origins in the `main.py` file.

# Clinical Study Data API

Backend API for accessing clinical study data across multiple databases.

## Setup

1. Ensure you have Python 3.8+ installed
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure your database connection in `.env` file (see .env.example)

## Development

### Running the API

```bash
python main.py
```

The API will be available at http://localhost:8000

### API Documentation

Once the API is running, you can access the OpenAPI documentation at:
- http://localhost:8000/docs

## Synthetic Database for Development

The backend now supports a synthetic database mode for faster frontend development without requiring a real database connection.

### How to Use

1. Set `USE_SYNTHETIC_DB=true` in your `.env` file.
2. If the `.env` file is missing, the system will automatically use the synthetic database.

### Features

- Generates realistic synthetic data matching the schema structure
- All API endpoints work identically to the real database
- No need for a real database connection during frontend development
- Data is generated on-the-fly in memory

### Customizing Synthetic Data

The synthetic data generator creates:
- Patient records
- Visit records
- Study-specific questionnaires:
  - Autism Quotient (AQ) questionnaire for Asperger study
  - YMRS questionnaire for Bipolar study
  - PHQ-9 questionnaire for Depression study
  - PANSS questionnaire for Schizophrenia study

If you need to extend the synthetic data, modify the `synthetic_db.py` file in the models directory.

### Testing the Synthetic Database

You can test if the synthetic database is working correctly by running:

```bash
python example_synthetic_db.py --start-server
```

This script will:
1. Start the API server with the synthetic database enabled
2. Test all major API endpoints
3. Verify that data is being generated correctly

## Troubleshooting

### Synthetic Database Issues

If you encounter errors with the synthetic database:

1. Make sure your `.env` file has `USE_SYNTHETIC_DB=true` set correctly
2. Check that the config file at `backend/config/databases.yaml` exists and is correctly formatted
3. If you get an error about model attributes, ensure that the model classes in `synthetic_db.py` are properly accessing object attributes (not using dictionary syntax)

## Testing

Run the tests with:
```bash
pytest
``` 