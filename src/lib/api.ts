import { API_BASE_URL } from './constants';

// Types matching backend schemas
export interface Database {
  id: string;
  questionnaires_models: string[];
  questionnaires_folder: string;
  title: string;
  description: string;
  record_count: number;
  last_updated: string;
}

export interface Questionnaire {
  form: {
    nomFormulaire: string;
    nomTable: string;
  };
  fields: Array<Array<{
    description: string;
    variable_name: string;
    possible_answers: Record<string, string>;
    data_type: string;
  }>>;
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

// API functions
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDatabases(): Promise<Database[]> {
  const response = await fetch(`${API_BASE_URL}/api/databases`);
  if (!response.ok) {
    throw new Error(`Failed to fetch databases: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDatabase(datasetId: string): Promise<Database> {
  const response = await fetch(`${API_BASE_URL}/api/databases/${datasetId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch database ${datasetId}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchQuestionnaires(datasetId: string): Promise<Questionnaire[]> {
  const response = await fetch(`${API_BASE_URL}/api/databases/${datasetId}/questionnaires`);
  if (!response.ok) {
    throw new Error(`Failed to fetch questionnaires for dataset ${datasetId}: ${response.statusText}`);
  }
  return response.json();
}

export async function submitExtraction(request: ExtractionRequest): Promise<ExtractionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Extraction request failed: ${response.statusText}`
    );
  }
  
  return response.json();
} 