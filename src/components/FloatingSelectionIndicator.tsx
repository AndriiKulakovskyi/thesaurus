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
    <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
      <Button
        onClick={onClick}
        className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full px-4 py-2 flex items-center"
      >
        <Check className="h-4 w-4 mr-2" />
        <span>{count} Variables Selected</span>
      </Button>
    </div>
  );
};

export default FloatingSelectionIndicator;
