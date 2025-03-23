import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Check, X, Edit2, ChevronRight, Loader2 } from "lucide-react";

interface VariableSelectionSummaryProps {
  selections: {
    datasetId: string;
    questionnaireId: string;
    formName: string;
    selectedVariables: { name: string; description: string }[];
  }[];
  onFinalize: () => void;
  onClear: () => void;
  onEdit?: (questionnaireId: string) => void;
  isSubmitting?: boolean;
}

const VariableSelectionSummary = ({
  selections,
  onFinalize,
  onClear,
  onEdit,
  isSubmitting = false,
}: VariableSelectionSummaryProps) => {
  // Count total selected variables across all questionnaires
  const totalSelectedVariables = selections.reduce(
    (total, selection) => total + selection.selectedVariables.length,
    0,
  );

  // Filter out questionnaires with no selections
  const nonEmptySelections = selections.filter(
    (selection) => selection.selectedVariables.length > 0,
  );

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-800">
            Selected Variables Summary
          </CardTitle>
          <Badge
            variant="outline"
            className={`${totalSelectedVariables > 0 ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}
          >
            {totalSelectedVariables} variables selected
          </Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        {totalSelectedVariables === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p>No variables selected yet.</p>
            <p className="text-sm mt-2">
              Select variables from the questionnaires to see them here.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[350px] sm:h-[500px] pr-4">
              <div className="space-y-4 sm:space-y-6">
                {nonEmptySelections.map((selection, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800">
                        {selection.formName}{" "}
                        <span className="text-sm text-gray-500">
                          ({selection.selectedVariables.length} variables)
                        </span>
                      </h3>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => onEdit(selection.questionnaireId)}
                          disabled={isSubmitting}
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100 shadow-sm">
                      {selection.selectedVariables.map((variable, varIndex) => (
                        <div
                          key={varIndex}
                          className="flex items-center space-x-2 text-sm p-2 hover:bg-white rounded-md transition-colors duration-200"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                          <div>
                            <span className="font-medium">
                              {variable.name}:
                            </span>{" "}
                            {variable.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center mt-6 sm:mt-8">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={onClear}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onFinalize}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Request Data <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VariableSelectionSummary;
