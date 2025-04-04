# Dummy Data System

This folder contains synthetic data that can be used when the backend API is unavailable. The system automatically falls back to using this data when it can't connect to the backend server.

## How It Works

The API service in `src/lib/api.ts` attempts to connect to the backend API first. If the connection fails or times out, it automatically uses the dummy data from this folder instead.

## Files

- `studies.json` - List of all available studies/databases
- `tablesEasperger.json` - Table definitions for the Asperger study
- `tablesEbipolar.json` - Table definitions for the Bipolar study
- `tablesEdepression.json` - Table definitions for the Depression study
- `tablesEschizo.json` - Table definitions for the Schizophrenia study
- `index.ts` - Service functions that load and process the dummy data

## Modifying the Dummy Data

If you need to modify the structure of the dummy data:

1. Edit the appropriate JSON file(s) in this folder
2. Make sure the data structure matches what the frontend expects
3. If adding new endpoints, update the service functions in `index.ts` accordingly

## Using in Development

When developing frontend features that require backend API data:

1. You can work without running the backend server - the frontend will automatically use dummy data
2. The console will log messages indicating when dummy data is being used
3. You'll see "Using dummy data" messages in the browser console when this happens

This allows frontend development to continue independently of backend availability. 