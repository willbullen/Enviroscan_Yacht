import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface Vessel {
  id: number;
  name: string;
  type: string;
  length: string;
  mmsi?: string;
  callSign?: string;
  flag?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

interface VesselContextType {
  vessels: Vessel[];
  currentVessel: Vessel;
  setCurrentVessel: (vesselId: number) => void;
  vesselChanged: boolean;
  resetVesselChanged: () => void;
  loading: boolean;
  error: boolean;
  // We would add more functions here in a real implementation 
  // such as addVessel, updateVessel, etc.
}

// Default vessel in case we don't have any yet
const defaultVessel: Vessel = {
  id: 1,
  name: 'Loading...',
  type: 'Unknown',
  length: '0m'
};

const VesselContext = createContext<VesselContextType | undefined>(undefined);

export const VesselProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [currentVesselId, setCurrentVesselId] = useState<number>(1);
  const [vesselChanged, setVesselChanged] = useState<boolean>(false);
  const [currentVessel, setCurrentVesselObject] = useState<Vessel>(defaultVessel);
  
  // Use React Query to fetch vessels from our new API endpoint
  const { 
    data: vesselsData, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/marine/fleet-vessels'],
    queryFn: async () => {
      const response = await fetch('/api/marine/fleet-vessels');
      if (!response.ok) {
        throw new Error('Failed to fetch vessels');
      }
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds to get updated positions
  });

  const setCurrentVessel = (vesselId: number) => {
    if (vesselId !== currentVesselId) {
      setCurrentVesselId(vesselId);
      setVesselChanged(true);
      
      // Also update the current vessel object
      const foundVessel = vessels.find(v => v.id === vesselId);
      if (foundVessel) {
        setCurrentVesselObject(foundVessel);
      }
    }
  };
  
  const resetVesselChanged = () => {
    setVesselChanged(false);
  };

  // Update vessels state when data is fetched
  useEffect(() => {
    if (vesselsData && Array.isArray(vesselsData)) {
      setVessels(vesselsData);
      
      // Update current vessel if we have vessels and the ID exists
      if (vesselsData.length > 0) {
        const foundVessel = vesselsData.find(v => v.id === currentVesselId);
        if (foundVessel) {
          setCurrentVesselObject(foundVessel);
        } else {
          // Default to first vessel if current ID not found
          setCurrentVesselId(vesselsData[0].id);
          setCurrentVesselObject(vesselsData[0]);
        }
      }
    }
  }, [vesselsData, currentVesselId]);

  return (
    <VesselContext.Provider
      value={{
        vessels,
        currentVessel,
        setCurrentVessel,
        vesselChanged,
        resetVesselChanged,
        loading: isLoading,
        error: isError
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