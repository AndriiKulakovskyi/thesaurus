import studiesData from "./studies.json";
import tablesEaspergerData from "./tablesEasperger.json";
import tablesEbipolarData from "./tablesEbipolar.json";
import tablesEdepression from "./tablesEdepression.json";
import tablesEschizo from "./tablesEschizo.json";
import projectsData from "./projects.json";

import {
  StudyInfo,
  TableInfo,
  ExtractionRequest,
  ExtractionResponse,
  Project,
} from "../lib/api";

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

// Fetch all projects
export const fetchDummyProjects = (): Project[] => {
  return projectsData;
};

// Fetch all studies
export const fetchDummyStudies = (): StudyInfo[] => {
  return studiesData;
};

// Fetch tables for a specific study
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
