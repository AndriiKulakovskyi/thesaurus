import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { fetchProjects, Project } from "../lib/api";

const ProjectsGrid = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const getProjects = async () => {
      try {
        setLoading(true);
        const data = await fetchProjects();
        setProjects(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load projects. Please try again later.");
        setLoading(false);
        console.error("Error fetching projects:", err);
      }
    };

    getProjects();
  }, []);

  const navigate = useNavigate();

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDatasetClick = (projectId: string, datasetId: string) => {
    setShowModal(false);
    navigate(`/dataset/${datasetId}`);
  };

  // Extract all unique categories from projects for filtering
  const allCategories = [
    ...new Set(projects.flatMap((project) => project.categories || [])),
  ];

  const toggleFilter = (category: string) => {
    if (activeFilters.includes(category)) {
      setActiveFilters(activeFilters.filter((f) => f !== category));
    } else {
      setActiveFilters([...activeFilters, category]);
    }
  };

  // Filter projects based on search query and active filters
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) => project.categories?.includes(filter));

    return matchesSearch && matchesFilters;
  });

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
      <div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-[300px]">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Research Projects</h2>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full sm:w-64"
            />
          </div>

          <Button variant="outline" className="flex items-center gap-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="px-3 py-1 cursor-pointer"
              onClick={() => toggleFilter(filter)}
            >
              {filter} ×
            </Badge>
          ))}
          <Button
            variant="link"
            className="text-sm h-7 px-2"
            onClick={() => setActiveFilters([])}
          >
            Clear all
          </Button>
        </div>
      )}

      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 p-3 rounded-md">
          <span className="text-sm font-medium text-gray-700 mr-2">
            Categories:
          </span>
          {allCategories.map((category) => (
            <Badge
              key={category}
              variant={activeFilters.includes(category) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            No projects match your search criteria.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
            />
          ))}
        </div>
      )}

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          isOpen={showModal}
          onClose={handleCloseModal}
          onDatasetClick={handleDatasetClick}
        />
      )}
    </div>
  );
};

export default ProjectsGrid;
