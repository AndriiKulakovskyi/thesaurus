import { API_BASE_URL } from './constants';

// Updated types to match backend API
export interface Database {
  id: string;
  title: string;
  description: string;
  record_count: number;
  last_updated: string;
}

export interface SchemaTable {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    primary_key: boolean;
    default: string | null;
  }>;
  primary_keys: string[];
  foreign_keys: Array<{
    column: string;
    references_table: string;
    references_column: string;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
  }>;
}

export interface Schema {
  tables: Record<string, SchemaTable>;
  total_tables: number;
  total_columns: number;
}

export interface VariableSelection {
  questionnaireId: string;
  variables: string[];
}

export interface ExtractionRequest {
  datasetId: string;
  selections: VariableSelection[];
}

export interface ExtractionResponse {
  status: string;
  message: string;
  request: ExtractionRequest;
  dataset: string;
  selections_count: number;
  total_variables: number;
}

// Adapted API functions to match backend
export async function fetchDatabases(): Promise<Database[]> {
  // Fetch all available schemas - these are the "databases" in our context
  const response = await fetch(`${API_BASE_URL}/schemas`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schemas: ${response.statusText}`);
  }
  const schemas = await response.json() as string[];
  
  // Transform schema names into our Database interface
  // We'll get additional details when the specific schema is selected
  return schemas.map(schema => ({
    id: schema,
    title: schema,
    description: `Clinical dataset for ${schema} study`,
    record_count: 0, // Will be populated on detail view
    last_updated: new Date().toISOString() // Use current date as placeholder
  }));
}

export async function fetchDatabase(datasetId: string): Promise<Database> {
  // Get the schema summary
  const response = await fetch(`${API_BASE_URL}/schemas/${datasetId}/tables`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema ${datasetId}: ${response.statusText}`);
  }
  
  const schemaData = await response.json() as Schema;
  
  // Create database object from schema data
  return {
    id: datasetId,
    title: datasetId,
    description: `Clinical dataset containing ${schemaData.total_tables} questionnaires with ${schemaData.total_columns} variables`,
    record_count: schemaData.total_tables,
    last_updated: new Date().toISOString()
  };
}

export async function fetchQuestionnaires(datasetId: string): Promise<any[]> {
  // Get the tables (questionnaires) for this schema
  const response = await fetch(`${API_BASE_URL}/schemas/${datasetId}/tables`);
  if (!response.ok) {
    throw new Error(`Failed to fetch questionnaires for dataset ${datasetId}: ${response.statusText}`);
  }
  
  const schemaData = await response.json() as Schema;
  
  // Transform schema tables into questionnaire format
  return Object.entries(schemaData.tables).map(([tableName, tableData]) => {
    // Parse the full table name to get just the table name without schema prefix
    const shortTableName = tableName.split('.')[1] || tableName;
    
    // Format the data to match our frontend's expected structure
    return {
      form: {
        nomFormulaire: shortTableName,
        nomTable: tableName
      },
      fields: [
        tableData.columns.map(column => ({
          description: column.name,
          variable_name: column.name,
          data_type: column.type,
          possible_answers: {}
        }))
      ]
    };
  });
}

export async function submitExtraction(request: ExtractionRequest): Promise<ExtractionResponse> {
  // This will need to be implemented on the backend
  // For now, return a mock response
  return {
    status: "success",
    message: "Data extraction completed successfully",
    request: request,
    dataset: request.datasetId,
    selections_count: request.selections.length,
    total_variables: request.selections.reduce((total, selection) => total + selection.variables.length, 0)
  };
} 