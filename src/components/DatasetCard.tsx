import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, Database } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface DatasetCardProps {
  id: string;
  title: string;
  description: string;
  recordCount: number;
  lastUpdated: string;
  onClick?: (id: string) => void;
}

const DatasetCard = ({
  id = "sample-dataset",
  title = "Clinical Assessment Database",
  description = "Structured clinical data including DSM diagnoses, mood ratings, and pharmacotherapy records.",
  recordCount = 250,
  lastUpdated = "2023-10-12",
  onClick,
}: DatasetCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    } else {
      navigate(`/dataset/${id}`);
    }
  };

  return (
    <Card
      className="w-full max-w-[350px] h-[250px] flex flex-col transition-all duration-200 hover:shadow-md cursor-pointer bg-white"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-gray-800">
            {title}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <Database className="h-3 w-3 mr-1" />
            {recordCount} records
          </Badge>
        </div>
        <CardDescription className="text-gray-500">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Placeholder for additional content if needed */}
      </CardContent>
      <CardFooter className="pt-2 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          Last updated: {lastUpdated}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatasetCard;
