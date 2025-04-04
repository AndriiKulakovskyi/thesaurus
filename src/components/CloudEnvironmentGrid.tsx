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
import { Clock, Code, Database, Server } from "lucide-react";

interface CloudProject {
  id: string;
  name: string;
  description: string;
  lastActive: string;
  status: "active" | "completed" | "pending";
  datasetAccess: string[];
  resourceUsage: {
    cpu: string;
    memory: string;
    storage: string;
  };
}

const dummyCloudProjects: CloudProject[] = [
  {
    id: "cloud-1",
    name: "Depression Prediction Model",
    description:
      "Developing a machine learning model to predict depression risk factors based on questionnaire data.",
    lastActive: "2023-11-15T14:30:00",
    status: "active",
    datasetAccess: ["E-Depression", "E-Anxiety"],
    resourceUsage: {
      cpu: "4 cores",
      memory: "16 GB",
      storage: "250 GB",
    },
  },
  {
    id: "cloud-2",
    name: "Schizophrenia Biomarker Analysis",
    description:
      "Analyzing potential biomarkers for early schizophrenia detection using neural networks.",
    lastActive: "2023-11-10T09:15:00",
    status: "active",
    datasetAccess: ["E-Schizo"],
    resourceUsage: {
      cpu: "8 cores",
      memory: "32 GB",
      storage: "500 GB",
    },
  },
  {
    id: "cloud-3",
    name: "Bipolar Disorder Classification",
    description:
      "Building a classification model to distinguish between bipolar I and II disorders based on symptom patterns.",
    lastActive: "2023-10-28T16:45:00",
    status: "completed",
    datasetAccess: ["E-Bipolar"],
    resourceUsage: {
      cpu: "6 cores",
      memory: "24 GB",
      storage: "350 GB",
    },
  },
];

const CloudEnvironmentGrid = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            Your Cloud Development Projects
          </h2>
          <p className="text-gray-600 mt-1">
            Secure environment for AI model development with access to
            psychiatric research data
          </p>
        </div>
        <Button className="shrink-0">
          <Code className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyCloudProjects.map((project) => (
          <Card
            key={project.id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge
                  variant={
                    project.status === "active"
                      ? "default"
                      : project.status === "completed"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <span>
                    Last active:{" "}
                    {new Date(project.lastActive).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Database className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Datasets: {project.datasetAccess.join(", ")}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Server className="mr-2 h-4 w-4 text-gray-500" />
                  <span>
                    Resources: {project.resourceUsage.cpu},{" "}
                    {project.resourceUsage.memory} RAM
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" size="sm">
                View Details
              </Button>
              <Button size="sm">Open Environment</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CloudEnvironmentGrid;
