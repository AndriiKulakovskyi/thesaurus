import React from "react";
import Header from "./Header";
import { Separator } from "./ui/separator";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>© {currentYear} Psychiatric Data Warehouse for Research</p>
          <p className="mt-1">
            All data is anonymized and used for research purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
