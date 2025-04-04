import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import {
  Calendar,
  Database,
  User,
  Microscope,
  ExternalLink,
  FileText,
  Mail,
} from "lucide-react";
import { Project } from "../lib/api";
import AccessRequestForm from "./AccessRequestForm";

interface ProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onDatasetClick: (projectId: string, datasetId: string) => void;
}

const ProjectModal = ({
  project,
  isOpen,
  onClose,
  onDatasetClick,
}: ProjectModalProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAccessForm, setShowAccessForm] = useState(false);

  const handleAccessRequest = () => {
    setShowAccessForm(true);
    setActiveTab("access");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {project.title}
            </DialogTitle>
            <div className="flex gap-2">
              {project.categories?.map((category, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-blue-50 text-blue-700"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          <DialogDescription className="text-gray-600">
            {project.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-3 my-3">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
            <Database className="h-4 w-4 text-gray-600" />
            <span className="text-sm">{project.datasets.length} datasets</span>
          </div>
          {project.institution && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
              <Microscope className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{project.institution}</span>
            </div>
          )}
          {project.principalInvestigator && (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-sm">{project.principalInvestigator}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-sm">Last updated: {project.lastUpdated}</span>
          </div>
        </div>

        <Separator className="my-2" />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
            <TabsTrigger value="access">Request Access</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="p-1 min-h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Project Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Description
                      </h4>
                      <p className="mt-1">
                        {project.fullDescription || project.description}
                      </p>
                    </div>
                    {project.objectives && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Research Objectives
                        </h4>
                        <p className="mt-1">{project.objectives}</p>
                      </div>
                    )}
                    {project.publications && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Key Publications
                        </h4>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          {project.publications.map((pub, index) => (
                            <li key={index} className="text-sm">
                              {pub.title}
                              {pub.url && (
                                <a
                                  href={pub.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 inline-flex items-center text-blue-600 hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {project.statistics?.map((stat, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {project.fundingInfo && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-500">
                        Funding Information
                      </h4>
                      <p className="mt-1">{project.fundingInfo}</p>
                    </div>
                  )}

                  {project.contactEmail && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-500">
                        Contact
                      </h4>
                      <a
                        href={`mailto:${project.contactEmail}`}
                        className="mt-1 inline-flex items-center text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        {project.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="datasets" className="p-1 min-h-[300px]">
              <h3 className="text-lg font-semibold mb-4">Available Datasets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => onDatasetClick(project.id, dataset.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900">
                        {dataset.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700"
                      >
                        <Database className="h-3 w-3 mr-1" />
                        {dataset.recordCount} records
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {dataset.description}
                    </p>

                    <div className="flex items-center mt-3 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last updated: {dataset.lastUpdated}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-0 h-auto"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View details
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="access" className="p-1 min-h-[300px]">
              {showAccessForm ? (
                <AccessRequestForm
                  projectId={project.id}
                  projectTitle={project.title}
                />
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">
                    Request Access to This Project
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    To access the datasets in this project, you need to submit
                    an access request that will be reviewed by the project
                    administrators.
                  </p>
                  <Button onClick={handleAccessRequest}>
                    Start Access Request
                  </Button>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {activeTab !== "access" && (
            <Button onClick={handleAccessRequest}>Request Access</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectModal;
