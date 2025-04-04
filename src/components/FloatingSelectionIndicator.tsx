import React from "react";
import { Button } from "./ui/button";
import { Check, ChevronRight } from "lucide-react";

interface FloatingSelectionIndicatorProps {
  count: number;
  onClick: () => void;
}

const FloatingSelectionIndicator = ({
  count,
  onClick,
}: FloatingSelectionIndicatorProps) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-green-200">
        <div className="text-sm text-green-800 mb-2 font-medium">
          <Check className="h-4 w-4 inline-block mr-1 text-green-600" />
          {count} {count === 1 ? "variable" : "variables"} selected
        </div>
        <Button
          onClick={onClick}
          className="bg-green-600 hover:bg-green-700 text-white w-full justify-center transition-all duration-300"
          size="sm"
        >
          <span>Review Selection</span>
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default FloatingSelectionIndicator;
