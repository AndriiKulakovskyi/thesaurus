import React from "react";
import { Check, Database, FileSpreadsheet, Download } from "lucide-react";

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isCompleted?: boolean;
}

const Step: React.FC<StepProps> = ({
  number,
  title,
  description,
  icon,
  isActive = false,
  isCompleted = false,
}) => {
  return (
    <div
      className={`flex items-start transition-all duration-300 ${isActive ? "scale-105" : ""} ${isCompleted ? "opacity-100" : isActive ? "opacity-100" : "opacity-70"}`}
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-sm transition-colors duration-300 ${isCompleted ? "bg-green-100 text-green-600 ring-2 ring-green-200" : isActive ? "bg-blue-100 text-blue-600 ring-2 ring-blue-200" : "bg-gray-100 text-gray-600"}`}
      >
        {isCompleted ? <Check className="w-5 h-5" /> : icon}
      </div>
      <div className="ml-3">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
};

interface DataSelectionGuideProps {
  currentStep?: number;
  completedSteps?: number[];
}

const DataSelectionGuide: React.FC<DataSelectionGuideProps> = ({
  currentStep = 0,
  completedSteps = [],
}) => {
  const steps = [
    {
      number: 1,
      title: "Select Dataset",
      description: "Choose a clinical dataset from our collection to explore.",
      icon: <Database className="w-5 h-5" />,
    },
    {
      number: 2,
      title: "Select Variables",
      description: "Choose specific variables from questionnaires of interest.",
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      number: 3,
      title: "Request Data",
      description: "Generate and download structured data for your analysis.",
      icon: <Download className="w-5 h-5" />,
    },
  ];

  // Calculate progress percentage
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;
  const progressPercentage = Math.max(
    ((currentStep - 1) / totalSteps) * 100,
    (completedCount / totalSteps) * 100,
  );

  return (
    <div className="bg-gradient-to-b from-blue-50 to-indigo-50 rounded-lg shadow-md border border-blue-100 p-4 transition-all duration-300 hover:shadow-lg h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Data Selection Process
      </h2>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-4 mt-2">
        <div
          className="h-2 bg-blue-500 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="flex flex-col space-y-3">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            <div
              className={`p-2 rounded-lg transition-all duration-300 ${currentStep === step.number ? "bg-white shadow-md" : completedSteps.includes(step.number) ? "bg-green-50" : "bg-gray-50"}`}
            >
              <Step
                {...step}
                isActive={currentStep === step.number}
                isCompleted={completedSteps.includes(step.number)}
              />
            </div>
            {step.number < steps.length && (
              <div className="absolute left-5 -bottom-3 h-3 w-0.5 bg-gray-300"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataSelectionGuide;
