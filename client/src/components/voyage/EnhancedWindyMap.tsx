import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, RefreshCw, Map, Clock, Calendar } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

// Define Waypoint type
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

// Define props interface
interface EnhancedWindyMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  voyageId?: number;
  waypoints?: Waypoint[];
  voyageStartDate?: string | null;
  voyageEndDate?: string | null;
}

export function EnhancedWindyMap({ 
  latitude = 43.0, 
  longitude = 5.0, 
  zoom = 7,
  voyageId,
  waypoints = [],
  voyageStartDate,
  voyageEndDate
}: EnhancedWindyMapProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSliderPosition, setTimeSliderPosition] = useState(0); // 0-100%
  const [weatherLayer, setWeatherLayer] = useState('wind');
  const [forecastTime, setForecastTime] = useState<Date>(new Date());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Calculate the forecast time based on the time slider position
  useEffect(() => {
    if (!voyageStartDate || !voyageEndDate) {
      // If no voyage dates, just use current time
      setForecastTime(new Date());
      return;
    }
    
    const startTime = new Date(voyageStartDate).getTime();
    const endTime = new Date(voyageEndDate).getTime();
    const totalDuration = endTime - startTime;
    
    // Calculate the time at the current slider position
    const currentTime = new Date(startTime + (totalDuration * (timeSliderPosition / 100)));
    setForecastTime(currentTime);
  }, [timeSliderPosition, voyageStartDate, voyageEndDate]);
  
  // Generate path coordinates for waypoints
  const getWaypointPathParameters = () => {
    if (waypoints.length < 2) return '';
    
    // Collect all waypoint coordinates pairs
    const coordinates = waypoints.map(waypoint => {
      return `${waypoint.latitude},${waypoint.longitude}`;
    });
    
    // Join coordinates with semicolons to form a path
    return coordinates.join(';');
  };
  
  // Fetch the Windy API key from the server
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const response = await fetch('/api/config/windy-keys');
        if (!response.ok) {
          throw new Error(`Failed to fetch API key: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.WINDY_MAP_FORECAST_KEY) {
          console.log('Successfully retrieved Windy API key');
          setApiKey(data.WINDY_MAP_FORECAST_KEY);
          setLoading(false);
        } else {
          throw new Error('No API key found in response');
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
        setError('Failed to fetch API key. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchApiKey();
  }, []);

  // Update the iframe source when parameters change
  useEffect(() => {
    if (iframeRef.current && apiKey) {
      // Convert forecastTime to timestamp
      const timestamp = Math.floor(forecastTime.getTime() / 1000);
      
      // Update iframe src attribute with new parameters
      const src = getWindyUrl(weatherLayer, timestamp);
      if (iframeRef.current.src !== src) {
        iframeRef.current.src = src;
      }
    }
  }, [apiKey, weatherLayer, forecastTime]);
  
  // Create the iframe URL with the API key and parameters
  const getWindyUrl = (overlay = 'wind', timestamp?: number) => {
    if (!apiKey) return '';
    
    // Default center to middle waypoint if available, otherwise use provided lat/long
    const centerIndex = Math.floor(waypoints.length / 2);
    const centerLat = waypoints.length > 0 ? parseFloat(waypoints[centerIndex < 0 ? 0 : centerIndex].latitude) : latitude;
    const centerLon = waypoints.length > 0 ? parseFloat(waypoints[centerIndex < 0 ? 0 : centerIndex].longitude) : longitude;
    
    // Build base URL with core parameters
    let url = `https://embed.windy.com/embed2.html?lat=${centerLat}&lon=${centerLon}&zoom=${zoom}&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1&key=${apiKey}`;
    
    // Add timestamp if available for forecast time
    if (timestamp) {
      url += `&timestamp=${timestamp}`;
    }
    
    // Add markers for waypoints with distinct colors and clear labels
    if (waypoints.length > 0) {
      // Start marker - special green marker
      const startWaypoint = waypoints[0];
      url += `&marker=${startWaypoint.latitude},${startWaypoint.longitude},1:${startWaypoint.name || 'Departure'},green`;
      
      // End marker - special red marker 
      const endWaypoint = waypoints[waypoints.length - 1];
      url += `&marker=${endWaypoint.latitude},${endWaypoint.longitude},${waypoints.length}:${endWaypoint.name || 'Arrival'},red`;
      
      // Intermediate waypoints - blue markers
      waypoints.slice(1, waypoints.length - 1).forEach((waypoint, index) => {
        url += `&marker=${waypoint.latitude},${waypoint.longitude},${index+2}:${waypoint.name || `Waypoint ${index+2}`},blue`;
      });
      
      // Add path between all waypoints for route visualization
      // path parameter takes a series of lat,lon points with specific color and width
      // Format is: path=lat1,lon1;lat2,lon2...;latN,lonN,colorHex,width
      const pathCoordinates = getWaypointPathParameters();
      if (pathCoordinates) {
        // Add the path with a bright orange color and width of 3 pixels
        url += `&path=${pathCoordinates},ff5f00,3`;
      }
    }
    
    return url;
  };
  
  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    return format(date, 'MMM dd, yyyy HH:mm');
  };
  
  // Handle reload
  const handleReload = () => {
    window.location.reload();
  };
  
  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Weather Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleReload} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full rounded-md overflow-hidden">
        <div className="h-[500px] flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading weather map...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Weather Map Section */}
      <div className="w-full rounded-md overflow-hidden border">
        <div className="bg-card p-2 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Cloud className="h-4 w-4 mr-1 text-primary" />
            <span className="font-medium text-sm">Weather Map</span>
          </div>
          <div className="text-xs bg-muted px-2 py-1 rounded-sm">
            <Clock className="h-3 w-3 inline-block mr-1" />
            <span>{formatDateForDisplay(forecastTime)}</span>
          </div>
        </div>
        
        <iframe 
          ref={iframeRef}
          title="Windy Weather Map"
          src={getWindyUrl()}
          width="100%" 
          height="500" 
          frameBorder="0"
          style={{ border: 0 }}
          allowFullScreen
        ></iframe>
      </div>
      
      {/* Controls Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Timeline Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Start: {voyageStartDate ? format(new Date(voyageStartDate), 'MMM dd, yyyy') : 'Not set'}</span>
                  <span>End: {voyageEndDate ? format(new Date(voyageEndDate), 'MMM dd, yyyy') : 'Not set'}</span>
                </div>
                
                <Slider
                  value={[timeSliderPosition]}
                  onValueChange={(values) => setTimeSliderPosition(values[0])}
                  max={100}
                  step={1}
                />
                
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTimeSliderPosition(0)}
                  >
                    Start
                  </Button>
                  
                  <div className="grid grid-cols-3 gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setTimeSliderPosition(25)}
                    >
                      25%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setTimeSliderPosition(50)}
                    >
                      50%
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setTimeSliderPosition(75)}
                    >
                      75%
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTimeSliderPosition(100)}
                  >
                    End
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Map className="h-4 w-4 mr-2" />
              Weather Layers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={weatherLayer} onValueChange={setWeatherLayer} className="w-full">
              <TabsList className="grid grid-cols-3 gap-1 mb-0 h-auto">
                <TabsTrigger value="wind" className="h-8 py-1 px-2 text-xs">Wind</TabsTrigger>
                <TabsTrigger value="rain" className="h-8 py-1 px-2 text-xs">Rain</TabsTrigger>
                <TabsTrigger value="temp" className="h-8 py-1 px-2 text-xs">Temperature</TabsTrigger>
                <TabsTrigger value="clouds" className="h-8 py-1 px-2 text-xs">Clouds</TabsTrigger>
                <TabsTrigger value="waves" className="h-8 py-1 px-2 text-xs">Waves</TabsTrigger>
                <TabsTrigger value="currents" className="h-8 py-1 px-2 text-xs">Currents</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                {waypoints.length > 0 ? (
                  <>The voyage consists of {waypoints.length} waypoints. Use the timeline slider to see weather conditions at different points during the voyage.</>
                ) : (
                  <>No waypoints have been set for this voyage. Add waypoints to see weather conditions along the route.</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Waypoints Table */}
      {waypoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Voyage Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="overflow-auto max-h-[300px]">
                <table className="w-full text-sm caption-bottom">
                  <thead className="bg-muted/50">
                    <tr className="border-b text-xs">
                      <th className="h-8 px-2 text-left font-medium">#</th>
                      <th className="h-8 px-2 text-left font-medium">Position</th>
                      <th className="h-8 px-2 text-left font-medium">Name</th>
                      <th className="h-8 px-2 text-left font-medium">Est. Arrival</th>
                      <th className="h-8 px-2 text-left font-medium">Est. Departure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waypoints.map((waypoint, index) => (
                      <tr key={waypoint.id || index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <div>
                            <div className="font-mono text-xs">
                              {parseFloat(waypoint.latitude).toFixed(4)}°N
                            </div>
                            <div className="font-mono text-xs">
                              {parseFloat(waypoint.longitude).toFixed(4)}°E
                            </div>
                          </div>
                        </td>
                        <td className="p-2">{waypoint.name || `Waypoint ${index + 1}`}</td>
                        <td className="p-2">
                          {waypoint.estimatedArrival 
                            ? format(new Date(waypoint.estimatedArrival), 'MMM dd, HH:mm')
                            : 'Not set'}
                        </td>
                        <td className="p-2">
                          {waypoint.estimatedDeparture 
                            ? format(new Date(waypoint.estimatedDeparture), 'MMM dd, HH:mm')
                            : 'Not set'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">
              <span className="font-semibold">Route visualization:</span> The voyage route is displayed as an orange line connecting all waypoints.
              Start point is marked in green, end point in red, and intermediate waypoints in blue.
              Use the timeline controls to see weather conditions at different points during the voyage.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}