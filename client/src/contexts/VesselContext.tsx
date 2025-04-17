import React, { createContext, useContext, useState, ReactNode } from 'react';

// Mock data for vessels - would come from API in real implementation
const mockVessels = [
  { id: 1, name: 'M/Y Serenity', type: 'Motor Yacht', length: '45m' },
  { id: 2, name: 'S/Y Windchaser', type: 'Sailing Yacht', length: '38m' },
  { id: 3, name: 'M/Y Ocean Explorer', type: 'Expedition Yacht', length: '65m' },
  { id: 4, name: 'M/Y Azure Dreams', type: 'Motor Yacht', length: '52m' },
];

export interface Vessel {
  id: number;
  name: string;
  type: string;
  length: string;
}

interface VesselContextType {
  vessels: Vessel[];
  currentVessel: Vessel;
  setCurrentVessel: (vesselId: number) => void;
  vesselChanged: boolean;
  resetVesselChanged: () => void;
  // We would add more functions here in a real implementation 
  // such as addVessel, updateVessel, etc.
}

const VesselContext = createContext<VesselContextType | undefined>(undefined);

export const VesselProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vessels] = useState<Vessel[]>(mockVessels);
  const [currentVesselId, setCurrentVesselId] = useState<number>(1);
  const [vesselChanged, setVesselChanged] = useState<boolean>(false);

  const currentVessel = vessels.find(v => v.id === currentVesselId) || vessels[0];

  const setCurrentVessel = (vesselId: number) => {
    if (vesselId !== currentVesselId) {
      setCurrentVesselId(vesselId);
      setVesselChanged(true);
    }
  };
  
  const resetVesselChanged = () => {
    setVesselChanged(false);
  };

  return (
    <VesselContext.Provider
      value={{
        vessels,
        currentVessel,
        setCurrentVessel,
        vesselChanged,
        resetVesselChanged,
      }}
    >
      {children}
    </VesselContext.Provider>
  );
};

export const useVessel = (): VesselContextType => {
  const context = useContext(VesselContext);
  if (context === undefined) {
    throw new Error('useVessel must be used within a VesselProvider');
  }
  return context;
};