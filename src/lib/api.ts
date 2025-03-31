import { API_BASE_URL } from './constants';

// Updated types to match backend API
export interface Database {
  id: string;
  title: string;
  description: string;
  record_count: number;
  last_updated: string;
  metadata?: {
    study_type?: string;
    year_started?: number;
    principal_investigator?: string;
    patient_count?: number;
    [key: string]: any;
  };
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
  title?: string;
  description?: string;
  metadata?: {
    study_type?: string;
    year_started?: number;
    principal_investigator?: string;
    patient_count?: number;
    [key: string]: any;
  };
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
  // Fetch all available schemas with metadata
  const response = await fetch(`${API_BASE_URL}/schemas-with-metadata`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schemas: ${response.statusText}`);
  }
  const schemasWithMetadata = await response.json() as any[];
  
  // Transform metadata into our Database interface
  return schemasWithMetadata.map(schema => ({
    id: schema.id,
    title: schema.title,
    description: schema.description,
    record_count: schema.metadata.patient_count || 0,
    last_updated: new Date().toISOString(),
    metadata: schema.metadata
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
    title: schemaData.title || datasetId,
    description: schemaData.description || `Clinical dataset containing ${schemaData.total_tables} questionnaires with ${schemaData.total_columns} variables`,
    record_count: schemaData.metadata?.patient_count || schemaData.total_tables,
    last_updated: new Date().toISOString(),
    metadata: schemaData.metadata
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
  try {
    // Use the extract endpoint we created in the backend
    const response = await fetch(`${API_BASE_URL}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Extraction request failed: ${response.statusText}`);
    }
    
    // Check if the response is a file
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    if (contentType && contentType.includes('text/csv')) {
      // Get the blob from the response
      const blob = await response.blob();
      
      // Check if the blob is not empty (more than just headers)
      // A typical empty CSV with just a header row would be very small
      if (blob.size < 50) {
        // The file is likely empty or just has headers
        // Read the file content to check for diagnostic information
        const text = await blob.text();
        
        if (text.includes("No data found")) {
          return {
            status: "warning",
            message: "No data was found for your selected variables. This could be because the tables are empty or the selected columns don't contain data.",
            request: request,
            dataset: request.datasetId,
            selections_count: request.selections.length,
            total_variables: request.selections.reduce((total, selection) => total + selection.variables.length, 0)
          };
        }
      }
      
      // Get filename from content-disposition if available
      let filename = `extracted_data_${request.datasetId}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Return a success response
      return {
        status: "success",
        message: "Data extraction completed successfully. Your download should start automatically.",
        request: request,
        dataset: request.datasetId,
        selections_count: request.selections.length,
        total_variables: request.selections.reduce((total, selection) => total + selection.variables.length, 0)
      };
    } else {
      // If not a file, try to parse the JSON response
      return await response.json();
    }
  } catch (error) {
    console.error("Error during extraction:", error);
    throw error;
  }
} 