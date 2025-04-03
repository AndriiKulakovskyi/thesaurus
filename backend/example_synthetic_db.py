"""
Example script demonstrating use of the synthetic database.

This script shows how to:
1. Set up the environment to use synthetic data
2. Access the API endpoints to retrieve study data
3. Validate that data is being generated correctly
"""

import os
import json
import requests
from pprint import pprint
import argparse
import sys
import time

# Ensure the synthetic database mode is enabled
os.environ["USE_SYNTHETIC_DB"] = "true"

def start_server():
    """Start the API server in a subprocess"""
    import subprocess
    import sys
    import time
    
    print("Starting API server with synthetic database...")
    process = subprocess.Popen([sys.executable, "main.py"])
    
    # Wait for server to start
    time.sleep(5)
    return process

def test_api(base_url="http://localhost:8000"):
    """Test the various API endpoints"""
    
    print("\n=== Testing API with Synthetic Database ===\n")
    
    # Test root endpoint
    print("Testing root endpoint...")
    try:
        response = requests.get(f"{base_url}/")
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()
        print(f"API Version: {data.get('version')}")
        print(f"Database Type: {data.get('database_type')}")
        assert data.get('database_type') == "Synthetic (Development)"
        print("✓ Root endpoint working with synthetic database\n")
    except Exception as e:
        print(f"❌ Error testing root endpoint: {e}")
        return False
    
    # Get available studies
    print("Fetching available studies...")
    try:
        response = requests.get(f"{base_url}/api/v1/studies")
        response.raise_for_status()
        studies = response.json()
        print(f"Found {len(studies)} studies:")
        for study in studies:
            print(f"  - {study['name']}: {study['description']}")
        assert len(studies) > 0
        print("✓ Studies endpoint working with synthetic database\n")
    except Exception as e:
        print(f"❌ Error fetching studies: {e}")
        if hasattr(response, 'text'):
            print(f"Error response: {response.text}")
        return False
    
    # Choose the first study for further testing
    first_study = studies[0]
    schema_name = first_study["schema"]
    
    # Get tables for the first study
    print(f"Fetching tables for study '{first_study['name']}'...")
    try:
        response = requests.get(f"{base_url}/api/v1/studies/{schema_name}/tables")
        response.raise_for_status()
        tables = response.json()
        print(f"Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table['name']}: {len(table['columns'])} columns")
        assert len(tables) > 0
        print("✓ Tables endpoint working with synthetic database\n")
    except Exception as e:
        print(f"❌ Error fetching tables: {e}")
        if hasattr(response, 'text'):
            print(f"Error response: {response.text}")
        return False
    
    # Choose the first table for data extraction
    first_table = tables[0]
    table_name = first_table["name"]
    
    # Get columns for the table
    print(f"Fetching columns for table '{table_name}'...")
    try:
        response = requests.get(f"{base_url}/api/v1/studies/{schema_name}/tables/{table_name}/columns")
        response.raise_for_status()
        columns_data = response.json()
        columns = columns_data.get("columns", [])
        print(f"Found {len(columns)} columns:")
        print(f"  {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''}")
        assert len(columns) > 0
        print("✓ Columns endpoint working with synthetic database\n")
    except Exception as e:
        print(f"❌ Error fetching columns: {e}")
        if hasattr(response, 'text'):
            print(f"Error response: {response.text}")
        return False
    
    # Extract data from the table
    print(f"Extracting data from table '{table_name}'...")
    try:
        data_request = {
            "schema_name": schema_name,
            "table_selections": {
                table_name: columns[:3]  # Just extract first three columns
            }
        }
        response = requests.post(f"{base_url}/api/v1/data", json=data_request)
        response.raise_for_status()
        extraction_data = response.json()
        
        row_count = extraction_data["row_counts"][table_name]
        print(f"Extracted {row_count} rows")
        
        # Print sample of data (first 2 rows)
        if row_count > 0:
            print("\nSample data (first 2 rows):")
            for row in extraction_data["data"][table_name][:2]:
                pprint(row)
        
        assert row_count > 0
        print("✓ Data extraction endpoint working with synthetic database\n")
    except Exception as e:
        print(f"❌ Error extracting data: {e}")
        if hasattr(response, 'text'):
            print(f"Error response: {response.text}")
        return False
    
    print("\n=== All tests passed! Synthetic database is working correctly. ===")
    return True
    
def main():
    parser = argparse.ArgumentParser(description="Test the synthetic database API")
    parser.add_argument("--start-server", action="store_true", help="Start the API server")
    parser.add_argument("--url", default="http://localhost:8000", help="API base URL")
    
    args = parser.parse_args()
    
    server_process = None
    if args.start_server:
        server_process = start_server()
    
    success = False
    try:
        # Try to connect multiple times if necessary
        for attempt in range(3):
            print(f"\nAttempt {attempt + 1} to test API...")
            if test_api(args.url):
                success = True
                break
            elif server_process and attempt < 2:  # Only retry with our own server
                print("Retrying in 3 seconds...")
                time.sleep(3)
            else:
                break
    finally:
        if server_process:
            print("Stopping server...")
            server_process.terminate()
    
    if not success:
        print("\n❌ Tests did not complete successfully.")
        sys.exit(1)
    
    sys.exit(0)

if __name__ == "__main__":
    main() 