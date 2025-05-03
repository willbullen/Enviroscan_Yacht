import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cloud, Wind, Droplets, Thermometer, Clock, Calendar, CloudRain, CloudSnow, Navigation, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Properties for the DirectWindyMap component
interface DirectWindyMapProps {
  voyageId?: number;
  waypoints: Waypoint[];
  voyageStartDate: string | null;
  voyageEndDate: string | null;
}

export function DirectWindyMap({ 
  voyageId, 
  waypoints, 
  voyageStartDate, 
  voyageEndDate 
}: DirectWindyMapProps) {
  const [timeSliderPosition, setTimeSliderPosition] = useState(0); // 0-100%
  const [weatherTab, setWeatherTab] = useState('wind');
  const [timestamp, setTimestamp] = useState<number>(Math.floor(Date.now() / 1000));
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const windyAPIRef = useRef<any>(null);
  
  // Calculate center position from waypoints
  const getCenter = () => {
    if (waypoints.length === 0) {
      return { lat: 43.0, lng: 5.0 }; // Default: Mediterranean
    }
    
    const midIndex = Math.floor(waypoints.length / 2);
    return {
      lat: parseFloat(waypoints[midIndex].latitude),
      lng: parseFloat(waypoints[midIndex].longitude)
    };
  };
  
  // Format date for display
  const formatDateForDisplay = (position: number) => {
    if (!voyageStartDate || !voyageEndDate) return 'Date not available';
    
    const startTime = new Date(voyageStartDate).getTime();
    const endTime = new Date(voyageEndDate).getTime();
    const totalTime = endTime - startTime;
    const currentTime = new Date(startTime + (totalTime * (position / 100)));
    
    return format(currentTime, 'MMM dd, yyyy HH:mm');
  };
  
  // Calculate forecast timestamp based on timeline position
  const calculateTimestamp = (position: number): number => {
    if (!voyageStartDate || !voyageEndDate) {
      return Math.floor(Date.now() / 1000);
    }
    
    const startTime = new Date(voyageStartDate).getTime() / 1000;
    const endTime = new Date(voyageEndDate).getTime() / 1000;
    const totalTimeRange = endTime - startTime;
    
    return Math.floor(startTime + (totalTimeRange * (position / 100)));
  };
  
  // Get overlay type based on selected tab
  const getOverlayType = (tab: string): string => {
    switch (tab) {
      case 'wind': return 'wind';
      case 'rain': return 'rainAccumulation';
      case 'temp': return 'temperature';
      case 'clouds': return 'clouds';
      case 'waves': return 'waves';
      case 'currents': return 'currents';
      default: return 'wind';
    }
  };
  
  // Fetch Windy API key from server
  useEffect(() => {
    async function fetchAPIKey() {
      try {
        const response = await fetch('/api/config/windy-keys');
        if (!response.ok) {
          console.error('Failed to fetch Windy API key:', response.status);
          return;
        }
        
        const data = await response.json();
        if (data && data.WINDY_MAP_FORECAST_KEY) {
          console.log('Successfully retrieved Windy API key');
          setApiKey(data.WINDY_MAP_FORECAST_KEY);
        }
      } catch (error) {
        console.error('Error fetching Windy API key:', error);
      }
    }
    
    fetchAPIKey();
  }, []);
  
  // Load Windy API script
  useEffect(() => {
    if (isScriptLoaded || !apiKey) return;
    
    const script = document.createElement('script');
    script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Windy script loaded successfully');
      setIsScriptLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Windy script:', error);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Clean up script if component unmounts
      document.head.removeChild(script);
    };
  }, [apiKey]);
  
  // Initialize Windy map when script is loaded and container is ready
  useEffect(() => {
    if (!isScriptLoaded || !apiKey || !mapContainerRef.current || isMapInitialized) {
      return;
    }
    
    // Initialize map with Windy API
    if (typeof window.windyInit === 'function') {
      const center = getCenter();
      
      window.windyInit({
        key: apiKey,
        container: mapContainerRef.current,
        lat: center.lat,
        lon: center.lng,
        zoom: 7
      }, (windyAPI: any) => {
        console.log('Windy API successfully initialized');
        
        // Store the API reference
        windyAPIRef.current = windyAPI;
        setIsMapInitialized(true);
        
        // Set initial overlay
        windyAPI.store.set('overlay', getOverlayType(weatherTab));
        
        // Set initial timestamp
        const initialTimestamp = calculateTimestamp(timeSliderPosition);
        windyAPI.store.set('timestamp', initialTimestamp);
        
        // Render vessel position markers on the map
        renderVesselMarkers(windyAPI, timeSliderPosition);
      });
    } else {
      console.error('windyInit function not available');
    }
    
    return () => {
      // Clean up Windy instance on unmount
      if (windyAPIRef.current) {
        // No explicit destroy method in Windy API, but we can clean up references
        windyAPIRef.current = null;
      }
    };
  }, [isScriptLoaded, apiKey, timeSliderPosition, weatherTab]);
  
  // Update overlay when weather tab changes
  useEffect(() => {
    if (windyAPIRef.current && isMapInitialized) {
      windyAPIRef.current.store.set('overlay', getOverlayType(weatherTab));
    }
  }, [weatherTab, isMapInitialized]);
  
  // Update timestamp when time slider changes
  useEffect(() => {
    if (windyAPIRef.current && isMapInitialized) {
      const newTimestamp = calculateTimestamp(timeSliderPosition);
      setTimestamp(newTimestamp);
      windyAPIRef.current.store.set('timestamp', newTimestamp);
      
      // Update vessel position
      renderVesselMarkers(windyAPIRef.current, timeSliderPosition);
    }
  }, [timeSliderPosition, isMapInitialized]);
  
  // Render vessel position markers based on timeline position
  const renderVesselMarkers = (api: any, position: number) => {
    if (!api || !api.map || waypoints.length < 2) return;
    
    // Clear existing markers
    api.map.eachLayer((layer: any) => {
      if (layer._icon && layer._icon.classList.contains('vessel-marker')) {
        api.map.removeLayer(layer);
      }
    });
    
    // Calculate vessel position based on timeline
    const totalWaypoints = waypoints.length;
    const exactPosition = (position / 100) * (totalWaypoints - 1);
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
    
    // Create custom icon for vessel
    const vesselIcon = L.divIcon({
      className: 'vessel-marker',
      html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    
    // Add marker at interpolated position
    const marker = L.marker([lat, lng], { icon: vesselIcon }).addTo(api.map);
    
    // Add popup with vessel information
    let popupContent = `
      <div style="min-width: 200px;">
        <div style="font-weight: bold; margin-bottom: 4px;">Current Position</div>
        <div style="font-size: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <span>Latitude: ${lat.toFixed(4)}° N</span>
          <span>Longitude: ${lng.toFixed(4)}° E</span>
    `;
    
    // Add time information if available
    if (lowerWaypoint.estimatedDeparture && upperWaypoint.estimatedArrival) {
      const departureTime = new Date(lowerWaypoint.estimatedDeparture);
      const arrivalTime = new Date(upperWaypoint.estimatedArrival);
      const totalTimeMs = arrivalTime.getTime() - departureTime.getTime();
      const currentTimeMs = departureTime.getTime() + (totalTimeMs * partialDistance);
      const currentTime = new Date(currentTimeMs);
      
      popupContent += `
        <span style="grid-column: span 2; margin-top: 4px;">Estimated Time: ${format(currentTime, 'yyyy-MM-dd HH:mm')}</span>
      `;
    }
    
    popupContent += `
        </div>
        <div style="font-size: 12px; margin-top: 8px;">
          <span style="color: #666;">Between waypoints ${lowerIndex + 1} and ${upperIndex + 1}</span>
          <div style="display: flex; gap: 4px; margin-top: 4px; align-items: center;">
            <span style="border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px; font-size: 10px;">
              ${lowerWaypoint.name || `Waypoint ${lowerIndex + 1}`}
            </span>
            <span style="color: #666;">→</span>
            <span style="border: 1px solid #ddd; border-radius: 4px; padding: 2px 6px; font-size: 10px;">
              ${upperWaypoint.name || `Waypoint ${upperIndex + 1}`}
            </span>
          </div>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);
  };
  
  // Show message when no waypoints are available
  if (waypoints.length === 0) {
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
          {/* Windy Map Container */}
          <div 
            ref={mapContainerRef} 
            className="absolute top-0 left-0 w-full h-full"
            style={{ minHeight: "400px" }}
          />
          
          {/* Loading state */}
          {(!apiKey || !isScriptLoaded || !isMapInitialized) && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm">Loading weather map...</p>
              </div>
            </div>
          )}
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