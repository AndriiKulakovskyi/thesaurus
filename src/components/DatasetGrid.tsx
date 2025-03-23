import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatasetCard from "./DatasetCard";
import { Skeleton } from "./ui/skeleton";

interface Dataset {
  id: string;
  title: string;
  description: string;
  record_count: number;
  last_updated: string;
  questionnaires_models: string[];
  questionnaires_folder: string;
}

const DatasetGrid = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call to fetch datasets
    const fetchDatasets = async () => {
      try {
        // In a real application, this would be an API call
        // For now, we'll simulate a delay and return mock data
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockData: Dataset[] = [
          {
            id: "ebipolar",
            questionnaires_models: ["1.json", "2.json", "3.json"],
            questionnaires_folder: "data/questionnaires/ebipolar",
            title: "Clinical Assessment Database",
            description:
              "Structured clinical data including DSM diagnoses, mood ratings, and pharmacotherapy records for bipolar patients.",
            record_count: 250,
            last_updated: "2023-10-12",
          },
          {
            id: "eschizo",
            questionnaires_models: ["1.json"],
            questionnaires_folder: "data/questionnaires/eschizo",
            title: "Neurocognitive Performance Database",
            description:
              "Results from cognitive tasks (working memory, attention, executive function) for schizophrenia participants.",
            record_count: 180,
            last_updated: "2023-08-30",
          },
          {
            id: "edepression",
            questionnaires_models: ["1.json", "2.json"],
            questionnaires_folder: "data/questionnaires/edepression",
            title: "Depression Assessment Database",
            description:
              "Comprehensive depression scales, symptom tracking, and treatment response data for major depressive disorder research.",
            record_count: 320,
            last_updated: "2023-11-05",
          },
          {
            id: "eanxiety",
            questionnaires_models: ["1.json", "2.json"],
            questionnaires_folder: "data/questionnaires/eanxiety",
            title: "Anxiety Disorders Database",
            description:
              "Anxiety assessment scales, physiological measurements, and behavioral observations for anxiety disorder research.",
            record_count: 215,
            last_updated: "2023-09-18",
          },
        ];

        setDatasets(mockData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load datasets. Please try again later.");
        setLoading(false);
        console.error("Error fetching datasets:", err);
      }
    };

    fetchDatasets();
  }, []);

  const navigate = useNavigate();

  const handleDatasetClick = (id: string) => {
    // Navigate to the dataset detail page
    navigate(`/dataset/${id}`);
  };

  if (error) {
    return (
      <div className="w-full p-8 text-center bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 bg-gray-50 grow">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
        Available Clinical Datasets
      </h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-[250px]">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5 md:gap-8">
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              id={dataset.id}
              title={dataset.title}
              description={dataset.description}
              recordCount={dataset.record_count}
              lastUpdated={dataset.last_updated}
              onClick={handleDatasetClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetGrid;
