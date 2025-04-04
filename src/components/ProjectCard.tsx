import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Calendar,
  Database,
  User,
  Microscope,
  ChevronRight,
} from "lucide-react";
import { Project } from "../lib/api";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  return (
    <Card
      className="w-full h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-white border border-gray-100 overflow-hidden flex flex-col"
      onClick={onClick}
    >
      <div
        className="h-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${project.imageUrl})` }}
      >
        <div className="w-full h-full bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
          {project.categories && project.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.categories.slice(0, 2).map((category, index) => (
                <Badge
                  key={index}
                  className="bg-blue-500/80 text-white border-none"
                >
                  {category}
                </Badge>
              ))}
              {project.categories.length > 2 && (
                <Badge className="bg-blue-500/80 text-white border-none">
                  +{project.categories.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pb-2 space-y-2 flex-grow">
        <CardTitle className="text-xl font-semibold text-gray-800">
          {project.title}
        </CardTitle>
        <CardDescription className="text-gray-500 line-clamp-3">
          {project.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
            <Database className="h-3 w-3" />
            <span>{project.datasets.length} datasets</span>
          </div>
          {project.institution && (
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
              <Microscope className="h-3 w-3" />
              <span className="truncate max-w-[150px]">
                {project.institution}
              </span>
            </div>
          )}
          {project.principalInvestigator && (
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[150px]">
                {project.principalInvestigator}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-gray-100 mt-auto bg-gray-50 px-6 py-3">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          {project.lastUpdated}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs px-2"
        >
          View Details
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
