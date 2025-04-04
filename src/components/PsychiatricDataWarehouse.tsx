import React, { useState } from "react";
import Header from "./Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ProjectsGrid from "./ProjectsGrid";
import DatasetGrid from "./DatasetGrid";
import { Separator } from "./ui/separator";
import DataSelectionGuide from "./DataSelectionGuide";

const PsychiatricDataWarehouse = () => {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="Psychiatric Data Warehouse"
        subtitle="Centralized Repository for Psychiatric Research Data"
      />

      <main className="flex-grow py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Psychiatric Data Warehouse
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Explore and access data from multiple psychiatric research
              projects. Browse available projects, request access to specific
              datasets, or extract variables for your analysis.
            </p>
            <Separator className="mt-3 sm:mt-4" />
          </div>

          <Tabs
            defaultValue="projects"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="projects">Research Projects</TabsTrigger>
              <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="w-full">
              <ProjectsGrid />
            </TabsContent>

            <TabsContent value="extraction" className="w-full">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/5">
                  <DataSelectionGuide currentStep={1} completedSteps={[]} />
                </div>
                <div className="md:w-4/5">
                  <DatasetGrid />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2023 Psychiatric Data Warehouse for Research</p>
          <p className="mt-1">
            All data is anonymized and used for research purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PsychiatricDataWarehouse;
