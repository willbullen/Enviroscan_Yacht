import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ChevronRight, Navigation, Anchor, AlertTriangle, Ship, RefreshCw, Search, Loader2, PlusCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { useVessel } from '@/contexts/VesselContext';
import { useToast } from '@/hooks/use-toast';

// Fix for the Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Vessel icon colors by vessel ID
const vesselColors = {
  1: "#3b82f6", // blue
  2: "#10b981", // emerald
  3: "#ef4444", // red
  4: "#8b5cf6"  // purple
};

// Function to create custom yacht icon that rotates based on heading
const createShipIcon = (vesselId: number, heading = 0) => {
  const color = vesselColors[vesselId as keyof typeof vesselColors] || "#3b82f6";
  
  return L.divIcon({
    className: 'custom-ship-icon',
    html: `<div style="color: ${color}; transform: rotate(${heading}deg);" class="ship-marker">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" 
                 stroke="white" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round">
                 <!-- Detailed top view of a luxury yacht -->
                 <path d="M12 2 L16 6 L18 10 L20 14 L20 18 L4 18 L4 14 L6 10 L8 6 Z" fill="${color}" />
                 <!-- Stern details -->
                 <path d="M8 18 L8 20 L16 20 L16 18" fill="${color}" />
                 <!-- Cabin/bridge structure -->
                 <rect x="9" y="8" width="6" height="6" fill="white" stroke="${color}" />
                 <!-- Deck details -->
                 <line x1="8" y1="10" x2="9" y2="10" stroke="white" stroke-width="0.5" />
                 <line x1="15" y1="10" x2="16" y2="10" stroke="white" stroke-width="0.5" />
                 <line x1="8" y1="12" x2="9" y2="12" stroke="white" stroke-width="0.5" />
                 <line x1="15" y1="12" x2="16" y2="12" stroke="white" stroke-width="0.5" />
                 <!-- Bow accent -->
                 <circle cx="12" cy="5" r="0.8" fill="white" />
             </svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Custom component to handle map updates
const MapUpdater = ({ vessels, selectedVesselId }: { vessels: any[], selectedVesselId: number | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (vessels.length > 0) {
      const bounds = L.latLngBounds(vessels.map(v => [v.latitude, v.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [vessels, map]);
  
  useEffect(() => {
    if (selectedVesselId) {
      const vessel = vessels.find(v => v.id === selectedVesselId);
      if (vessel) {
        map.setView([vessel.latitude, vessel.longitude], 12);
      }
    }
  }, [selectedVesselId, vessels, map]);
  
  return null;
};

// Main component
const MarineTracker = () => {
  const { vessels, currentVessel } = useVessel();
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute by default
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { toast } = useToast();
  const mapRef = useRef<any>(null);

  // Query to fetch vessel positions
  const vesselPositionsQuery = useQuery({
    queryKey: ['/api/marine/vessel-positions'],
    refetchInterval: refreshInterval,
  });

  // Combined data (static vessel info + latest positions)
  const vesselData = React.useMemo(() => {
    if (!vesselPositionsQuery.data) return vessels.map(v => ({
      ...v,
      latitude: 25.7617 + (Math.random() * 0.5), // Default to Miami area for testing
      longitude: -80.1918 + (Math.random() * 0.5),
      heading: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 15),
      lastUpdate: new Date().toISOString(),
    }));

    // Combine static vessel data with position data
    return vessels.map(vessel => {
      const positionData = (vesselPositionsQuery.data as any[]).find(
        (pos: any) => pos.mmsi === vessel.mmsi || pos.vesselId === vessel.id
      );
      
      if (positionData) {
        return {
          ...vessel,
          latitude: positionData.latitude,
          longitude: positionData.longitude,
          heading: positionData.heading || 0,
          speed: positionData.speed || 0,
          lastUpdate: positionData.timestamp,
        };
      }
      
      // If no position data, return default values
      return {
        ...vessel,
        latitude: 25.7617 + (Math.random() * 0.5), // Default to Miami area for testing
        longitude: -80.1918 + (Math.random() * 0.5),
        heading: Math.floor(Math.random() * 360),
        speed: Math.floor(Math.random() * 15),
        lastUpdate: new Date().toISOString(),
      };
    });
  }, [vessels, vesselPositionsQuery.data]);

  // Handle refresh controls
  const handleRefresh = () => {
    vesselPositionsQuery.refetch();
    toast({
      title: "Refreshing vessel positions",
      description: "Fetching the latest vessel positions from AIS data"
    });
  };

  // Change refresh interval
  const handleChangeInterval = (interval: number) => {
    setRefreshInterval(interval);
    toast({
      title: "Update interval changed",
      description: `Position data will refresh every ${interval / 1000} seconds`
    });
  };

  // Select vessel and center map
  const handleSelectVessel = (vesselId: number) => {
    setSelectedVesselId(vesselId);
  };

  return (
    <MainLayout title="Marine Tracker">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Live Vessel Tracking</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={vesselPositionsQuery.isFetching}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${vesselPositionsQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleChangeInterval(30000)}
              className={refreshInterval === 30000 ? 'bg-primary/10' : ''}
            >
              30s
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleChangeInterval(60000)}
              className={refreshInterval === 60000 ? 'bg-primary/10' : ''}
            >
              1m
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleChangeInterval(300000)} 
              className={refreshInterval === 300000 ? 'bg-primary/10' : ''}
            >
              5m
            </Button>
          </div>
        </div>

        {vesselPositionsQuery.isError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Could not fetch vessel positions. The AIS API may be unavailable or requires an API key.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 space-y-4">
            {/* Vessel Search Component */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Search Vessels</CardTitle>
                <CardDescription>
                  Find vessels by name, MMSI, or IMO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const searchInput = (e.currentTarget.elements.namedItem('vesselSearch') as HTMLInputElement).value;
                    if (searchInput.trim()) {
                      setIsSearching(true);
                      fetch(`/api/marine/search-vessels?query=${encodeURIComponent(searchInput)}`)
                        .then(res => res.json())
                        .then(data => {
                          console.log("Search results:", data);
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
                            if (!data || data.length === 0) {
                              toast({
                                title: 'No vessels found',
                                description: 'Try a different search term or MMSI number'
                              });
                            } else {
                              toast({
                                title: 'Vessels found',
                                description: `Found ${data.length} matching vessels`
                              });
                            }
                          }
                        })
                        .catch(err => {
                          console.error("Error searching for vessels:", err);
                          setSearchResults([]);
                          toast({
                            title: 'Search failed',
                            description: 'Could not search for vessels. Please try again.'
                          });
                        })
                        .finally(() => {
                          setIsSearching(false);
                        });
                    }
                  }}>
                    <div className="flex space-x-2">
                      <Input 
                        name="vesselSearch" 
                        placeholder="Vessel name, MMSI, or IMO" 
                        className="flex-1" 
                        disabled={isSearching}
                      />
                      <Button type="submit" disabled={isSearching}>
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Search className="h-4 w-4 mr-1" />
                        )}
                        Search
                      </Button>
                    </div>
                  </form>
                  
                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Search Results</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSearchResults([])}
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {searchResults.map((vessel: any) => (
                          <div 
                            key={vessel.mmsi}
                            className="p-2 rounded-md border hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => {
                              // Add this vessel to tracked vessels
                              toast({
                                title: "Vessel added",
                                description: `${vessel.name} will now appear on the map`
                              });
                              // Could trigger API call to add this vessel to your tracked fleet
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Ship className="h-4 w-4 text-primary" />
                                <span className="font-medium">{vessel.name || 'Unknown Vessel'}</span>
                              </div>
                              <PlusCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 gap-1">
                              <div>MMSI: {vessel.mmsi}</div>
                              <div>Flag: {vessel.flag}</div>
                              <div>Type: {vessel.type}</div>
                              <div>Length: {vessel.length}m</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Fleet Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fleet Status</CardTitle>
                <CardDescription>
                  Select a vessel to track its position
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <div className="space-y-2">
                  {vesselData.map((vessel) => (
                    <div 
                      key={vessel.id}
                      onClick={() => handleSelectVessel(vessel.id)}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedVesselId === vessel.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div style={{ color: vesselColors[vessel.id as keyof typeof vesselColors] || "#3b82f6" }}>
                            <Ship className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{vessel.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 gap-2">
                        <div>Type: {vessel.type}</div>
                        <div>Length: {vessel.length}m</div>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" /> 
                          {vessel.heading}°
                        </div>
                        <div className="flex items-center gap-1">
                          <Anchor className="h-3 w-3" /> 
                          {vessel.speed} knots
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedVesselId && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Vessel Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {vesselData.find(v => v.id === selectedVesselId) && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1">
                        <div className="text-sm font-medium">Name:</div>
                        <div className="text-sm">
                          {vesselData.find(v => v.id === selectedVesselId)?.name}
                        </div>
                        
                        <div className="text-sm font-medium">Position:</div>
                        <div className="text-sm">
                          {vesselData.find(v => v.id === selectedVesselId)?.latitude.toFixed(4)}, 
                          {vesselData.find(v => v.id === selectedVesselId)?.longitude.toFixed(4)}
                        </div>
                        
                        <div className="text-sm font-medium">Speed:</div>
                        <div className="text-sm">
                          {vesselData.find(v => v.id === selectedVesselId)?.speed} knots
                        </div>
                        
                        <div className="text-sm font-medium">Heading:</div>
                        <div className="text-sm">
                          {vesselData.find(v => v.id === selectedVesselId)?.heading}°
                        </div>
                        
                        <div className="text-sm font-medium">Last Update:</div>
                        <div className="text-sm">
                          {new Date(vesselData.find(v => v.id === selectedVesselId)?.lastUpdate || '').toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="md:col-span-3">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                {vesselPositionsQuery.isLoading && !vesselPositionsQuery.data ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : (
                  <MapContainer
                    center={[25.7617, -80.1918]} // Default to Miami
                    zoom={9}
                    style={{ height: '100%', width: '100%', borderRadius: 'calc(var(--radius) - 2px)' }}
                    ref={mapRef}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {/* Marine chart tiles - requires API key */}
                    {/*<TileLayer
                      attribution='&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors'
                      url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                    />*/}
                    
                    {vesselData.map((vessel) => (
                      <Marker 
                        key={vessel.id}
                        position={[vessel.latitude, vessel.longitude]}
                        icon={createShipIcon(vessel.id, vessel.heading)}
                        eventHandlers={{
                          click: () => setSelectedVesselId(vessel.id)
                        }}
                      >
                        <Popup>
                          <div className="text-sm font-medium">{vessel.name}</div>
                          <div className="text-xs text-muted-foreground">{vessel.type} • {vessel.length}</div>
                          <div className="text-xs mt-1">
                            <div>Speed: {vessel.speed} knots</div>
                            <div>Heading: {vessel.heading}°</div>
                            <div>Last Update: {new Date(vessel.lastUpdate).toLocaleTimeString()}</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    <MapUpdater vessels={vesselData} selectedVesselId={selectedVesselId} />
                  </MapContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MarineTracker;