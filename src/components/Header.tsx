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
    <header className="w-full bg-white border-b border-gray-200 shadow-sm py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center mt-1">
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <Separator className="mt-4" />
    </header>
  );
};

export default Header;
