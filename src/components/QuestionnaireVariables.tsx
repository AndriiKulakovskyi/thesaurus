import React, { useState, useEffect } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { fetchQuestionnaires } from "../lib/api";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

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
  // With the updated getQuestionnaireId function in DatasetDetail,
  // the questionnaireId should already be the correct table name
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true);
        
        // Fetch all questionnaires (tables) for this dataset (schema)
        const questionnaires = await fetchQuestionnaires(datasetId);
        
        // Find the specific questionnaire we need using the table name from the ID
        const tableName = getTableNameFromId(questionnaireId);
        console.log('Extracted table name:', tableName);
        console.log('Looking for table in questionnaires:', questionnaires.map(q => q.form.nomTable));
        
        // Try to find an exact match first
        let found = questionnaires.find(q => q.form.nomTable === tableName);
        
        // If no exact match, try a more flexible match (case insensitive or partial)
        if (!found && questionnaires.length > 0) {
          found = questionnaires.find(q => {
            // Try to match without being case sensitive
            return q.form.nomTable.toLowerCase() === tableName.toLowerCase();
          });
          
          // If still not found, try to match by the end of the table name (which might include schema)
          if (!found) {
            found = questionnaires.find(q => {
              return tableName.endsWith(q.form.nomTable) || q.form.nomTable.endsWith(tableName);
            });
          }
          
          // Last resort: try to match by the short table name
          if (!found && tableName.includes('.')) {
            const shortTableName = tableName.split('.').pop() || '';
            found = questionnaires.find(q => {
              const qShortName = q.form.nomTable.split('.').pop() || '';
              return qShortName === shortTableName;
            });
          }
        }
        
        if (found) {
          console.log('Found matching questionnaire:', found.form.nomTable);
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
  
  // Filter columns based on search query
  const filteredColumns = searchQuery.trim() === '' 
    ? columns 
    : columns.filter((column: any) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          column.variable_name.toLowerCase().includes(searchLower) ||
          column.description.toLowerCase().includes(searchLower)
        );
      });

  // Select all visible variables function
  const handleSelectAllVisible = (select: boolean) => {
    if (select) {
      // Create a map of existing selected variables for faster lookup
      const existingSelections = new Map(
        selectedVariables.map(v => [v.name, v.description])
      );
      
      // Add all filtered columns that aren't already selected
      const newSelections = [...selectedVariables];
      filteredColumns.forEach((column: any) => {
        if (!existingSelections.has(column.variable_name)) {
          newSelections.push({
            name: column.variable_name,
            description: column.description
          });
        }
      });
      
      setSelectedVariables(newSelections);
      
      // Notify parent component of the change
      onSelectionChange({
        datasetId,
        questionnaireId,
        formName: questionnaire?.form.nomFormulaire || "",
        selectedVariables: newSelections,
      });
    } else {
      // Create a set of variable names that are currently filtered/visible
      const filteredVariableNames = new Set(
        filteredColumns.map((column: any) => column.variable_name)
      );
      
      // Keep only variables that aren't in the filtered list
      const newSelections = selectedVariables.filter(
        variable => !filteredVariableNames.has(variable.name)
      );
      
      setSelectedVariables(newSelections);
      
      // Notify parent component of the change
      onSelectionChange({
        datasetId,
        questionnaireId,
        formName: questionnaire?.form.nomFormulaire || "",
        selectedVariables: newSelections,
      });
    }
  };

  const allVisibleSelected = filteredColumns.length > 0 && 
    filteredColumns.every((column: any) => 
      selectedVariables.some(v => v.name === column.variable_name)
    );

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
        <div className="mb-4 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search variables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <Badge className="absolute right-2 top-2 bg-blue-100 text-blue-800 font-medium">
                {filteredColumns.length} results
              </Badge>
            )}
          </div>
          <div className="flex items-center">
            <Checkbox 
              id="select-all" 
              checked={allVisibleSelected} 
              onCheckedChange={(checked) => handleSelectAllVisible(!!checked)} 
              className="h-4 w-4 mr-2"
            />
            <Label htmlFor="select-all" className="text-sm cursor-pointer whitespace-nowrap">
              {allVisibleSelected ? "Deselect all" : "Select all"}
            </Label>
          </div>
        </div>

        <div className="mb-2 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <Badge variant="outline" className="mr-2 font-normal">
              {selectedVariables.length} selected
            </Badge>
            of {columns.length} total variables
          </div>
        </div>

        {filteredColumns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No variables match your search</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] sm:h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              {filteredColumns.map((column: any, index: number) => {
                const isSelected = selectedVariables.some(
                  (variable) => variable.name === column.variable_name
                );
                return (
                  <div
                    key={index}
                    className={`flex items-center py-1.5 px-3 rounded-md transition-colors duration-200 ${
                      isSelected 
                        ? "bg-blue-50 border border-blue-200" 
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <Checkbox
                      id={`${questionnaire.form.nomFormulaire}-${column.variable_name}`}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleVariableToggle(
                          column.variable_name,
                          column.description,
                          !!checked,
                        )
                      }
                      className="h-4 w-4 mr-2"
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`${questionnaire.form.nomFormulaire}-${column.variable_name}`}
                        className={`text-sm font-medium cursor-pointer truncate block ${
                          isSelected ? "text-blue-700" : "text-gray-700"
                        }`}
                        title={column.description}
                      >
                        {column.description}
                      </Label>
                      <p className="text-xs text-gray-500 truncate" title={column.variable_name}>
                        {column.variable_name}
                      </p>
                    </div>
                    {column.primary_key && (
                      <Badge variant="outline" className="ml-1 text-xs px-1 py-0 h-4 bg-amber-50 text-amber-700">
                        PK
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionnaireVariables;
