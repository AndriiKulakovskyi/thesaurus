import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Database,
  Calendar,
  Check,
  X,
  ChevronLeft,
} from "lucide-react";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import QuestionnaireVariables from "./QuestionnaireVariables";
import VariableSelectionSummary from "./VariableSelectionSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "./ui/use-toast";
import BreadcrumbNav from "./BreadcrumbNav";
import FloatingSelectionIndicator from "./FloatingSelectionIndicator";

interface Dataset {
  id: string;
  title: string;
  description: string;
  record_count: number;
  last_updated: string;
  questionnaires_models: string[];
  questionnaires_folder: string;
}

interface VariableSelection {
  datasetId: string;
  questionnaireId: string;
  formName: string;
  selectedVariables: { name: string; description: string }[];
}

const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<
    string | null
  >(null);
  const [variableSelections, setVariableSelections] = useState<
    VariableSelection[]
  >([]);
  const [activeTab, setActiveTab] = useState<string>("questionnaires");

  useEffect(() => {
    // Simulate API call to fetch dataset details
    const fetchDataset = async () => {
      try {
        // In a real application, this would be an API call
        // For now, we'll simulate a delay and return mock data
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock data based on the dataset ID
        const mockDatasets: Record<string, Dataset> = {
          ebipolar: {
            id: "ebipolar",
            questionnaires_models: ["1.json", "2.json", "3.json"],
            questionnaires_folder: "data/questionnaires/ebipolar",
            title: "Clinical Assessment Database",
            description:
              "Structured clinical data including DSM diagnoses, mood ratings, and pharmacotherapy records for bipolar patients.",
            record_count: 250,
            last_updated: "2023-10-12",
          },
          eschizo: {
            id: "eschizo",
            questionnaires_models: ["1.json"],
            questionnaires_folder: "data/questionnaires/eschizo",
            title: "Neurocognitive Performance Database",
            description:
              "Results from cognitive tasks (working memory, attention, executive function) for schizophrenia participants.",
            record_count: 180,
            last_updated: "2023-08-30",
          },
          edepression: {
            id: "edepression",
            questionnaires_models: ["1.json", "2.json"],
            questionnaires_folder: "data/questionnaires/edepression",
            title: "Depression Assessment Database",
            description:
              "Comprehensive depression scales, symptom tracking, and treatment response data for major depressive disorder research.",
            record_count: 320,
            last_updated: "2023-11-05",
          },
          eanxiety: {
            id: "eanxiety",
            questionnaires_models: ["1.json", "2.json"],
            questionnaires_folder: "data/questionnaires/eanxiety",
            title: "Anxiety Disorders Database",
            description:
              "Anxiety assessment scales, physiological measurements, and behavioral observations for anxiety disorder research.",
            record_count: 215,
            last_updated: "2023-09-18",
          },
        };

        if (id && mockDatasets[id]) {
          setDataset(mockDatasets[id]);
        } else {
          setError("Dataset not found");
        }
        setLoading(false);
      } catch (err) {
        setError("Failed to load dataset details. Please try again later.");
        setLoading(false);
        console.error("Error fetching dataset:", err);
      }
    };

    if (id) {
      fetchDataset();
    }
  }, [id]);

  const handleBackClick = () => {
    navigate("/");
  };

  const handleQuestionnaireClick = (questionnaireId: string) => {
    setSelectedQuestionnaire(questionnaireId);
    setActiveTab("variables");
  };

  const handleBackToQuestionnaires = () => {
    setSelectedQuestionnaire(null);
    setActiveTab("questionnaires");
  };

  const handleVariableSelectionChange = (selection: VariableSelection) => {
    // Update the selections array, replacing any existing selection for this questionnaire
    const updatedSelections = variableSelections.filter(
      (s) => s.questionnaireId !== selection.questionnaireId,
    );

    // Only add the selection if there are selected variables
    if (selection.selectedVariables.length > 0) {
      updatedSelections.push(selection);

      // Show toast notification for variable selection
      toast({
        title: "Variables Selected",
        description: `${selection.selectedVariables.length} variables selected from ${selection.formName}`,
        variant: "success",
      });
    }

    setVariableSelections(updatedSelections);
  };

  const handleEditSelection = (questionnaireId: string) => {
    // Set the selected questionnaire and switch to the variables tab
    setSelectedQuestionnaire(questionnaireId);
    setActiveTab("variables");
  };

  const handleClearSelections = () => {
    setVariableSelections([]);
    toast({
      title: "Selections Cleared",
      description: "All variable selections have been cleared",
      variant: "default",
    });
  };

  const handleFinalizeSelections = () => {
    // Print the selected variables to the console
    console.log("Selected Variables:", variableSelections);

    // Create a formatted output for the console
    const output = {
      datasetId: id,
      datasetTitle: dataset?.title,
      selections: variableSelections.map((selection) => ({
        formName: selection.formName,
        variables: selection.selectedVariables.map((v) => ({
          name: v.name,
          description: v.description,
        })),
      })),
    };

    console.log("FINAL SELECTION:", JSON.stringify(output, null, 2));

    // Show a toast notification instead of an alert
    toast({
      title: "Selection Finalized",
      description: `${totalSelectedVariables} variables have been extracted successfully`,
      variant: "success",
    });
  };

  // Get the current selection for the active questionnaire (if any)
  const getCurrentQuestionnaireSelection = () => {
    if (!selectedQuestionnaire) return [];

    const selection = variableSelections.find(
      (s) => s.questionnaireId === selectedQuestionnaire,
    );

    return selection?.selectedVariables || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Datasets
        </Button>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full max-w-2xl mb-6" />
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="mb-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Datasets
        </Button>

        <div className="max-w-4xl mx-auto bg-red-50 rounded-lg p-6 text-center">
          <p className="text-red-600 text-lg">{error || "Dataset not found"}</p>
          <Button
            className="mt-4 bg-red-600 hover:bg-red-700"
            onClick={handleBackClick}
          >
            Return to Dataset List
          </Button>
        </div>
      </div>
    );
  }

  // Count total selected variables
  const totalSelectedVariables = variableSelections.reduce(
    (total, selection) => total + selection.selectedVariables.length,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {activeTab === "questionnaires" && totalSelectedVariables > 0 && (
        <FloatingSelectionIndicator
          count={totalSelectedVariables}
          onClick={() => setActiveTab("variables")}
        />
      )}
      <div className="sticky top-0 z-10 bg-gray-50 py-2 mb-2 sm:mb-4">
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 self-start"
            size="sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Back to Datasets</span>
          </Button>

          <BreadcrumbNav
            items={[
              { label: "Datasets", href: "/" },
              { label: dataset?.title || "Dataset Details" },
            ]}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {dataset.title}
            </h1>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 self-start"
            >
              <Database className="h-3 w-3 mr-1" />
              {dataset.record_count} records
            </Badge>
          </div>

          <p className="text-gray-600 mb-6">{dataset.description}</p>

          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Calendar className="h-4 w-4 mr-1" />
            Last updated: {dataset.last_updated}
          </div>

          <Separator className="my-6" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questionnaires" className="text-sm">
                Questionnaires
              </TabsTrigger>
              <TabsTrigger
                value="variables"
                className="text-sm"
                disabled={!selectedQuestionnaire}
              >
                Variable Selection
                {totalSelectedVariables > 0 && (
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                    {totalSelectedVariables}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="questionnaires"
            className="p-3 sm:p-6 pt-3 sm:pt-4"
          >
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
                Available Questionnaires
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                This dataset contains the following questionnaires that you can
                explore and extract variables from:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {dataset.questionnaires_models.map((questionnaire) => {
                  // Check if this questionnaire has any selected variables
                  const selection = variableSelections.find(
                    (s) =>
                      s.questionnaireId === questionnaire.replace(".json", ""),
                  );
                  const hasSelections =
                    selection && selection.selectedVariables.length > 0;

                  return (
                    <div
                      key={questionnaire}
                      className={`border rounded-md p-4 transition-colors cursor-pointer ${hasSelections ? "border-green-300 bg-green-50 hover:bg-green-100" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"}`}
                      onClick={() =>
                        handleQuestionnaireClick(
                          questionnaire.replace(".json", ""),
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-800">
                          Questionnaire {questionnaire.replace(".json", "")}
                        </h3>
                        {hasSelections && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            {selection.selectedVariables.length} selected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Click to view variables and select for extraction
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {totalSelectedVariables > 0 && (
              <div className="flex justify-end mt-6">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setActiveTab("variables")}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Review Selected Variables ({totalSelectedVariables})
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="variables" className="p-6 pt-4">
            <div className="flex flex-col space-y-6">
              {selectedQuestionnaire ? (
                <>
                  <div className="flex items-center mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 -ml-2"
                      onClick={handleBackToQuestionnaires}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back to Questionnaires
                    </Button>
                  </div>

                  <div className="animate-fadeIn">
                    <QuestionnaireVariables
                      questionnaireId={selectedQuestionnaire}
                      datasetId={dataset.id}
                      onSelectionChange={handleVariableSelectionChange}
                      initialSelections={getCurrentQuestionnaireSelection()}
                    />
                  </div>
                </>
              ) : (
                <VariableSelectionSummary
                  selections={variableSelections}
                  onFinalize={handleFinalizeSelections}
                  onClear={handleClearSelections}
                  onEdit={handleEditSelection}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DatasetDetail;
