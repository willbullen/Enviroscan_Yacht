import React, { useState } from 'react';
import { useNavigate } from 'wouter';
import { ChevronDown, Ship, PlusCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data for vessels - would come from API in real implementation
const mockVessels = [
  { id: 1, name: 'M/Y Serenity', type: 'Motor Yacht', length: '45m' },
  { id: 2, name: 'S/Y Windchaser', type: 'Sailing Yacht', length: '38m' },
  { id: 3, name: 'M/Y Ocean Explorer', type: 'Expedition Yacht', length: '65m' },
  { id: 4, name: 'M/Y Azure Dreams', type: 'Motor Yacht', length: '52m' },
];

interface VesselSelectorProps {
  currentVesselId?: number;
  onVesselChange: (vesselId: number) => void;
}

const VesselSelector = ({ currentVesselId = 1, onVesselChange }: VesselSelectorProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  const currentVessel = mockVessels.find(v => v.id === currentVesselId) || mockVessels[0];
  
  const handleVesselSelect = (vesselId: number) => {
    onVesselChange(vesselId);
    setOpen(false);
  };
  
  const goToVesselAdmin = () => {
    navigate('/vessels/admin');
    setOpen(false);
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Ship className="h-4 w-4" />
          <span className="font-medium text-sm">{currentVessel.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Select Vessel</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockVessels.map((vessel) => (
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
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={goToVesselAdmin} className="flex items-center gap-2 text-primary">
          <Settings className="h-4 w-4" />
          <span>Vessel Management</span>
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