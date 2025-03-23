import React from "react";
import Header from "./Header";
import DatasetGrid from "./DatasetGrid";
import { Separator } from "./ui/separator";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Clinical Dataset Explorer
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Browse and extract data from our collection of psychiatric
              research datasets. Select variables from questionnaires and
              generate structured data for your analysis.
            </p>
            <Separator className="mt-3 sm:mt-4" />
          </div>

          <DatasetGrid />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© 2023 Clinical Data Extraction Tool for Psychiatric Research</p>
          <p className="mt-1">
            All data is anonymized and used for research purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
