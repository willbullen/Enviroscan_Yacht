import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  
  // Additional fields required by the vessel schema
  registrationNumber?: string;
  beam?: string;
  draft?: string;
  year?: string;
  manufacturer?: string;
  status?: string;
}

interface VesselContextType {
  vessels: Vessel[];
  currentVessel: Vessel;
  setCurrentVessel: (vesselId: number) => void;
  vesselChanged: boolean;
  resetVesselChanged: () => void;
  loading: boolean;
  error: boolean;
  
  // Add CRUD operations for vessels
  addVessel: (vesselData: Partial<Vessel>) => Promise<Vessel | null>;
  updateVessel: (id: number, vesselData: Partial<Vessel>) => Promise<Vessel | null>;
  deleteVessel: (id: number) => Promise<boolean>;
  refreshVessels: () => void;
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
  const queryClient = useQueryClient();
  
  // Use React Query to fetch vessels from our new API endpoint
  const { 
    data: vesselsData, 
    isLoading, 
    isError,
    refetch 
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
  
  // Refresh all vessel data
  const refreshVessels = () => {
    refetch();
  };
  
  // Add a new vessel
  const addVessel = async (vesselData: Partial<Vessel>): Promise<Vessel | null> => {
    try {
      console.log('Adding vessel:', vesselData);
      const response = await fetch('/api/vessels-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vesselName: vesselData.name,
          vesselType: vesselData.type || 'Unknown',
          length: vesselData.length || '0',
          flagCountry: vesselData.flag || 'Unknown',
          mmsi: vesselData.mmsi || null,
          callSign: vesselData.callSign || null,
          
          // Add required fields for vessel schema validation
          registrationNumber: vesselData.registrationNumber || 'REG-' + Date.now(),
          beam: vesselData.beam || '10',
          draft: vesselData.draft || '5',
          buildYear: vesselData.year || '2020',
          manufacturer: vesselData.manufacturer || 'Unknown',
          status: 'active'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to add vessel:', errorData);
        return null;
      }
      
      const newVessel = await response.json();
      
      // Update the local state and refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/marine/fleet-vessels'] });
      
      return newVessel;
    } catch (error) {
      console.error('Error adding vessel:', error);
      return null;
    }
  };
  
  // Update an existing vessel
  const updateVessel = async (id: number, vesselData: Partial<Vessel>): Promise<Vessel | null> => {
    try {
      const response = await fetch(`/api/vessels-management/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vesselName: vesselData.name,
          vesselType: vesselData.type,
          length: vesselData.length,
          flagCountry: vesselData.flag,
          mmsi: vesselData.mmsi,
          callSign: vesselData.callSign,
          // Add other fields as needed
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update vessel:', errorData);
        return null;
      }
      
      const updatedVessel = await response.json();
      
      // Update the local state and refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/marine/fleet-vessels'] });
      
      return updatedVessel;
    } catch (error) {
      console.error('Error updating vessel:', error);
      return null;
    }
  };
  
  // Delete a vessel
  const deleteVessel = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/vessels-management/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        console.error('Failed to delete vessel:', errorData);
        return false;
      }
      
      // Update the local state and refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/marine/fleet-vessels'] });
      
      // If this was the current vessel, select another one
      if (id === currentVesselId && vessels.length > 1) {
        const newVessels = vessels.filter(v => v.id !== id);
        if (newVessels.length > 0) {
          setCurrentVessel(newVessels[0].id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting vessel:', error);
      return false;
    }
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
        error: isError,
        addVessel,
        updateVessel,
        deleteVessel,
        refreshVessels
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