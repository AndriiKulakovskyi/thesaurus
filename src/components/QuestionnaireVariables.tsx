import React, { useState, useEffect } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Questionnaire, fetchQuestionnaires } from "../lib/api";

interface QuestionnaireField {
  description: string;
  variable_name: string;
  possible_answers: Record<string, string>;
  data_type: string;
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

// Helper to get questionnaire identifier - must match the format in DatasetDetail
const getQuestionnaireId = (questionnaire: Questionnaire): string => {
  const formName = questionnaire.form.nomFormulaire;
  return `${formName.replace(".json", "")}_${questionnaire.form.nomTable}`;
};

const QuestionnaireVariables = ({
  questionnaireId,
  datasetId,
  onSelectionChange,
  initialSelections = [],
}: QuestionnaireVariablesProps) => {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariables, setSelectedVariables] =
    useState<{ name: string; description: string }[]>(initialSelections);

  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true);
        
        // Fetch all questionnaires for this dataset
        const questionnaires = await fetchQuestionnaires(datasetId);
        
        // Find the specific questionnaire we need using the consistent ID format
        const found = questionnaires.find(q => {
          return getQuestionnaireId(q) === questionnaireId;
        });
        
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

  // Flatten the fields array for easier rendering
  const flattenedFields = questionnaire.fields.flat();

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-800">
            {questionnaire.form.nomFormulaire}
            <span className="text-xs font-normal text-gray-500 block mt-1">ID: {questionnaireId}</span>
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {flattenedFields.length} variables
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
            {flattenedFields.map((field, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-colors duration-200 mb-2 border border-transparent hover:border-blue-100"
              >
                <Checkbox
                  id={`${questionnaire.form.nomFormulaire}-${field.variable_name}`}
                  checked={selectedVariables.some(
                    (variable) => variable.name === field.variable_name,
                  )}
                  onCheckedChange={(checked) =>
                    handleVariableToggle(
                      field.variable_name,
                      field.description,
                      !!checked,
                    )
                  }
                  className="h-4 w-4 sm:h-5 sm:w-5"
                />
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor={`${questionnaire.form.nomFormulaire}-${field.variable_name}`}
                    className="font-medium text-gray-700 cursor-pointer"
                  >
                    {field.description}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {field.variable_name}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {field.data_type}
                    </Badge>
                  </div>
                  {Object.keys(field.possible_answers).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <p className="font-medium mb-1">Possible answers:</p>
                      <ul className="space-y-1 pl-2">
                        {Object.entries(field.possible_answers).map(
                          ([key, value]) => (
                            <li key={key}>
                              <span className="font-medium">{key}:</span>{" "}
                              {value}
                            </li>
                          ),
                        )}
                      </ul>
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
