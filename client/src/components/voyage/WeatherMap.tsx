import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

// Define the types for waypoints (same as in VoyageMap.tsx)
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
function getWindyOverlayByTab(tab: string): string {
  switch (tab) {
    case 'wind':
      return 'wind';
    case 'rain':
      return 'rainAccumulation';
    case 'temp':
      return 'temperature';
    case 'clouds':
      return 'clouds';
    case 'waves':
      return 'waves';
    case 'currents':
      return 'currents';
    default:
      return 'wind';
  }
}

// Component to add Windy API overlay to the map
function WindyMapLayer({ windyTab, timestamp }: { windyTab: string, timestamp: number }) {
  const map = useMap();
  const [windyAPI, setWindyAPI] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scriptAdded = useRef(false);

  // Function to fetch API keys from server
  const fetchWindyAPIKeys = async (): Promise<string | null> => {
    try {
      console.log('Fetching Windy API keys from server...');
      const response = await fetch('/api/config/windy-keys', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Important for sending cookies
      });
      
      console.log('API keys response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Windy API keys: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API keys retrieved successfully');
      return data.WINDY_MAP_FORECAST_KEY;
    } catch (error) {
      console.error('Error fetching Windy API keys:', error);
      return null;
    }
  };
  
  // Create container element for Windy
  useEffect(() => {
    // Create a container for the Windy API
    const windyContainer = document.createElement('div');
    windyContainer.id = 'windy-map-container';
    windyContainer.style.position = 'absolute';
    windyContainer.style.top = '0';
    windyContainer.style.left = '0';
    windyContainer.style.width = '100%';
    windyContainer.style.height = '100%';
    windyContainer.style.zIndex = '400'; // Above base map but below markers
    windyContainer.style.pointerEvents = 'none'; // Allow clicking through to markers
    
    // Add the container to the map pane
    map.getContainer().appendChild(windyContainer);
    containerRef.current = windyContainer;
    
    return () => {
      if (windyContainer && windyContainer.parentNode) {
        windyContainer.parentNode.removeChild(windyContainer);
      }
    };
  }, [map]);
  
  // Load the Windy API script
  useEffect(() => {
    if (scriptAdded.current) {
      return;
    }
    
    // Check if script is already loaded
    if (document.getElementById('windy-api-script')) {
      return;
    }
    
    // Create script element for Windy
    const script = document.createElement('script');
    script.id = 'windy-api-script';
    script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
    script.async = true;
    
    // Add the script to the document
    document.head.appendChild(script);
    scriptAdded.current = true;
    
    // Clean up on unmount
    return () => {
      const existingScript = document.getElementById('windy-api-script');
      if (existingScript) {
        existingScript.remove();
      }
      scriptAdded.current = false;
    };
  }, []);
  
  // Initialize Windy with API key when container and script are ready
  useEffect(() => {
    // Wait for container, script, and windyInit to be available
    if (!containerRef.current || !window.windyInit || windyAPI) {
      return;
    }
    
    const initializeWindy = async () => {
      // Get the API key from our server
      const apiKey = await fetchWindyAPIKeys();
      
      if (!apiKey) {
        console.error('Failed to get Windy API key');
        return;
      }
      
      console.log('Windy API Key available:', !!apiKey);
      
      // Initialize Windy with our API key
      window.windyInit({
        key: apiKey,
        container: containerRef.current,
      }, (api: any) => {
        console.log('Windy API initialized successfully');
        setWindyAPI(api);
        
        // Hide Windy's attribution to avoid duplicates with Leaflet
        const attribution = containerRef.current?.querySelector('.leaflet-control-attribution');
        if (attribution) {
          attribution.remove();
        }
        
        // Set the overlay to display
        api.store.set('overlay', getWindyOverlayByTab(windyTab));
        
        // Set the forecast timestamp if provided
        if (timestamp) {
          api.store.set('timestamp', timestamp);
        }
        
        // Sync positions between Leaflet and Windy
        map.on('move', () => {
          const center = map.getCenter();
          const zoom = map.getZoom();
          api.map.setView([center.lat, center.lng], zoom);
        });
        
        // Trigger initial sync
        api.map.setView(
          [map.getCenter().lat, map.getCenter().lng], 
          map.getZoom()
        );
      });
    };
    
    // Call the initialize function
    initializeWindy();
  }, [map, windyTab, timestamp, windyAPI]);
  
  // Update weather overlay when tab changes
  useEffect(() => {
    if (windyAPI && windyTab) {
      windyAPI.store.set('overlay', getWindyOverlayByTab(windyTab));
    }
  }, [windyAPI, windyTab]);
  
  // Update timestamp when it changes
  useEffect(() => {
    if (windyAPI && timestamp) {
      windyAPI.store.set('timestamp', timestamp);
    }
  }, [windyAPI, timestamp]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up event listeners
      map.off('move');
    };
  }, [map]);

  return null;
}

// Component to show vessel position at a specific time point
function VesselPositionMarker({ 
  waypoints, 
  timePosition 
}: { 
  waypoints: Waypoint[], 
  timePosition: number 
}) {
  if (waypoints.length < 2) return null;
  
  // Calculate the position of the vessel based on timePosition (0-100)
  const totalWaypoints = waypoints.length;
  
  // Convert percentage to waypoint index plus partial distance to next waypoint
  const exactPosition = (timePosition / 100) * (totalWaypoints - 1);
  const lowerWaypointIndex = Math.floor(exactPosition);
  const upperWaypointIndex = Math.min(lowerWaypointIndex + 1, totalWaypoints - 1);
  const partialDistance = exactPosition - lowerWaypointIndex;
  
  // Get waypoints to interpolate between
  const lowerWaypoint = waypoints[lowerWaypointIndex];
  const upperWaypoint = waypoints[upperWaypointIndex];
  
  // Linear interpolation between waypoints
  const lat = parseFloat(lowerWaypoint.latitude) + 
    ((parseFloat(upperWaypoint.latitude) - parseFloat(lowerWaypoint.latitude)) * partialDistance);
  const lng = parseFloat(lowerWaypoint.longitude) + 
    ((parseFloat(upperWaypoint.longitude) - parseFloat(lowerWaypoint.longitude)) * partialDistance);

  // Calculate time based on departure and arrival times if available
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
              Between waypoints {lowerWaypointIndex + 1} and {upperWaypointIndex + 1}
            </span>
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-[10px]">
                {lowerWaypoint.name || `Waypoint ${lowerWaypointIndex + 1}`}
              </Badge>
              <span className="text-muted-foreground">→</span>
              <Badge variant="outline" className="text-[10px]">
                {upperWaypoint.name || `Waypoint ${upperWaypointIndex + 1}`}
              </Badge>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Calculate approximate UNIX timestamp based on voyage timeline
function calculateTimestamp(
  voyageStartDate: string | null, 
  voyageEndDate: string | null, 
  timePosition: number
): number {
  if (!voyageStartDate || !voyageEndDate) {
    // If no dates provided, use current time
    return Math.floor(Date.now() / 1000);
  }
  
  const startTime = new Date(voyageStartDate).getTime() / 1000;
  const endTime = new Date(voyageEndDate).getTime() / 1000;
  const totalTimeRange = endTime - startTime;
  
  // Calculate timestamp based on position in timeline
  return Math.floor(startTime + (totalTimeRange * (timePosition / 100)));
}

interface WeatherMapProps {
  voyageId?: number;
  waypoints: Waypoint[];
  voyageStartDate: string | null;
  voyageEndDate: string | null;
}

export function WeatherMap({ 
  voyageId, 
  waypoints, 
  voyageStartDate, 
  voyageEndDate 
}: WeatherMapProps) {
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
  
  // When waypoints are loaded, center the map
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
            
            {/* Add the Windy layer */}
            <WindyMapLayer windyTab={weatherTab} timestamp={timestamp} />
            
            {/* Show vessel position based on time slider */}
            <VesselPositionMarker 
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
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Timeline</h4>
            <div className="space-y-4">
              <Slider
                value={[timeSliderPosition]}
                onValueChange={(values) => setTimeSliderPosition(values[0])}
                max={100}
                step={1}
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDateForDisplay(0)}</span>
                <span>{formatDateForDisplay(100)}</span>
              </div>
              
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="text-sm font-medium">Current Time</h5>
                  <span className="text-xs bg-primary/10 px-2 py-0.5 rounded text-primary">
                    {formatDateForDisplay(timeSliderPosition)}
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 col-span-1"
                    onClick={() => setTimeSliderPosition(0)}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 col-span-4"
                    onClick={() => setTimeSliderPosition(Math.max(0, timeSliderPosition - 10))}
                  >
                    <span className="text-xs">Previous</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-5 gap-1 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 col-span-1"
                    onClick={() => setTimeSliderPosition(100)}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 col-span-4"
                    onClick={() => setTimeSliderPosition(Math.min(100, timeSliderPosition + 10))}
                  >
                    <span className="text-xs">Next</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {voyageId && (
            <Card className="mt-4">
              <CardContent className="p-3">
                <div className="text-xs">
                  <h5 className="font-medium">Weather Forecast Info</h5>
                  <p className="text-muted-foreground mt-1">
                    This map shows weather forecasts along the voyage route.
                    Use the timeline slider to see conditions at different times.
                  </p>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      <span>Forecasts updated daily</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Cloud className="h-3 w-3 text-muted-foreground" />
                      <span>Powered by Windy.com</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}