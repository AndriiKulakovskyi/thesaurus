import { API_BASE_URL } from "./constants";
import studiesData from "../dummyData/studies.json";
import tablesEaspergerData from "../dummyData/tablesEasperger.json";
import tablesEbipolarData from "../dummyData/tablesEbipolar.json";
import tablesEdepression from "../dummyData/tablesEdepression.json";
import tablesEschizo from "../dummyData/tablesEschizo.json";
import projectsData from "../dummyData/projects.json";

// Types and interfaces
export interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  imageUrl: string;
  institution?: string;
  principalInvestigator?: string;
  lastUpdated: string;
  categories?: string[];
  objectives?: string;
  publications?: Array<{
    title: string;
    url?: string;
  }>;
  statistics?: Array<{
    label: string;
    value: string | number;
  }>;
  fundingInfo?: string;
  contactEmail?: string;
  datasets: Database[];
}

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
  projectId?: string;
  recordCount?: number;
  lastUpdated?: string;
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

// Interface to map schema names to their corresponding table data
interface TableDataMap {
  [key: string]: any[];
}

// Map schema names to their corresponding table data files
const tableDataMap: TableDataMap = {
  _prod_clean_easperger: tablesEaspergerData,
  _prod_clean_ebipolar: tablesEbipolarData,
  _prod_clean_edepression: tablesEdepression,
  _prod_clean_eschizo: tablesEschizo,
};

// Function to test if API is available
export const isApiAvailable = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/api/v1/studies`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn("API is not available, using dummy data", error);
    return false;
  }
};

// Dummy data functions
// =====================

// Fetch all projects from dummy data
export const fetchDummyProjects = (): Project[] => {
  return projectsData;
};

// Fetch all studies from dummy data
export const fetchDummyStudies = (): StudyInfo[] => {
  return studiesData;
};

// Fetch tables for a specific study from dummy data
export const fetchDummyTables = (schema: string): TableInfo[] => {
  if (tableDataMap[schema]) {
    return tableDataMap[schema];
  }

  // If the schema doesn't exist, return an empty array
  return [];
};

// Generate dummy column data for a specific table
export const fetchDummyColumns = (
  schema: string,
  tableName: string,
): { columns: string[] } => {
  const tables = fetchDummyTables(schema);
  const table = tables.find((t) => t.name === tableName);

  if (table) {
    return { columns: table.columns };
  }

  // If the table doesn't exist, return an empty array
  return { columns: [] };
};

// Process a dummy extraction request
export const processDummyExtraction = (
  request: ExtractionRequest,
): ExtractionResponse => {
  // Calculate the number of variables selected
  const totalVariables = request.selections.reduce((total, selection) => {
    return total + selection.variables.length;
  }, 0);

  // Create a dummy response
  return {
    status: "success",
    message: "Data extraction completed successfully with dummy data",
    request: request,
    dataset: request.datasetId,
    selections_count: request.selections.length,
    total_variables: totalVariables,
  };
};

// API endpoint functions
// ======================

// Fetch projects
export async function fetchProjects(): Promise<Project[]> {
  try {
    // Check if API is available
    if (await isApiAvailable()) {
      // In a real implementation, we would fetch from the API
      // For now, we'll use dummy data
      return fetchDummyProjects();
    } else {
      // Use dummy data
      console.log("Using dummy projects data");
      return fetchDummyProjects();
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    return fetchDummyProjects();
  }
}

// Fetch all databases/studies
export async function fetchDatabases(): Promise<Database[]> {
  try {
    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
      const response = await fetch(`${API_BASE_URL}/api/v1/studies`);
      if (!response.ok) {
        throw new Error(`Failed to fetch studies: ${response.statusText}`);
      }
      const studies = (await response.json()) as StudyInfo[];

      // Transform study info into our Database interface
      return studies.map((study) => ({
        id: study.schema,
        title: study.name,
        description: study.description,
        record_count: study.metadata.patient_count || 0,
        last_updated: new Date().toISOString(),
        metadata: study.metadata,
      }));
    } else {
      // Use dummy data
      console.log("Using dummy studies data");
      const studies = fetchDummyStudies();

      // Transform study info into our Database interface
      return studies.map((study) => ({
        id: study.schema,
        title: study.name,
        description: study.description,
        record_count: study.metadata.patient_count || 0,
        last_updated: new Date().toISOString(),
        metadata: study.metadata,
      }));
    }
  } catch (error) {
    console.error("Error fetching databases:", error);

    // Fallback to dummy data
    console.log("Falling back to dummy studies data");
    const studies = fetchDummyStudies();

    // Transform study info into our Database interface
    return studies.map((study) => ({
      id: study.schema,
      title: study.name,
      description: study.description,
      record_count: study.metadata.patient_count || 0,
      last_updated: new Date().toISOString(),
      metadata: study.metadata,
    }));
  }
}

// Fetch a single database/study by ID
export async function fetchDatabase(datasetId: string): Promise<Database> {
  try {
    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
      const response = await fetch(`${API_BASE_URL}/api/v1/studies`);
      if (!response.ok) {
        throw new Error(`Failed to fetch studies: ${response.statusText}`);
      }

      const studies = (await response.json()) as StudyInfo[];
      const study = studies.find((s) => s.schema === datasetId);

      if (!study) {
        throw new Error(`Study with ID ${datasetId} not found`);
      }

      // Get table count for this schema
      const tablesResponse = await fetch(
        `${API_BASE_URL}/api/v1/studies/${datasetId}/tables`,
      );
      if (!tablesResponse.ok) {
        throw new Error(
          `Failed to fetch tables for ${datasetId}: ${tablesResponse.statusText}`,
        );
      }

      const tables = (await tablesResponse.json()) as TableInfo[];

      // Create database object from study and tables data
      return {
        id: datasetId,
        title: study.name,
        description: study.description,
        record_count: study.metadata.patient_count || 0,
        last_updated: new Date().toISOString(),
        metadata: study.metadata,
      };
    } else {
      // Use dummy data
      console.log("Using dummy database data");
      const studies = fetchDummyStudies();
      const study = studies.find((s) => s.schema === datasetId);

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
        metadata: study.metadata,
      };
    }
  } catch (error) {
    console.error("Error fetching database:", error);

    // Fallback to dummy data
    console.log("Falling back to dummy database data");
    const studies = fetchDummyStudies();
    const study = studies.find((s) => s.schema === datasetId);

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
      metadata: study.metadata,
    };
  }
}

// Fetch questionnaires for a dataset
export async function fetchQuestionnaires(datasetId: string): Promise<any[]> {
  try {
    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
      const response = await fetch(
        `${API_BASE_URL}/api/v1/studies/${datasetId}/tables`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch tables for ${datasetId}: ${response.statusText}`,
        );
      }

      const tables = (await response.json()) as TableInfo[];

      // Transform tables into questionnaire format
      return Promise.all(
        tables.map(async (table) => {
          // Fetch columns for this table
          const columnsResponse = await fetch(
            `${API_BASE_URL}/api/v1/studies/${datasetId}/tables/${table.name}/columns`,
          );
          if (!columnsResponse.ok) {
            throw new Error(
              `Failed to fetch columns for ${table.name}: ${columnsResponse.statusText}`,
            );
          }

          const columnsData = await columnsResponse.json();
          const columns = columnsData.columns || [];

          // Format the data to match frontend expected structure
          return {
            form: {
              nomFormulaire: table.name,
              nomTable: `${datasetId}.${table.name}`,
            },
            fields: [
              columns.map((column) => ({
                description: column,
                variable_name: column,
                data_type: "string", // Default to string since we don't have type info
                possible_answers: {},
              })),
            ],
          };
        }),
      );
    } else {
      // Use dummy data
      console.log("Using dummy tables data");
      const tables = fetchDummyTables(datasetId);

      // Transform tables into questionnaire format
      return Promise.all(
        tables.map(async (table) => {
          // Get columns from dummy data
          const columnsData = fetchDummyColumns(datasetId, table.name);
          const columns = columnsData.columns || [];

          // Format the data to match frontend expected structure
          return {
            form: {
              nomFormulaire: table.name,
              nomTable: `${datasetId}.${table.name}`,
            },
            fields: [
              columns.map((column) => ({
                description: column,
                variable_name: column,
                data_type: "string", // Default to string since we don't have type info
                possible_answers: {},
              })),
            ],
          };
        }),
      );
    }
  } catch (error) {
    console.error("Error fetching questionnaires:", error);

    // Fallback to dummy data
    console.log("Falling back to dummy tables data");
    const tables = fetchDummyTables(datasetId);

    // Transform tables into questionnaire format
    return Promise.all(
      tables.map(async (table) => {
        // Get columns from dummy data
        const columnsData = fetchDummyColumns(datasetId, table.name);
        const columns = columnsData.columns || [];

        // Format the data to match frontend expected structure
        return {
          form: {
            nomFormulaire: table.name,
            nomTable: `${datasetId}.${table.name}`,
          },
          fields: [
            columns.map((column) => ({
              description: column,
              variable_name: column,
              data_type: "string", // Default to string since we don't have type info
              possible_answers: {},
            })),
          ],
        };
      }),
    );
  }
}

// Submit an extraction request
export async function submitExtraction(
  request: ExtractionRequest,
): Promise<ExtractionResponse> {
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
        throw new Error(
          `Missing questionnaireId in selection at index ${index}`,
        );
      }
      if (!selection.variables || !Array.isArray(selection.variables)) {
        throw new Error(
          `Missing or invalid variables in selection at index ${index}`,
        );
      }
    });

    // Check if API is available
    if (await isApiAvailable()) {
      // Use real API
      const response = await fetch(`${API_BASE_URL}/api/v1/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // Try to parse error response
        const errorData = await response.json().catch(() => null);
        console.error("Extraction API error:", errorData);
        throw new Error(
          errorData?.detail ||
            `Extraction request failed: ${response.statusText}`,
        );
      }

      // Process the response
      return {
        status: "success",
        message: "Data extraction completed successfully",
        request: request,
        dataset: request.datasetId,
        selections_count: request.selections.length,
        total_variables: request.selections.reduce(
          (total, selection) => total + selection.variables.length,
          0,
        ),
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
