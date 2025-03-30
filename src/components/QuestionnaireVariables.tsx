import React, { useState, useEffect } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { fetchQuestionnaires } from "../lib/api";

interface ColumnField {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  default: string | null;
}

interface QuestionnaireVariablesProps {
  questionnaireId: string;
  datasetId: string;
  onSelectionChange: (selections: {
    datasetId: string;
    questionnaireId: string;
    formName: string;
    selectedVariables: { name: string; description: string }[];
  }) => void;
  initialSelections?: { name: string; description: string }[];
}

// Helper to extract the table name from questionnaire ID
const getTableNameFromId = (questionnaireId: string): string => {
  // The questionnaire ID should be in the format: shortName_schema.tableName
  const parts = questionnaireId.split('_');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return questionnaireId;
};

const QuestionnaireVariables = ({
  questionnaireId,
  datasetId,
  onSelectionChange,
  initialSelections = [],
}: QuestionnaireVariablesProps) => {
  const [questionnaire, setQuestionnaire] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariables, setSelectedVariables] =
    useState<{ name: string; description: string }[]>(initialSelections);

  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true);
        
        // Fetch all questionnaires (tables) for this dataset (schema)
        const questionnaires = await fetchQuestionnaires(datasetId);
        
        // Find the specific questionnaire we need using the table name from the ID
        const tableName = getTableNameFromId(questionnaireId);
        
        const found = questionnaires.find(q => q.form.nomTable === tableName);
        
        if (found) {
          setQuestionnaire(found);
        } else {
          throw new Error(`Questionnaire ${questionnaireId} not found in dataset ${datasetId}`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching questionnaire:", err);
        setError(err instanceof Error ? err.message : "Failed to load questionnaire data");
        setLoading(false);
      }
    };

    loadQuestionnaire();
  }, [datasetId, questionnaireId]);

  const handleVariableToggle = (
    variableName: string,
    description: string,
    isChecked: boolean | string,
  ) => {
    // Convert to boolean if it's a string
    const checked =
      typeof isChecked === "string" ? isChecked === "true" : !!isChecked;
    let newSelectedVariables;

    if (checked) {
      // Add to selected variables if not already selected
      if (
        !selectedVariables.some((variable) => variable.name === variableName)
      ) {
        newSelectedVariables = [
          ...selectedVariables,
          { name: variableName, description },
        ];
      } else {
        newSelectedVariables = selectedVariables;
      }
    } else {
      // Remove from selected variables
      newSelectedVariables = selectedVariables.filter(
        (variable) => variable.name !== variableName,
      );
    }

    setSelectedVariables(newSelectedVariables);

    // Notify parent component of the change
    onSelectionChange({
      datasetId,
      questionnaireId,
      formName: questionnaire?.form.nomFormulaire || "",
      selectedVariables: newSelectedVariables,
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading questionnaire variables...</p>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error || "Questionnaire data not available"}</p>
      </div>
    );
  }

  // Get the flattened fields (columns) from the questionnaire
  const columns = questionnaire.fields[0];

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-800">
            {questionnaire.form.nomFormulaire}
            <span className="text-xs font-normal text-gray-500 block mt-1">ID: {questionnaireId}</span>
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {columns.length} variables
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          Table: {questionnaire.form.nomTable}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <ScrollArea className="h-[400px] sm:h-[600px] pr-4">
          <div className="space-y-3 sm:space-y-4">
            {columns.map((column: any, index: number) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-colors duration-200 mb-2 border border-transparent hover:border-blue-100"
              >
                <Checkbox
                  id={`${questionnaire.form.nomFormulaire}-${column.variable_name}`}
                  checked={selectedVariables.some(
                    (variable) => variable.name === column.variable_name,
                  )}
                  onCheckedChange={(checked) =>
                    handleVariableToggle(
                      column.variable_name,
                      column.description,
                      !!checked,
                    )
                  }
                  className="h-4 w-4 sm:h-5 sm:w-5"
                />
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor={`${questionnaire.form.nomFormulaire}-${column.variable_name}`}
                    className="font-medium text-gray-700 cursor-pointer"
                  >
                    {column.description}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {column.variable_name}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {column.data_type}
                    </Badge>
                    {column.primary_key && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                        Primary Key
                      </Badge>
                    )}
                    {!column.nullable && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                        Required
                      </Badge>
                    )}
                  </div>
                  {column.default && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <p className="font-medium">Default: {column.default}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default QuestionnaireVariables;
