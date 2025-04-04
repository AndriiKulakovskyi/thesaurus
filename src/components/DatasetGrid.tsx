import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatasetCard from "./DatasetCard";
import { Skeleton } from "./ui/skeleton";
import { fetchDatabases, Database } from "../lib/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Filter, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Badge } from "./ui/badge";

const DatasetGrid = () => {
  const [datasets, setDatasets] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "recordCount" | "lastUpdated">(
    "title",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

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

  // Extract all unique study types for filtering
  const studyTypes = [
    ...new Set(
      datasets.map((dataset) => dataset.metadata?.study_type).filter(Boolean),
    ),
  ];

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  // Filter and sort datasets
  const filteredAndSortedDatasets = datasets
    .filter((dataset) => {
      // Apply search filter
      const matchesSearch =
        searchQuery === "" ||
        dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Apply study type filter
      const matchesFilter =
        activeFilters.length === 0 ||
        (dataset.metadata?.study_type &&
          activeFilters.includes(dataset.metadata.study_type));

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "title") {
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortBy === "recordCount") {
        return sortOrder === "asc"
          ? a.record_count - b.record_count
          : b.record_count - a.record_count;
      } else {
        return sortOrder === "asc"
          ? new Date(a.last_updated).getTime() -
              new Date(b.last_updated).getTime()
          : new Date(b.last_updated).getTime() -
              new Date(a.last_updated).getTime();
      }
    });

  const handleSort = (newSortBy: "title" | "recordCount" | "lastUpdated") => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  if (error) {
    return (
      <div className="w-full p-8 text-center bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
        <Button
          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-[200px]">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Clinical Databases</h2>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>

          <Button variant="outline" className="flex items-center gap-1">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Sort</span>
          </Button>
        </div>
      </div>

      {studyTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-md">
          <span className="text-sm font-medium text-gray-700 mr-2">
            Study Type:
          </span>
          {studyTypes.map((type) => (
            <Badge
              key={type}
              variant={
                activeFilters.includes(type as string) ? "default" : "outline"
              }
              className="cursor-pointer"
              onClick={() => toggleFilter(type as string)}
            >
              {type}
            </Badge>
          ))}
          {activeFilters.length > 0 && (
            <Button
              variant="link"
              className="text-sm h-7 px-2"
              onClick={() => setActiveFilters([])}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500 px-2">
        <div>
          {filteredAndSortedDatasets.length}{" "}
          {filteredAndSortedDatasets.length === 1 ? "dataset" : "datasets"}{" "}
          found
        </div>
        <div className="flex items-center gap-4">
          <button
            className={`flex items-center gap-1 ${sortBy === "title" ? "text-blue-600 font-medium" : ""}`}
            onClick={() => handleSort("title")}
          >
            Name {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            className={`flex items-center gap-1 ${sortBy === "recordCount" ? "text-blue-600 font-medium" : ""}`}
            onClick={() => handleSort("recordCount")}
          >
            Records{" "}
            {sortBy === "recordCount" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            className={`flex items-center gap-1 ${sortBy === "lastUpdated" ? "text-blue-600 font-medium" : ""}`}
            onClick={() => handleSort("lastUpdated")}
          >
            Updated{" "}
            {sortBy === "lastUpdated" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {filteredAndSortedDatasets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            No datasets match your search criteria.
          </p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => {
              setSearchQuery("");
              setActiveFilters([]);
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredAndSortedDatasets.map((dataset) => (
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
      )}
    </div>
  );
};

export default DatasetGrid;
