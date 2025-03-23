import React from "react";
import { Separator } from "./ui/separator";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

const Header = ({
  title = "Clinical Data Extraction Tool",
  subtitle = "For Psychiatric Research",
}: HeaderProps) => {
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center mt-1">
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <Separator className="mt-3 sm:mt-4" />
    </header>
  );
};

export default Header;
