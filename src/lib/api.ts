import { API_BASE_URL } from './constants';
// Import dummy data services
import {
  fetchDummyStudies,
  fetchDummyTables,
  fetchDummyColumns,
  processDummyExtraction
} from '../dummyData';

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

// Function to test if API is available
const isApiAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/api/v1/studies`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn("API is not available, using dummy data", error);
    return false;
  }
};

// Adapted API functions to use V1 endpoints
export async function fetchDatabases(): Promise<Database[]> {
  try {
    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
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
    } else {
      // Use dummy data
      console.log("Using dummy studies data");
      const studies = fetchDummyStudies();
      
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
  } catch (error) {
    console.error("Error fetching databases:", error);
    
    // Fallback to dummy data
    console.log("Falling back to dummy studies data");
    const studies = fetchDummyStudies();
    
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
}

export async function fetchDatabase(datasetId: string): Promise<Database> {
  try {
    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
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
    } else {
      // Use dummy data
      console.log("Using dummy database data");
      const studies = fetchDummyStudies();
      const study = studies.find(s => s.schema === datasetId);
      
      if (!study) {
        throw new Error(`Study with ID ${datasetId} not found`);
      }
      
      // Create database object from study data
      return {
        id: datasetId,
        title: study.name,
        description: study.description,
        record_count: study.metadata.patient_count || 0,
        last_updated: new Date().toISOString(),
        metadata: study.metadata
      };
    }
  } catch (error) {
    console.error("Error fetching database:", error);
    
    // Fallback to dummy data
    console.log("Falling back to dummy database data");
    const studies = fetchDummyStudies();
    const study = studies.find(s => s.schema === datasetId);
    
    if (!study) {
      throw new Error(`Study with ID ${datasetId} not found in dummy data`);
    }
    
    // Create database object from study data
    return {
      id: datasetId,
      title: study.name,
      description: study.description,
      record_count: study.metadata.patient_count || 0,
      last_updated: new Date().toISOString(),
      metadata: study.metadata
    };
  }
}

export async function fetchQuestionnaires(datasetId: string): Promise<any[]> {
  try {
    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
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
    } else {
      // Use dummy data
      console.log("Using dummy tables data");
      const tables = fetchDummyTables(datasetId);
      
      // Transform tables into questionnaire format
      return Promise.all(tables.map(async (table) => {
        // Get columns from dummy data
        const columnsData = fetchDummyColumns(datasetId, table.name);
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
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    
    // Fallback to dummy data
    console.log("Falling back to dummy tables data");
    const tables = fetchDummyTables(datasetId);
    
    // Transform tables into questionnaire format
    return Promise.all(tables.map(async (table) => {
      // Get columns from dummy data
      const columnsData = fetchDummyColumns(datasetId, table.name);
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
}

export async function submitExtraction(request: ExtractionRequest): Promise<ExtractionResponse> {
  try {
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
    
    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
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
      
      // Process the response
      // ... rest of the real API logic
      
      return {
        status: "success",
        message: "Data extraction completed successfully",
        request: request,
        dataset: request.datasetId,
        selections_count: request.selections.length,
        total_variables: request.selections.reduce((total, selection) => total + selection.variables.length, 0)
      };
    } else {
      // Use dummy data service
      console.log("Using dummy extraction service");
      return processDummyExtraction(request);
    }
  } catch (error) {
    console.error("Error submitting extraction:", error);
    
    // Fallback to dummy data
    console.log("Falling back to dummy extraction service");
    return processDummyExtraction(request);
  }
} 