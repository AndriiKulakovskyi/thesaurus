import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatasetCard from "./DatasetCard";
import { Skeleton } from "./ui/skeleton";
import { fetchDatabases, Database } from "../lib/api";

const DatasetGrid = () => {
  const [datasets, setDatasets] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDatabases = async () => {
      try {
        const data = await fetchDatabases();
        setDatasets(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load datasets. Please try again later.");
        setLoading(false);
        console.error("Error fetching datasets:", err);
      }
    };

    getDatabases();
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
