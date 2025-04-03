import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid2X2, List } from "lucide-react";

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
      className="border rounded-md"
    >
      <ToggleGroupItem value={ViewMode.CARDS} aria-label="Card View" variant="outline">
        <Grid2X2 className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value={ViewMode.LIST} aria-label="List View" variant="outline">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ViewToggle;