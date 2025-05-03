import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, Wind, Droplets, Thermometer, Clock, Calendar, CloudRain, CloudSnow, Navigation, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { format } from 'date-fns';

// Add windyInit to Window interface
declare global {
  interface Window {
    windyInit: any;
  }
}

// Define the types for waypoints
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

// Custom vessel icon for the time slider position
const VesselIcon = L.divIcon({
  className: 'custom-vessel-icon',
  html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10]
});

// Map Windy tabs to overlay names
function getWindyOverlay(tab: string): string {
  switch (tab) {
    case 'wind': return 'wind';
    case 'rain': return 'rainAccumulation';
    case 'temp': return 'temperature';
    case 'clouds': return 'clouds';
    case 'waves': return 'waves';
    case 'currents': return 'currents';
    default: return 'wind';
  }
}

// Component to add Windy weather layer
function WindyLayer({ tab, timestamp }: { tab: string, timestamp: number }) {
  const map = useMap();
  const windyContainerRef = useRef<HTMLDivElement | null>(null);
  const [windyApi, setWindyApi] = useState<any>(null);
  const initialized = useRef(false);
  
  // Fetch API key from server
  const getWindyApiKey = async () => {
    try {
      const response = await fetch('/api/config/windy-keys');
      if (!response.ok) {
        throw new Error(`Failed to fetch API key: ${response.status}`);
      }
      
      const data = await response.json();
      return data.WINDY_MAP_FORECAST_KEY;
    } catch (error) {
      console.error('Error fetching Windy API key:', error);
      return null;
    }
  };
  
  // Initialize Windy map
  const initializeWindy = async () => {
    if (!windyContainerRef.current || initialized.current) return;
    
    try {
      // Get API key
      const apiKey = await getWindyApiKey();
      if (!apiKey) {
        console.error('No Windy API key available');
        return;
      }
      
      // Create script tag
      const script = document.createElement('script');
      script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      script.async = true;
      
      // When script loads, initialize Windy
      script.onload = () => {
        // Make sure windyInit is defined
        if (typeof window.windyInit !== 'function') {
          console.error('windyInit function not found');
          return;
        }
        
        // Initialize Windy API
        window.windyInit({
          key: apiKey,
          container: windyContainerRef.current,
        }, (api: any) => {
          console.log('Windy initialized successfully');
          setWindyApi(api);
          
          // Set the overlay and timestamp
          api.store.set('overlay', getWindyOverlay(tab));
          if (timestamp) {
            api.store.set('timestamp', timestamp);
          }
          
          // Sync with Leaflet map
          const center = map.getCenter();
          const zoom = map.getZoom();
          if (api.map) {
            api.map.setView([center.lat, center.lng], zoom);
          }
          
          // Add event to keep maps in sync
          map.on('moveend', () => {
            if (api && api.map) {
              const newCenter = map.getCenter();
              const newZoom = map.getZoom();
              api.map.setView([newCenter.lat, newCenter.lng], newZoom);
            }
          });
        });
      };
      
      // Handle script loading errors
      script.onerror = () => {
        console.error('Failed to load Windy script');
        initialized.current = false;
      };
      
      // Add script to document
      document.head.appendChild(script);
      initialized.current = true;
    } catch (error) {
      console.error('Error initializing Windy:', error);
      initialized.current = false;
    }
  };
  
  // Create container for Windy
  useEffect(() => {
    if (windyContainerRef.current) return;
    
    const container = document.createElement('div');
    container.id = 'windy-map-container';
    container.style.position = 'absolute';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '400';
    container.style.pointerEvents = 'none';
    
    map.getContainer().appendChild(container);
    windyContainerRef.current = container;
    
    // Initialize Windy after creating container
    initializeWindy();
    
    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      windyContainerRef.current = null;
      initialized.current = false;
      
      // Clean up event listeners
      map.off('moveend');
    };
  }, [map]);
  
  // Update overlay when tab changes
  useEffect(() => {
    if (windyApi && tab) {
      windyApi.store.set('overlay', getWindyOverlay(tab));
    }
  }, [windyApi, tab]);
  
  // Update timestamp when it changes
  useEffect(() => {
    if (windyApi && timestamp) {
      windyApi.store.set('timestamp', timestamp);
    }
  }, [windyApi, timestamp]);
  
  return null;
}

// Component to show vessel position
function VesselMarker({ waypoints, timePosition }: { waypoints: Waypoint[], timePosition: number }) {
  if (waypoints.length < 2) return null;
  
  // Calculate interpolated position between waypoints
  const totalWaypoints = waypoints.length;
  const exactPosition = (timePosition / 100) * (totalWaypoints - 1);
  const lowerIndex = Math.floor(exactPosition);
  const upperIndex = Math.min(lowerIndex + 1, totalWaypoints - 1);
  const partialDistance = exactPosition - lowerIndex;
  
  // Get waypoints to interpolate between
  const lowerWaypoint = waypoints[lowerIndex];
  const upperWaypoint = waypoints[upperIndex];
  
  // Linear interpolation of position
  const lat = parseFloat(lowerWaypoint.latitude) + 
    ((parseFloat(upperWaypoint.latitude) - parseFloat(lowerWaypoint.latitude)) * partialDistance);
  const lng = parseFloat(lowerWaypoint.longitude) + 
    ((parseFloat(upperWaypoint.longitude) - parseFloat(lowerWaypoint.longitude)) * partialDistance);
  
  // Calculate time if available
  let timeDisplay = '';
  if (lowerWaypoint.estimatedDeparture && upperWaypoint.estimatedArrival) {
    const departureTime = new Date(lowerWaypoint.estimatedDeparture);
    const arrivalTime = new Date(upperWaypoint.estimatedArrival);
    const totalTimeMs = arrivalTime.getTime() - departureTime.getTime();
    const currentTimeMs = departureTime.getTime() + (totalTimeMs * partialDistance);
    const currentTime = new Date(currentTimeMs);
    
    timeDisplay = format(currentTime, 'yyyy-MM-dd HH:mm');
  }
  
  return (
    <Marker position={[lat, lng]} icon={VesselIcon}>
      <Popup>
        <div className="p-1 min-w-[200px]">
          <div className="font-bold mb-1">Current Position</div>
          <div className="text-xs grid grid-cols-2 gap-1">
            <span>Latitude: {lat.toFixed(4)}° N</span>
            <span>Longitude: {lng.toFixed(4)}° E</span>
            {timeDisplay && (
              <span className="col-span-2 mt-1">Estimated Time: {timeDisplay}</span>
            )}
          </div>
          <div className="text-xs mt-2">
            <span className="block text-muted-foreground">
              Between waypoints {lowerIndex + 1} and {upperIndex + 1}
            </span>
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-[10px]">
                {lowerWaypoint.name || `Waypoint ${lowerIndex + 1}`}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline" className="text-[10px]">
                {upperWaypoint.name || `Waypoint ${upperIndex + 1}`}
              </Badge>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Calculate UNIX timestamp from voyage timeline position
function calculateTimestamp(
  voyageStartDate: string | null, 
  voyageEndDate: string | null, 
  timePosition: number
): number {
  if (!voyageStartDate || !voyageEndDate) {
    return Math.floor(Date.now() / 1000);
  }
  
  const startTime = new Date(voyageStartDate).getTime() / 1000;
  const endTime = new Date(voyageEndDate).getTime() / 1000;
  const totalTimeRange = endTime - startTime;
  
  return Math.floor(startTime + (totalTimeRange * (timePosition / 100)));
}

// Main Weather Map component
interface WindyMapProps {
  voyageId?: number;
  waypoints: Waypoint[];
  voyageStartDate: string | null;
  voyageEndDate: string | null;
}

export function WindyMap({ 
  voyageId, 
  waypoints, 
  voyageStartDate, 
  voyageEndDate 
}: WindyMapProps) {
  const [timeSliderPosition, setTimeSliderPosition] = useState(0); // 0-100%
  const [weatherTab, setWeatherTab] = useState('wind');
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [timestamp, setTimestamp] = useState<number>(Math.floor(Date.now() / 1000));
  
  // Format date for display
  const formatDateForDisplay = (position: number) => {
    if (!voyageStartDate || !voyageEndDate) return 'Date not available';
    
    const startTime = new Date(voyageStartDate).getTime();
    const endTime = new Date(voyageEndDate).getTime();
    const totalTime = endTime - startTime;
    const currentTime = new Date(startTime + (totalTime * (position / 100)));
    
    return format(currentTime, 'MMM dd, yyyy HH:mm');
  };
  
  // Center map on waypoints
  useEffect(() => {
    if (waypoints.length > 0) {
      const midpointIndex = Math.floor(waypoints.length / 2);
      const lat = parseFloat(waypoints[midpointIndex].latitude);
      const lng = parseFloat(waypoints[midpointIndex].longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setCenter([lat, lng]);
      }
    }
  }, [waypoints]);
  
  // Update timestamp when time slider changes
  useEffect(() => {
    const calculatedTimestamp = calculateTimestamp(
      voyageStartDate, 
      voyageEndDate, 
      timeSliderPosition
    );
    setTimestamp(calculatedTimestamp);
  }, [timeSliderPosition, voyageStartDate, voyageEndDate]);
  
  // Show message when no waypoints are available
  if (!center && waypoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-md">
        <div className="text-center">
          <Cloud className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No Route Available</h3>
          <p className="text-sm text-muted-foreground">
            Add waypoints to your voyage to see weather forecasts
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[550px] w-full">
      <div className="bg-card px-3 py-2 flex justify-between items-center border-b">
        <div className="font-medium text-primary flex items-center">
          <Cloud className="h-4 w-4 mr-1 text-primary" />
          Weather Forecast Map
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
            <Clock className="h-3 w-3 inline mr-1" />
            {formatDateForDisplay(timeSliderPosition)}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1 relative">
          <MapContainer
            center={center || [38.0, -118.0]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap">
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
            </LayersControl>
            
            {/* Windy weather layer */}
            <WindyLayer tab={weatherTab} timestamp={timestamp} />
            
            {/* Vessel position marker */}
            <VesselMarker 
              waypoints={waypoints} 
              timePosition={timeSliderPosition} 
            />
          </MapContainer>
        </div>
        
        <div className="w-full md:w-64 bg-card border-l p-3 overflow-y-auto">
          <h4 className="font-medium mb-2">Weather Layers</h4>
          
          <Tabs value={weatherTab} onValueChange={setWeatherTab} className="w-full">
            <TabsList className="grid grid-cols-3 gap-1 mb-3 h-auto">
              <TabsTrigger value="wind" className="h-8 px-2 py-1">
                <Wind className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Wind</span>
              </TabsTrigger>
              <TabsTrigger value="rain" className="h-8 px-2 py-1">
                <CloudRain className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Rain</span>
              </TabsTrigger>
              <TabsTrigger value="temp" className="h-8 px-2 py-1">
                <Thermometer className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Temp</span>
              </TabsTrigger>
              <TabsTrigger value="clouds" className="h-8 px-2 py-1">
                <Cloud className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Clouds</span>
              </TabsTrigger>
              <TabsTrigger value="waves" className="h-8 px-2 py-1">
                <Droplets className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Waves</span>
              </TabsTrigger>
              <TabsTrigger value="currents" className="h-8 px-2 py-1">
                <Navigation className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Currents</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-4 space-y-4">
            <div>
              <h5 className="text-sm font-medium mb-2">Voyage Timeline</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Start</span>
                  <span>End</span>
                </div>
                
                <Slider
                  value={[timeSliderPosition]}
                  onValueChange={(values) => setTimeSliderPosition(values[0])}
                  max={100}
                  step={1}
                  className="mt-1"
                />
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setTimeSliderPosition(0)}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                  
                  <div className="grid grid-cols-5 gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setTimeSliderPosition(20)}
                    >
                      <span className="text-[10px]">1/5</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setTimeSliderPosition(40)}
                    >
                      <span className="text-[10px]">2/5</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setTimeSliderPosition(60)}
                    >
                      <span className="text-[10px]">3/5</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setTimeSliderPosition(80)}
                    >
                      <span className="text-[10px]">4/5</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setTimeSliderPosition(100)}
                    >
                      <span className="text-[10px]">5/5</span>
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setTimeSliderPosition(100)}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Weather Information</h5>
              <div className="bg-muted/20 rounded-md p-2 text-xs">
                <p className="text-muted-foreground mb-2">
                  This map displays Windy.com weather forecasts along your voyage route.
                </p>
                <p className="text-muted-foreground">
                  Use the timeline slider to see weather conditions at different points during your voyage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}