import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Map, Navigation, Anchor } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons - this is necessary because Leaflet's assets are not properly handled by bundlers
// We need to manually specify the icon URLs
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// This ensures the default Leaflet marker has our specified icon
L.Marker.prototype.options.icon = DefaultIcon;

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
      <div className="bg-card p-2 flex justify-between items-center border-b">
        <div className="text-sm font-medium">Marine Chart</div>
        {!readOnly && (
          <Button 
            size="sm" 
            variant={isAdding ? "secondary" : "outline"} 
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? "Cancel" : "Add Waypoint"}
            <Plus className={`ml-1 h-4 w-4 ${isAdding ? "text-primary" : ""}`} />
          </Button>
        )}
      </div>
      
      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Render each waypoint as a marker */}
          {waypoints.map((waypoint, index) => (
            <Marker
              key={`waypoint-${index}`}
              position={[parseFloat(waypoint.latitude), parseFloat(waypoint.longitude)]}
            >
              <Popup>
                <div className="p-1">
                  <div className="font-bold mb-1">
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
                  <div className="text-xs text-muted-foreground mb-1">
                    {waypoint.latitude}, {waypoint.longitude}
                  </div>
                  <div className="text-xs mb-1">
                    Order: {index + 1} of {waypoints.length}
                  </div>
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
          ))}
          
          {/* Connect waypoints with a polyline */}
          {polylinePositions.length > 1 && (
            <Polyline 
              positions={polylinePositions} 
              pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.7 }}
            />
          )}
          
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
      
      {waypoints.length > 0 && (
        <div className="p-2 bg-muted/30 text-xs text-muted-foreground">
          {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} defined
        </div>
      )}
    </div>
  );
}