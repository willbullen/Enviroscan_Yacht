import * as React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "card" | "table";

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onChange, className }: ViewToggleProps) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <Button
        variant={viewMode === "card" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("card")}
        className="px-2"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        <span className="text-xs">Card</span>
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("table")}
        className="px-2"
      >
        <List className="h-4 w-4 mr-1" />
        <span className="text-xs">List</span>
      </Button>
    </div>
  );
}