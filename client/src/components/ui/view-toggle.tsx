import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid2X2, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export enum ViewMode {
  CARDS = "cards",
  LIST = "list"
}

export interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (value: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onChange }) => {
  const handleValueChange = (value: string) => {
    if (value) {
      onChange(value as ViewMode);
    }
  };

  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={handleValueChange}
      className="border rounded-md bg-background shadow-sm"
      aria-label="Change view layout"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value={ViewMode.CARDS} 
              aria-label="Card View" 
              variant="outline"
              className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:bg-muted/30"
            >
              <Grid2X2 className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to Card View</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value={ViewMode.LIST} 
              aria-label="List View" 
              variant="outline"
              className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 hover:bg-muted/30"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to List View</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </ToggleGroup>
  );
};

export default ViewToggle;