import React, { createContext, useContext, useState, ReactNode } from 'react';

// Mock data for vessels - would come from API in real implementation
const mockVessels = [
  { id: 1, name: 'M/Y Serenity', type: 'Motor Yacht', length: '45m', mmsi: '366998410', latitude: 40.7128, longitude: -74.0060 },
  { id: 2, name: 'S/Y Windchaser', type: 'Sailing Yacht', length: '38m', mmsi: '366759530', latitude: 41.0082, longitude: -73.6286 },
  { id: 3, name: 'M/Y Ocean Explorer', type: 'Expedition Yacht', length: '65m', mmsi: '367671640', latitude: 40.6892, longitude: -74.0445 },
  { id: 4, name: 'M/Y Azure Dreams', type: 'Motor Yacht', length: '52m', mmsi: '367124560', latitude: 40.9006, longitude: -73.9045 },
];

export interface Vessel {
  id: number;
  name: string;
  type: string;
  length: string;
  mmsi?: string;
  latitude?: number;
  longitude?: number;
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