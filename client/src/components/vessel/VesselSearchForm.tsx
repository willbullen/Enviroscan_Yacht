import React, { useState } from 'react';
import { Search, Loader2, Ship, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { VesselFormData } from '@/pages/VesselAdmin';

interface VesselSearchResult {
  mmsi: string;
  name: string;
  type: string;
  length: number;
  width?: number;
  flag: string;
}

interface VesselSearchFormProps {
  onSelectVessel: (vessel: VesselFormData) => void;
  onFocusVesselOnMap: (latitude: number, longitude: number) => void;
}

const VesselSearchForm: React.FC<VesselSearchFormProps> = ({ 
  onSelectVessel,
  onFocusVesselOnMap 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<VesselSearchResult[]>([]);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: 'Search query is empty',
        description: 'Please enter a vessel name, MMSI, or IMO number',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await fetch(`/api/marine/search-vessels?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the response is an error message
      if (data && data.error) {
        toast({
          title: 'Search error',
          description: data.message || 'Failed to search for vessels',
          variant: 'destructive'
        });
        setSearchResults([]);
      } else {
        // Handle normal results
        setSearchResults(data || []);
        
        if (data.length === 0) {
          toast({
            title: 'No vessels found',
            description: 'Try a different search term or MMSI number',
            variant: 'default'
          });
        } else {
          toast({
            title: 'Vessels found',
            description: `Found ${data.length} matching vessels`,
            variant: 'default'
          });
        }
      }
    } catch (error) {
      console.error('Error searching for vessels:', error);
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Failed to search for vessels',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVessel = async (vessel: VesselSearchResult) => {
    // Format the data as needed for the vessel form
    const formattedVessel: VesselFormData = {
      name: vessel.name,
      type: vessel.type,
      length: String(vessel.length),
      flag: vessel.flag,
      year: '', // AIS data typically doesn't include build year
      image: null,
      mmsi: vessel.mmsi
    };
    
    onSelectVessel(formattedVessel);
    
    // Try to get position data to focus on map
    try {
      const response = await fetch(`/api/marine/vessel-positions?mmsi=${vessel.mmsi}`);
      
      if (response.ok) {
        const positionData = await response.json();
        if (positionData.length > 0 && positionData[0].latitude && positionData[0].longitude) {
          onFocusVesselOnMap(positionData[0].latitude, positionData[0].longitude);
        }
      }
    } catch (error) {
      console.error('Error fetching vessel position:', error);
    }
    
    toast({
      title: 'Vessel selected',
      description: `${vessel.name} has been selected`,
      variant: 'default'
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-3 mb-2">
        <h3 className="text-base font-medium">Find a Vessel</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Search by vessel name, MMSI, or IMO number
        </p>
      </div>
      
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Vessel name, MMSI, or IMO number"
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Search className="h-4 w-4 mr-1" />
          )}
          Search
        </Button>
      </form>
      
      {searchResults.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto">
          {searchResults.map((vessel) => (
            <Card 
              key={vessel.mmsi}
              className="p-3 mb-2 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleSelectVessel(vessel)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-primary" />
                    <span className="font-medium">{vessel.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <div>MMSI: {vessel.mmsi}</div>
                    <div>Type: {vessel.type}</div>
                    <div>Length: {vessel.length}m</div>
                    <div>Flag: {vessel.flag}</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  title="Select this vessel"
                  className="text-primary"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VesselSearchForm;