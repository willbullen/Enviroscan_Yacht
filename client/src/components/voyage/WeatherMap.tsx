import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Cloud, Wind, Droplets, Thermometer, Clock, Calendar, CloudRain, CloudSnow, Navigation, RefreshCw, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { format } from 'date-fns';

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

// Component to add a simulated weather overlay to the map
function WindyMapLayer({ windyTab, timestamp }: { windyTab: string, timestamp: number }) {
  const map = useMap();
  const [initialized, setInitialized] = useState(false);
  const overlayRef = useRef<L.FeatureGroup | null>(null);
  
  // Initialize the overlay when the component mounts
  useEffect(() => {
    if (!overlayRef.current) {
      overlayRef.current = L.featureGroup().addTo(map);
      setInitialized(true);
    }
    
    return () => {
      if (overlayRef.current) {
        overlayRef.current.clearLayers();
        map.removeLayer(overlayRef.current);
      }
    };
  }, [map]);
  
  // Update the overlay when the tab or timestamp changes
  useEffect(() => {
    if (!initialized || !overlayRef.current) return;
    
    // Clear previous layers
    overlayRef.current.clearLayers();
    
    // Add weather symbols based on the selected tab
    const bounds = map.getBounds();
    const centerLat = map.getCenter().lat;
    const centerLng = map.getCenter().lng;
    
    // Create a grid of weather symbols
    const gridSize = 5; // Number of symbols in each direction
    const latSpan = bounds.getNorth() - bounds.getSouth();
    const lngSpan = bounds.getEast() - bounds.getWest();
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = bounds.getSouth() + (latSpan * (i + 0.5)) / gridSize;
        const lng = bounds.getWest() + (lngSpan * (j + 0.5)) / gridSize;
        
        // Create different symbols based on the selected weather tab
        let symbol: L.Marker | L.Circle;
        let color: string;
        let size: number;
        
        // Seed random values based on position and timestamp for consistency
        const seed = (lat * 1000 + lng * 100 + timestamp) % 100;
        const intensity = (seed % 10) / 10; // 0-1 value for intensity
        
        switch (windyTab) {
          case 'wind':
            // Wind arrows
            color = intensity > 0.7 ? '#ff4757' : intensity > 0.4 ? '#ff7f50' : '#3ec97c';
            size = 15 + (intensity * 15);
            
            // Create a wind direction arrow
            const windDir = (timestamp + (lat * 100 + lng * 100)) % 360;
            const arrowIcon = L.divIcon({
              className: 'custom-wind-icon',
              html: `<div style="transform: rotate(${windDir}deg); color: ${color};">
                      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                      </svg>
                     </div>`,
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
            
            symbol = L.marker([lat, lng], { icon: arrowIcon });
            break;
            
          case 'rain':
            // Rain circles
            color = `rgba(59, 130, 246, ${0.3 + intensity * 0.6})`;
            size = 15 + (intensity * 25);
            symbol = L.circle([lat, lng], {
              radius: size * 1000, // Convert to meters
              color: 'transparent',
              fillColor: color,
              fillOpacity: 0.6,
            });
            break;
            
          case 'temp':
            // Temperature indicators
            const temp = Math.floor(15 + (intensity * 20) - (lat - centerLat) * 2);
            const tempColor = temp > 25 ? '#ff4757' : temp > 15 ? '#ff7f50' : '#3b82f6';
            
            const tempIcon = L.divIcon({
              className: 'custom-temp-icon',
              html: `<div style="background-color: ${tempColor}; color: white; padding: 3px; border-radius: 50%; font-size: 10px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                      ${temp}°
                     </div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            symbol = L.marker([lat, lng], { icon: tempIcon });
            break;
            
          case 'clouds':
            // Cloud cover
            const cloudCover = Math.floor(intensity * 100);
            const cloudOpacity = 0.2 + (intensity * 0.5);
            color = `rgba(156, 163, 175, ${cloudOpacity})`;
            size = 20 + (intensity * 30);
            
            const cloudIcon = L.divIcon({
              className: 'custom-cloud-icon',
              html: `<div style="color: ${color};">
                      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M17 16a3 3 0 0 1-3 3H4a3 3 0 1 1 0-6h.1a5 5 0 0 1-.1-1 5 5 0 0 1 5-5c2.2 0 4.1 1.4 4.8 3.4a3 3 0 0 1 6.2 2.6 3 3 0 0 1-3 3z"></path>
                      </svg>
                     </div>`,
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
            
            symbol = L.marker([lat, lng], { icon: cloudIcon });
            break;
            
          case 'waves':
            // Wave height indicators
            const waveHeight = (1 + intensity * 3).toFixed(1);
            const waveColor = intensity > 0.7 ? '#ff4757' : intensity > 0.4 ? '#ff7f50' : '#3b82f6';
            
            const waveIcon = L.divIcon({
              className: 'custom-wave-icon',
              html: `<div style="color: ${waveColor};">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
                      </svg>
                      <span style="position: absolute; top: -8px; right: -5px; background-color: ${waveColor}; color: white; border-radius: 9999px; font-size: 9px; padding: 1px 4px; font-weight: bold;">${waveHeight}m</span>
                     </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            
            symbol = L.marker([lat, lng], { icon: waveIcon });
            break;
            
          case 'currents':
            // Current direction and speed
            color = intensity > 0.7 ? '#3ec97c' : intensity > 0.4 ? '#3b82f6' : '#6366f1';
            size = 15 + (intensity * 15);
            
            // Create a current direction arrow
            const currentDir = (timestamp + (lat * 50 + lng * 70)) % 360;
            const currentSpeed = (1 + intensity * 2).toFixed(1);
            
            const currentIcon = L.divIcon({
              className: 'custom-current-icon',
              html: `<div style="transform: rotate(${currentDir}deg); color: ${color};">
                      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14"></path>
                        <path d="M18 13l-6 6-6-6"></path>
                      </svg>
                      <span style="position: absolute; top: -8px; right: -5px; background-color: ${color}; color: white; border-radius: 9999px; font-size: 9px; padding: 1px 4px; transform: rotate(-${currentDir}deg); font-weight: bold;">${currentSpeed}kt</span>
                     </div>`,
              iconSize: [size, size],
              iconAnchor: [size/2, size/2]
            });
            
            symbol = L.marker([lat, lng], { icon: currentIcon });
            break;
            
          default:
            // Default to a simple marker
            symbol = L.circle([lat, lng], {
              radius: 10000,
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.4,
            });
        }
        
        overlayRef.current.addLayer(symbol);
      }
    }
    
    // Add a legend for the current weather type
    const legendControl = L.control({ position: 'bottomright' });
    
    legendControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '6px 8px';
      div.style.border = '1px solid #ccc';
      div.style.borderRadius = '4px';
      div.style.fontSize = '12px';
      
      let title = '';
      let content = '';
      
      switch (windyTab) {
        case 'wind':
          title = 'Wind Speed';
          content = `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 20px; margin-right: 8px; color: #3ec97c; display: flex; align-items: center; justify-content: center;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </div>
              <span>Low (0-10 kt)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 20px; margin-right: 8px; color: #ff7f50; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </div>
              <span>Medium (10-20 kt)</span>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="width: 20px; height: 20px; margin-right: 8px; color: #ff4757; display: flex; align-items: center; justify-content: center;">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </div>
              <span>High (20+ kt)</span>
            </div>
          `;
          break;
          
        case 'rain':
          title = 'Precipitation';
          content = `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 20px; margin-right: 8px; background-color: rgba(59, 130, 246, 0.3); border-radius: 50%;"></div>
              <span>Light</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 20px; margin-right: 8px; background-color: rgba(59, 130, 246, 0.6); border-radius: 50%;"></div>
              <span>Moderate</span>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="width: 20px; height: 20px; margin-right: 8px; background-color: rgba(59, 130, 246, 0.9); border-radius: 50%;"></div>
              <span>Heavy</span>
            </div>
          `;
          break;
          
        case 'temp':
          title = 'Temperature';
          content = `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 20px; margin-right: 8px; background-color: #3b82f6; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px;">15°</div>
              <span>Cool (< 15°C)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 20px; margin-right: 8px; background-color: #ff7f50; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px;">20°</div>
              <span>Warm (15-25°C)</span>
            </div>
            <div style="display: flex; align-items: center;">
              <div style="width: 20px; height: 20px; margin-right: 8px; background-color: #ff4757; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px;">30°</div>
              <span>Hot (> 25°C)</span>
            </div>
          `;
          break;
          
        default:
          title = 'Weather Layer';
          content = `<span>Simulated ${windyTab} data for visualization</span>`;
      }
      
      div.innerHTML = `<div style="font-weight: bold; margin-bottom: 6px;">${title}</div>${content}`;
      return div;
    };
    
    legendControl.addTo(map);
    
    return () => {
      map.removeControl(legendControl);
    };
  }, [map, windyTab, timestamp, initialized]);
  
  return null;
}

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
  const [showInfoAlert, setShowInfoAlert] = useState(true);
  
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
      {showInfoAlert && (
        <Alert variant="info" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Weather Visualization</AlertTitle>
          <AlertDescription>
            This is a simulated weather visualization for route planning purposes. Weather patterns are generated based on voyage timeline and location.
            <Button 
              variant="link" 
              size="sm" 
              className="ml-1 h-auto p-0 text-primary" 
              onClick={() => setShowInfoAlert(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
    
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
            
            {/* Draw the route polyline */}
            {waypoints.length > 1 && (
              <WindyMapLayer windyTab={weatherTab} timestamp={timestamp} />
            )}
            
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
          
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Control
              </label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[timeSliderPosition]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => setTimeSliderPosition(values[0])}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{timeSliderPosition}%</span>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{voyageStartDate ? format(new Date(voyageStartDate), 'MMM dd') : 'Start'}</span>
                <span>{voyageEndDate ? format(new Date(voyageEndDate), 'MMM dd') : 'End'}</span>
              </div>
            </div>
            
            <Card className="mt-4">
              <CardContent className="p-3">
                <h5 className="text-sm font-medium mb-2 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Weather Forecast
                </h5>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p className="flex justify-between">
                    <span>Selected Time:</span>
                    <span className="font-medium">{formatDateForDisplay(timeSliderPosition)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Weather Layer:</span>
                    <span className="font-medium capitalize">{weatherTab}</span>
                  </p>
                  <div className="border-t my-2"></div>
                  <p className="text-xs italic mt-1">
                    Simulated weather visualization. Adjust time slider to see weather changes during the voyage.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs h-8"
              onClick={() => setTimeSliderPosition(0)}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reset Time Position
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add typing to window for Windy API
declare global {
  interface Window {
    windyInit: any;
  }
}