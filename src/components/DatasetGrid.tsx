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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-full h-[200px]">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Clinical Databases</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {datasets.map((dataset) => (
          <DatasetCard
            key={dataset.id}
            id={dataset.id}
            title={dataset.title}
            description={dataset.description}
            recordCount={dataset.record_count}
            lastUpdated={new Date(dataset.last_updated).toLocaleDateString()}
            metadata={dataset.metadata}
            onClick={handleDatasetClick}
          />
        ))}
      </div>
    </div>
  );
};

export default DatasetGrid;
