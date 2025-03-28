import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Database as DatabaseIcon,
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
import DataSelectionGuide from "./DataSelectionGuide";
import { 
  Database, 
  Questionnaire, 
  VariableSelection as ApiVariableSelection,
  ExtractionRequest,
  fetchDatabase,
  fetchQuestionnaires,
  submitExtraction
} from "../lib/api";

interface ComponentVariableSelection {
  datasetId: string;
  questionnaireId: string;
  formName: string;
  selectedVariables: { name: string; description: string }[];
}

// Helper to get questionnaire identifier
const getQuestionnaireId = (questionnaire: Questionnaire): string => {
  // Use the index in the questionnaires_models array as a more reliable ID
  // rather than just the form name which could potentially be the same
  const formName = questionnaire.form.nomFormulaire;
  // Create a unique ID from the form name and table name to ensure uniqueness
  return `${formName.replace(".json", "")}_${questionnaire.form.nomTable}`;
};

const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dataset, setDataset] = useState<Database | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<
    string | null
  >(null);
  const [variableSelections, setVariableSelections] = useState<
    ComponentVariableSelection[]
  >([]);
  const [activeTab, setActiveTab] = useState<string>("questionnaires");
  const [submitting, setSubmitting] = useState(false);
  
  // Calculate total selected variables
  const totalSelectedVariables = variableSelections.reduce(
    (total, selection) => total + selection.selectedVariables.length,
    0
  );

  // Determine the current step for the DataSelectionGuide
  const getCurrentStep = () => {
    if (
      activeTab === "variables" &&
      !selectedQuestionnaire &&
      totalSelectedVariables > 0
    ) {
      return 3; // Request Data step
    } else if (activeTab === "variables" || selectedQuestionnaire) {
      return 2; // Select Variables step
    } else {
      return 1; // Select Dataset step (already selected but showing as active)
    }
  };

  // Determine completed steps
  const getCompletedSteps = () => {
    const completed = [1]; // Dataset selection is always completed on this page

    if (totalSelectedVariables > 0 || activeTab === "variables") {
      completed.push(2); // Variables have been selected
    }

    return completed;
  };

  useEffect(() => {
    const loadDataset = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the database details
        const datasetData = await fetchDatabase(id);
        setDataset(datasetData);
        
        // Fetch questionnaires for this dataset
        const questionnairesData = await fetchQuestionnaires(id);
        setQuestionnaires(questionnairesData);
        
        // Log the questionnaire IDs to help with debugging
        console.log("Questionnaires loaded:", questionnairesData.map(q => ({
          form: q.form.nomFormulaire,
          table: q.form.nomTable,
          id: getQuestionnaireId(q)
        })));
        
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        setLoading(false);
        console.error("Error loading dataset:", err);
      }
    };

    loadDataset();
  }, [id]);

  const handleBackClick = () => {
    navigate("/");
  };

  const handleQuestionnaireClick = (questionnaireId: string) => {
    console.log("Selected questionnaire:", questionnaireId);
    setSelectedQuestionnaire(questionnaireId);
    setActiveTab("variables");
  };

  const handleBackToQuestionnaires = () => {
    setSelectedQuestionnaire(null);
    setActiveTab("questionnaires");
  };

  const handleVariableSelectionChange = (selection: ComponentVariableSelection) => {
    // Log to confirm what selection was received
    console.log("Selection received:", selection);
    
    // Update the selections array, replacing any existing selection for this questionnaire
    const updatedSelections = variableSelections.filter(
      (s) => s.questionnaireId !== selection.questionnaireId
    );
    
    // Only add the selection if there are variables selected
    if (selection.selectedVariables.length > 0) {
      updatedSelections.push(selection);
      console.log("Added selection for:", selection.questionnaireId);
    } else {
      console.log("Removed selection for:", selection.questionnaireId);
    }
    
    // Log the updated selections
    console.log("Updated selections:", updatedSelections);
    
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

  const handleFinalizeSelections = async () => {
    if (!dataset) return;
    
    // Show loading state
    setSubmitting(true);
    
    // Convert component selections to API format
    const apiSelections: ApiVariableSelection[] = variableSelections.map(selection => ({
      questionnaireId: selection.questionnaireId,
      variables: selection.selectedVariables.map(v => v.name)
    }));
    
    // Create the request object
    const extractionRequest: ExtractionRequest = {
      datasetId: dataset.id,
      selections: apiSelections
    };
    
    try {
      // Send the extraction request to the API
      const response = await submitExtraction(extractionRequest);
      
      // Show success message
      toast({
        title: "Data extraction successful",
        description: `${response.total_variables} variables extracted from ${response.selections_count} questionnaires.`,
        duration: 5000,
      });
      
      // Could navigate to a success page or download page here
      // navigate('/extract/success', { state: { response } });
      
    } catch (err) {
      // Show error message
      toast({
        title: "Data extraction failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
        duration: 5000,
      });
      console.error("Extraction error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Get the current selection for the active questionnaire (if any)
  const getCurrentQuestionnaireSelection = () => {
    if (!selectedQuestionnaire) return [];

    const selection = variableSelections.find(
      (s) => s.questionnaireId === selectedQuestionnaire,
    );

    return selection?.selectedVariables || [];
  };

  const renderQuestionnaires = () => {
    return questionnaires.map((questionnaire, index) => {
      const questionnaireId = getQuestionnaireId(questionnaire);
      // Check if this questionnaire has any selected variables
      const selection = variableSelections.find(
        (s) => s.questionnaireId === questionnaireId
      );
      const hasSelections = selection && selection.selectedVariables.length > 0;

      return (
        <div
          key={questionnaireId}
          className={`border rounded-lg p-5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
            hasSelections ? "border-green-300 bg-green-50 hover:bg-green-100" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
          }`}
          onClick={() => handleQuestionnaireClick(questionnaireId)}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-800">
              {`Questionnaire ${index + 1}: ${questionnaire.form.nomFormulaire}` || `Questionnaire ${questionnaireId}`}
            </h3>
            {hasSelections && (
              <Badge
                variant="outline"
                className="bg-green-100 border-green-300 text-green-800"
              >
                {selection?.selectedVariables.length} selected
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {questionnaire.form.nomTable || "No description available"}
          </p>
        </div>
      );
    });
  };

  const renderVariableSelectionSummary = () => {
    return (
      <VariableSelectionSummary
        selections={variableSelections}
        onFinalize={handleFinalizeSelections}
        onClear={handleClearSelections}
        onEdit={handleEditSelection}
        isSubmitting={submitting}
      />
    );
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

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 pb-20">
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

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 lg:w-72 shrink-0">
            <DataSelectionGuide
              currentStep={getCurrentStep()}
              completedSteps={getCompletedSteps()}
            />
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {dataset.title}
                </h1>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 self-start"
                >
                  <DatabaseIcon className="h-3 w-3 mr-1" />
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

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
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
                className="p-4 sm:p-8 pt-4 sm:pt-6"
              >
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">
                    Available Questionnaires
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    This dataset contains the following questionnaires that you
                    can explore and extract variables from:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {renderQuestionnaires()}
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

              <TabsContent
                value="variables"
                className="p-4 sm:p-8 pt-4 sm:pt-6"
              >
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
                    <div className="w-full">
                      {renderVariableSelectionSummary()}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDetail;
