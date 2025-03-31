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
import { Calendar, Database, User, Microscope, Info } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface DatasetCardProps {
  id: string;
  title: string;
  description: string;
  recordCount: number;
  lastUpdated: string;
  metadata?: {
    study_type?: string;
    year_started?: number;
    principal_investigator?: string;
    patient_count?: number;
    [key: string]: any;
  };
  onClick?: (id: string) => void;
}

const DatasetCard = ({
  id = "sample-dataset",
  title = "Clinical Assessment Database",
  description = "Structured clinical data including DSM diagnoses, mood ratings, and pharmacotherapy records.",
  recordCount = 250,
  lastUpdated = "2023-10-12",
  metadata = {},
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

  // Prepare the metadata display
  const metadataItems = [];
  if (metadata?.study_type) {
    metadataItems.push({
      icon: <Microscope className="h-3 w-3" />,
      text: `${metadata.study_type}${metadata.year_started ? ` (${metadata.year_started})` : ''}`
    });
  }
  if (metadata?.principal_investigator) {
    metadataItems.push({
      icon: <User className="h-3 w-3" />,
      text: metadata.principal_investigator
    });
  }

  return (
    <Card
      className="w-full h-full min-h-[150px] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer bg-white border border-gray-100 overflow-hidden"
      onClick={handleClick}
    >
      <div className="flex flex-col h-full">
        <CardHeader className="pb-2 space-y-2 flex-grow">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl font-semibold text-gray-800 truncate">
              {title}
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap"
            >
              <Database className="h-3 w-3 mr-1" />
              {recordCount} records
            </Badge>
          </div>
          
          <CardDescription className="text-gray-500 line-clamp-2 h-10 overflow-hidden">
            {description}
          </CardDescription>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex text-xs text-blue-600 hover:text-blue-800 mt-1 cursor-pointer">
                  <Info className="h-3 w-3 mr-1" />
                  <span>Read more</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="text-sm">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>

        <div className="px-6 pb-2">
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            {metadataItems.map((item, index) => (
              <div key={index} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                {item.icon}
                <span className="truncate max-w-[150px]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <CardFooter className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto bg-gray-50 px-6 py-3">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            {lastUpdated}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs px-2"
          >
            View Details
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default DatasetCard;
