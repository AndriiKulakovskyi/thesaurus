import React from "react";
import { Button } from "./ui/button";
import { Check } from "lucide-react";

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
      <Button
        onClick={onClick}
        className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center transition-all duration-300 hover:shadow-xl"
      >
        <Check className="h-4 w-4 mr-2" />
        <span>{count} Variables Selected</span>
      </Button>
    </div>
  );
};

export default FloatingSelectionIndicator;
