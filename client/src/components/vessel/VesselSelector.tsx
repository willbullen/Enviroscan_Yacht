import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, Ship, PlusCircle, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVessel } from '@/contexts/VesselContext';

interface VesselSelectorProps {
  currentVesselId?: number;
  onVesselChange: (vesselId: number) => void;
}

const VesselSelector = ({ currentVesselId = 1, onVesselChange }: VesselSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { vessels, loading, currentVessel } = useVessel();
  
  const handleVesselSelect = (vesselId: number) => {
    const vessel = vessels.find(v => v.id === vesselId);
    if (vessel) {
      console.log(`Vessel changed to ${vessel.name} (ID: ${vesselId}). Reloading data...`);
      onVesselChange(vesselId);
      setOpen(false);
    }
  };
  
  const goToVesselAdmin = () => {
    setLocation('/vessels/admin');
    setOpen(false);
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-2 hover:bg-accent/50 hover:text-accent-foreground"
          aria-label="Switch vessel context"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Ship className="h-4 w-4" />
          )}
          <span className="font-medium text-sm">
            {loading ? 'Loading vessels...' : currentVessel.name}
          </span>
          <ChevronDown className="h-4 w-4 opacity-80" />
          <span className="sr-only">Click to select a different vessel</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Select Vessel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : vessels.length === 0 ? (
          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
            No vessels found
          </div>
        ) : (
          vessels.map((vessel) => (
            <DropdownMenuItem 
              key={vessel.id}
              className={`flex items-center gap-2 ${vessel.id === currentVesselId ? 'bg-accent/50' : ''}`}
              onClick={() => handleVesselSelect(vessel.id)}
            >
              <Ship className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{vessel.name}</span>
                <span className="text-xs text-muted-foreground">{vessel.type} • {vessel.length}</span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={goToVesselAdmin} className="flex items-center gap-2 text-primary">
          <Settings className="h-4 w-4" />
          <span>Fleet Management</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={goToVesselAdmin} className="flex items-center gap-2 text-primary">
          <PlusCircle className="h-4 w-4" />
          <span>Add New Vessel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VesselSelector;