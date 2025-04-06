import React, { useState } from "react";
import Header from "./Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import ProjectsGrid from "./ProjectsGrid";
import DatasetGrid from "./DatasetGrid";
import { Separator } from "./ui/separator";
import DataSelectionGuide from "./DataSelectionGuide";
import CloudEnvironmentGrid from "./CloudEnvironmentGrid";
import {
  Database,
  FileSpreadsheet,
  Server,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import RoleBasedAccess from "./auth/RoleBasedAccess";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const PsychiatricDataWarehouse = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        title="Psychiatric Data Warehouse"
        subtitle="Centralized Repository for Psychiatric Research Data"
      />
      <main className="flex-grow py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <p className="text-sm sm:text-base text-gray-600">
              Explore and access data from multiple psychiatric research
              projects. Browse available projects, request access to specific
              datasets, or extract variables for your analysis.
            </p>
            {user && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  Welcome, <span className="font-medium">{user.name}</span>. You
                  are logged in as a{" "}
                  <span className="font-medium capitalize">{user.role}</span>.
                </p>
              </div>
            )}
            <Separator className="mt-3 sm:mt-4" />
          </div>

          <Tabs
            defaultValue="projects"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 h-11 h-[17]">
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Research Projects</span>
              </TabsTrigger>
              <TabsTrigger
                value="extraction"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Data Extraction</span>
              </TabsTrigger>
              <TabsTrigger value="cloud" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>Cloud Environment</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="w-full">
              <ProjectsGrid />
            </TabsContent>

            <TabsContent value="extraction" className="w-full">
              <RoleBasedAccess
                allowedRoles={["researcher", "manager", "admin"]}
                fallback={
                  <Alert className="mb-6">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                      You need to be logged in to access the data extraction
                      features.
                    </AlertDescription>
                  </Alert>
                }
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/5">
                    <DataSelectionGuide currentStep={1} completedSteps={[]} />
                  </div>
                  <div className="md:w-4/5">
                    <DatasetGrid />
                  </div>
                </div>
              </RoleBasedAccess>
            </TabsContent>

            <TabsContent value="cloud" className="w-full">
              <RoleBasedAccess
                allowedRoles={["manager", "admin"]}
                fallback={
                  <Alert className="mb-6">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Access Restricted</AlertTitle>
                    <AlertDescription>
                      The cloud environment is only accessible to managers and
                      administrators.
                    </AlertDescription>
                  </Alert>
                }
              >
                <CloudEnvironmentGrid />
              </RoleBasedAccess>
            </TabsContent>

            <RoleBasedAccess allowedRoles={["admin"]}>
              <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold">Admin Controls</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  This section is only visible to administrators. Here you can
                  manage users, roles, and system settings.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <h3 className="font-medium">User Management</h3>
                    <p className="text-sm text-gray-500">
                      Manage user accounts and permissions
                    </p>
                  </div>
                  <div className="p-4 border rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <h3 className="font-medium">System Settings</h3>
                    <p className="text-sm text-gray-500">
                      Configure system-wide settings
                    </p>
                  </div>
                  <div className="p-4 border rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                    <h3 className="font-medium">Audit Logs</h3>
                    <p className="text-sm text-gray-500">
                      View system activity and audit logs
                    </p>
                  </div>
                </div>
              </div>
            </RoleBasedAccess>
          </Tabs>
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} Psychiatric Data Warehouse for
            Research
          </p>
          <p className="mt-1">
            All data is anonymized and used for research purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PsychiatricDataWarehouse;
