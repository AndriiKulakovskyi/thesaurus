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