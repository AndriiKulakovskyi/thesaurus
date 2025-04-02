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

// V1 API interfaces
export interface StudyInfo {
  schema: string;
  name: string;
  description: string;
  metadata: {
    study_type: string;
    year_started: number;
    principal_investigator: string;
    patient_count: number;
  };
}

export interface TableInfo {
  name: string;
  description: string;
  columns: string[];
}

// Adapted API functions to use V1 endpoints
export async function fetchDatabases(): Promise<Database[]> {
  // Fetch all available studies from V1 API
  const response = await fetch(`${API_BASE_URL}/api/v1/studies`);
  if (!response.ok) {
    throw new Error(`Failed to fetch studies: ${response.statusText}`);
  }
  const studies = await response.json() as StudyInfo[];
  
  // Transform study info into our Database interface
  return studies.map(study => ({
    id: study.schema,
    title: study.name,
    description: study.description,
    record_count: study.metadata.patient_count || 0,
    last_updated: new Date().toISOString(),
    metadata: study.metadata
  }));
}

export async function fetchDatabase(datasetId: string): Promise<Database> {
  // Get study info from V1 API
  const response = await fetch(`${API_BASE_URL}/api/v1/studies`);
  if (!response.ok) {
    throw new Error(`Failed to fetch studies: ${response.statusText}`);
  }
  
  const studies = await response.json() as StudyInfo[];
  const study = studies.find(s => s.schema === datasetId);
  
  if (!study) {
    throw new Error(`Study with ID ${datasetId} not found`);
  }
  
  // Get table count for this schema
  const tablesResponse = await fetch(`${API_BASE_URL}/api/v1/studies/${datasetId}/tables`);
  if (!tablesResponse.ok) {
    throw new Error(`Failed to fetch tables for ${datasetId}: ${tablesResponse.statusText}`);
  }
  
  const tables = await tablesResponse.json() as TableInfo[];
  
  // Create database object from study and tables data
  return {
    id: datasetId,
    title: study.name,
    description: study.description,
    record_count: study.metadata.patient_count || 0,
    last_updated: new Date().toISOString(),
    metadata: study.metadata
  };
}

export async function fetchQuestionnaires(datasetId: string): Promise<any[]> {
  // Get tables from V1 API
  const response = await fetch(`${API_BASE_URL}/api/v1/studies/${datasetId}/tables`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tables for ${datasetId}: ${response.statusText}`);
  }
  
  const tables = await response.json() as TableInfo[];
  
  // Transform tables into questionnaire format
  return Promise.all(tables.map(async (table) => {
    // Fetch columns for this table
    const columnsResponse = await fetch(`${API_BASE_URL}/api/v1/studies/${datasetId}/tables/${table.name}/columns`);
    if (!columnsResponse.ok) {
      throw new Error(`Failed to fetch columns for ${table.name}: ${columnsResponse.statusText}`);
    }
    
    const columnsData = await columnsResponse.json();
    const columns = columnsData.columns || [];
    
    // Format the data to match frontend expected structure
    return {
      form: {
        nomFormulaire: table.name,
        nomTable: `${datasetId}.${table.name}`
      },
      fields: [
        columns.map(column => ({
          description: column,
          variable_name: column,
          data_type: "string", // Default to string since we don't have type info
          possible_answers: {}
        }))
      ]
    };
  }));
}

export async function submitExtraction(request: ExtractionRequest): Promise<ExtractionResponse> {
  try {
    console.log("Submitting extraction request:", request);
    
    // Validate the request structure
    if (!request.datasetId) {
      throw new Error("Missing datasetId in extraction request");
    }
    
    if (!request.selections || !Array.isArray(request.selections)) {
      throw new Error("Missing or invalid selections in extraction request");
    }
    
    // Verify the selections have the required fields
    request.selections.forEach((selection, index) => {
      if (!selection.questionnaireId) {
        throw new Error(`Missing questionnaireId in selection at index ${index}`);
      }
      if (!selection.variables || !Array.isArray(selection.variables)) {
        throw new Error(`Missing or invalid variables in selection at index ${index}`);
      }
    });
    
    // Use the V1 extract endpoint
    const response = await fetch(`${API_BASE_URL}/api/v1/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => null);
      console.error("Extraction API error:", errorData);
      throw new Error(errorData?.detail || `Extraction request failed: ${response.statusText}`);
    }
    
    // Check if the response is a file
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    console.log("Response headers:", {
      contentType,
      contentDisposition
    });
    
    if (contentType && contentType.includes('text/csv')) {
      // Get the blob from the response
      const blob = await response.blob();
      
      console.log("Received CSV blob size:", blob.size);
      
      // Check if the blob is not empty (more than just headers)
      // A typical empty CSV with just a header row would be very small
      if (blob.size < 50) {
        // The file is likely empty or just has headers
        // Read the file content to check for diagnostic information
        const text = await blob.text();
        
        console.log("Empty CSV content:", text);
        
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
      
      console.log("Download completed for:", filename);
      
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
      const jsonResponse = await response.json();
      console.log("Received JSON response:", jsonResponse);
      return jsonResponse;
    }
  } catch (error) {
    console.error("Error during extraction:", error);
    throw error;
  }
} 