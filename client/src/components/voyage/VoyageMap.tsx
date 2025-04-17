import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Map, Navigation, Anchor, AlertTriangle, Info, Compass } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import * as L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import { MarineChartMarkers } from './MarineChartMarkers';
import { CompassRose } from './CompassRose';

// Custom nautical waypoint marker icons
const WaypointIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Nautical buoy icon for waypoints
const BuoyIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ff4757; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

// Starting point icon (green anchor)
const StartIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #2ed573; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
    <div style="font-size: 8px; color: white; font-weight: bold;">S</div>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12]
});

// Endpoint icon (red anchor)
const EndIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ff4757; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
    <div style="font-size: 8px; color: white; font-weight: bold;">E</div>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12]
});

// This ensures the default Leaflet marker has our specialized icon
L.Marker.prototype.options.icon = BuoyIcon;

// Component to recenter map when waypoints change
function MapCenterAdjuster({ waypoints }: { waypoints: Waypoint[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (waypoints.length > 0) {
      // Create bounds that include all waypoints
      const bounds = L.latLngBounds(waypoints.map(wp => [
        parseFloat(wp.latitude), 
        parseFloat(wp.longitude)
      ]));
      
      // Add some padding around the bounds
      map.fitBounds(bounds.pad(0.2));
    }
  }, [map, waypoints]);
  
  return null;
}

// Define types for waypoints
type Waypoint = {
  id?: number;
  voyageId?: number;
  orderIndex: number;
  latitude: string;
  longitude: string;
  name: string | null;
  estimatedArrival?: string | null;
  estimatedDeparture?: string | null;
  plannedSpeed?: string | null;
  engineRpm?: number | null;
  fuelConsumption?: string | null;
  distance?: string | null;
  notes?: string | null;
};

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

// Component to handle map click events
function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface VoyageMapProps {
  voyageId?: number;
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  readOnly?: boolean;
}

export function VoyageMap({ voyageId, waypoints, onWaypointsChange, readOnly = false }: VoyageMapProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([38.0, -118.0]);
  const [defaultZoom, setDefaultZoom] = useState(4);

  // When waypoints are loaded, center the map on the first waypoint if available
  useEffect(() => {
    if (waypoints.length > 0) {
      const firstWaypoint = waypoints[0];
      const lat = parseFloat(firstWaypoint.latitude);
      const lng = parseFloat(firstWaypoint.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setDefaultCenter([lat, lng]);
        setDefaultZoom(8);
      }
    }
  }, [waypoints]);

  // Handle map click to add a new waypoint
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (readOnly || !isAdding) return;
    
    const newWaypoint: Waypoint = {
      orderIndex: waypoints.length,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
      name: `Waypoint ${waypoints.length + 1}`,
    };
    
    onWaypointsChange([...waypoints, newWaypoint]);
    setIsAdding(false);
    
    toast({
      title: 'Waypoint Added',
      description: `Added waypoint at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
  }, [waypoints, onWaypointsChange, isAdding, readOnly, toast]);

  // Remove a waypoint
  const removeWaypoint = (index: number) => {
    if (readOnly) return;
    
    const updatedWaypoints = waypoints.filter((_, i) => i !== index);
    
    // Update orderIndex values
    const reindexedWaypoints = updatedWaypoints.map((wp, i) => ({
      ...wp,
      orderIndex: i,
    }));
    
    onWaypointsChange(reindexedWaypoints);
    
    toast({
      title: 'Waypoint Removed',
      description: 'Waypoint has been removed',
    });
  };

  // Update waypoint name
  const updateWaypointName = (index: number, name: string) => {
    if (readOnly) return;
    
    const updatedWaypoints = waypoints.map((wp, i) => {
      if (i === index) {
        return { ...wp, name };
      }
      return wp;
    });
    
    onWaypointsChange(updatedWaypoints);
  };

  // Create polyline coordinates
  const polylinePositions = waypoints.map(wp => [
    parseFloat(wp.latitude),
    parseFloat(wp.longitude)
  ] as [number, number]);

  return (
    <div className="flex flex-col h-[500px] w-full">
      <div className="bg-card px-3 py-2 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <div className="font-medium text-primary flex items-center">
            <Navigation className="h-4 w-4 mr-1 text-primary" />
            Marine Navigation Chart
          </div>
          <div className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
            <span className="px-1 py-0.5 rounded bg-muted">
              <Anchor className="h-3 w-3 inline mr-0.5" /> 
              {waypoints.length} Waypoints
            </span>
            {polylinePositions.length > 1 && (
              <span className="px-1 py-0.5 rounded bg-muted">
                <Map className="h-3 w-3 inline mr-0.5" /> 
                {waypoints.length > 0 && (
                  `${polylinePositions[0][0].toFixed(2)}°N, ${polylinePositions[0][1].toFixed(2)}°E`
                )}
              </span>
            )}
            <span className="px-1 py-0.5 rounded bg-primary/10 text-primary">
              <AlertTriangle className="h-3 w-3 inline mr-0.5" />
              {readOnly ? "View Mode" : "Edit Mode"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button 
              size="sm" 
              variant={isAdding ? "secondary" : "outline"} 
              onClick={() => setIsAdding(!isAdding)}
              className="text-xs h-8"
            >
              {isAdding ? "Cancel" : "Add Waypoint"}
              <Plus className={`ml-1 h-3 w-3 ${isAdding ? "text-primary" : ""}`} />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <LayersControl position="topright">
            {/* Base map layers */}
            <LayersControl.BaseLayer checked name="Ocean Base Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="ESRI Ocean">
              <TileLayer
                attribution='&copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}"
                maxZoom={13}
              />
            </LayersControl.BaseLayer>
            
            {/* Overlay layers */}
            <LayersControl.Overlay checked name="OpenSeaMap Nautical">
              <TileLayer
                attribution='&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors'
                url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                zIndex={500}
              />
            </LayersControl.Overlay>
            
            <LayersControl.Overlay name="Bathymetry">
              <TileLayer
                attribution='&copy; <a href="https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/">GEBCO</a>'
                url="https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/GEBCO_2019_Bathymetry/MapServer/tile/{z}/{y}/{x}"
                zIndex={400}
                opacity={0.7}
              />
            </LayersControl.Overlay>
            
            <LayersControl.Overlay name="NOAA Nautical Charts">
              <TileLayer
                attribution='&copy; <a href="https://seamlessrnc.nauticalcharts.noaa.gov/">NOAA Nautical Charts</a>'
                url="https://tileservice.charts.noaa.gov/tiles/servlet/tiles/NAUTICAL_SMALL/{z}/{x}/{y}.png"
                zIndex={300}
                opacity={0.6}
              />
            </LayersControl.Overlay>
            
            <LayersControl.Overlay name="Port and Harbor Info">
              <TileLayer
                attribution='&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors'
                url="https://t1.openseamap.org/harbours/{z}/{x}/{y}.png"
                zIndex={450}
                opacity={0.8}
              />
            </LayersControl.Overlay>
          </LayersControl>
          
          {/* Render each waypoint as a marker with specialized nautical icons */}
          {waypoints.map((waypoint, index) => {
            // Determine which icon to use based on the waypoint position
            let waypointIcon;
            if (index === 0) {
              // First waypoint uses Start icon
              waypointIcon = StartIcon;
            } else if (index === waypoints.length - 1) {
              // Last waypoint uses End icon
              waypointIcon = EndIcon;
            } else {
              // Middle waypoints use Buoy icon
              waypointIcon = BuoyIcon;
            }
            
            return (
              <Marker
                key={`waypoint-${index}`}
                position={[parseFloat(waypoint.latitude), parseFloat(waypoint.longitude)]}
                icon={waypointIcon}
              >
                <Popup>
                  <div className="p-1 min-w-[220px]">
                    <div className="font-bold mb-1 flex items-center">
                      {index === 0 && <span className="bg-green-600 text-white text-[8px] px-1 py-0.5 rounded mr-1">START</span>}
                      {index === waypoints.length - 1 && <span className="bg-red-600 text-white text-[8px] px-1 py-0.5 rounded mr-1">END</span>}
                      
                      {readOnly ? (
                        waypoint.name || `Waypoint ${index + 1}`
                      ) : (
                        <Input
                          type="text"
                          value={waypoint.name || `Waypoint ${index + 1}`}
                          onChange={(e) => updateWaypointName(index, e.target.value)}
                          className="text-sm h-7 w-full"
                        />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-1 border-b pb-1">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="flex items-center">
                          <Map className="h-3 w-3 mr-1 opacity-70" />
                          {waypoint.latitude}° N
                        </span>
                        <span>
                          {waypoint.longitude}° E
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs mb-2 grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className="col-span-2 flex justify-between items-center">
                        <span className="flex items-center">
                          <Anchor className="h-3 w-3 mr-1 opacity-70" /> 
                          Waypoint {index + 1} of {waypoints.length}
                        </span>
                        
                        {waypoint.engineRpm && (
                          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded">
                            {waypoint.engineRpm} RPM
                          </span>
                        )}
                      </div>
                      
                      {index > 0 && waypoints[index - 1] && (
                        <div className="col-span-2 mt-1 flex items-center">
                          <div className="bg-muted rounded px-1 py-0.5 text-[10px] w-full">
                            <div className="flex justify-between">
                              <span>Previous: {waypoints[index - 1].name || `Waypoint ${index}`}</span>
                              {waypoint.distance && (
                                <span className="font-medium">{waypoint.distance} NM</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {waypoint.notes && (
                      <div className="text-xs italic text-muted-foreground mb-1 border-t pt-1">
                        "{waypoint.notes}"
                      </div>
                    )}
                    
                    {!readOnly && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeWaypoint(index)}
                        className="w-full text-xs h-7 mt-1"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {/* Connect waypoints with a marine route styled polyline */}
          {polylinePositions.length > 1 && (
            <>
              {/* Dashed course line with nautical styling */}
              <Polyline 
                positions={polylinePositions} 
                pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.8, dashArray: "10, 5" }}
              />
              
              {/* Direction arrows along the route */}
              {polylinePositions.slice(0, -1).map((position, index) => {
                // Calculate midpoint between current and next waypoint for arrow placement
                const nextPosition = polylinePositions[index + 1];
                const midLat = (position[0] + nextPosition[0]) / 2;
                const midLng = (position[1] + nextPosition[1]) / 2;
                
                // Calculate bearing for the arrow direction
                const dx = nextPosition[1] - position[1]; 
                const dy = nextPosition[0] - position[0];
                const bearing = Math.atan2(dx, dy) * 180 / Math.PI;
                
                const NavigationArrow = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="
                    width: 12px; 
                    height: 12px; 
                    transform: rotate(${bearing}deg);
                    color: #3b82f6;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">▲</div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                });
                
                return (
                  <Marker 
                    key={`direction-${index}`}
                    position={[midLat, midLng]}
                    icon={NavigationArrow}
                    interactive={false}
                  />
                );
              })}
            </>
          )}
          
          {/* Add marine navigational aids and cardinal markers */}
          <LayersControl.Overlay name="Navigational Markers" checked>
            <MarineChartMarkers />
          </LayersControl.Overlay>
          
          {/* Add compass rose for nautical navigation */}
          <CompassRose position="bottomleft" size={100} />
          
          {/* Center map on all waypoints */}
          {waypoints.length > 0 && <MapCenterAdjuster waypoints={waypoints} />}
          
          {/* Add click handler for adding new waypoints */}
          {!readOnly && <MapClickHandler onMapClick={handleMapClick} />}
        </MapContainer>
        
        {isAdding && (
          <div className="absolute top-2 right-2 z-[1000] bg-card border p-3 rounded-md shadow-md">
            <p className="text-sm mb-2">Click on the map to add a waypoint</p>
          </div>
        )}
      </div>
      
      {/* Marine symbols legend and waypoint count footer */}
      <div className="p-2 bg-muted/30 text-xs text-muted-foreground flex justify-between items-center">
        <div>
          {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} defined
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="text-xs flex items-center bg-card px-2 py-1 rounded hover:bg-accent transition-colors"
            onClick={() => {
              // Show chart legend information
              toast({
                title: "Maritime Chart Legend",
                description: "Marine markers show cardinal directions, isolated dangers, and safe water passages",
                variant: "default",
                duration: 5000,
              });
            }}
          >
            <Compass className="h-3 w-3 mr-1" />
            Navigation Chart
          </button>
          
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>Start</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>End</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Course</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-black border border-white"></div>
            <span>Cardinal</span>
          </div>
          
          <button
            className="text-xs flex items-center bg-primary/10 text-primary px-2 py-1 rounded"
            onClick={() => {
              // Toggle the navigational markers layer
              toast({
                title: "Marine Navigational Markers",
                description: "Displays standard maritime navigation aids including cardinal marks, isolated dangers, and safe water markers for proper navigation",
                variant: "default",
                duration: 5000,
              });
            }}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Nav Aids
          </button>
        </div>
      </div>
    </div>
  );
}