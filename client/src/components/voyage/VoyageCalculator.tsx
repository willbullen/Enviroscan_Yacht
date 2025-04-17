import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  Fuel, 
  Anchor, 
  Clock, 
  LocateFixed, 
  Navigation, 
  CornerDownRight, 
  RefreshCw,
  AlertCircle,
  Ship,
  Gauge
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type WaypointCalculation = {
  id: number;
  voyageId: number;
  orderIndex: number;
  latitude: string;
  longitude: string;
  name: string | null;
  estimatedArrival: string | null;
  estimatedDeparture: string | null;
  plannedSpeed: string | null;
  engineRpm: number | null;
  fuelConsumption: string | null;
  distance: string | null;
  notes: string | null;
  estimatedFuelConsumption: number;
  estimatedDuration: number;
};

type VoyageCalculation = {
  totalFuelConsumption: number;
  totalDistance: number;
  durationHours: number;
  waypoints: WaypointCalculation[];
};

interface VoyageCalculatorProps {
  voyageId: number;
}

export function VoyageCalculator({ voyageId }: VoyageCalculatorProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
  
  const { data, isLoading, isError, error, refetch } = useQuery<VoyageCalculation>({
    queryKey: [`/api/voyages/${voyageId}/calculate`],
    enabled: !!voyageId,
  });

  // Function to update waypoint RPM with loading state
  const updateWaypointRpm = async (waypointId: number, rpm: number | null) => {
    // Set loading state for this specific waypoint
    setIsUpdating(prev => ({ ...prev, [waypointId]: true }));
    
    try {
      const response = await fetch(`/api/waypoints/${waypointId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engineRpm: rpm
        }),
      });
      
      if (response.ok) {
        // If the update was successful, refresh the calculation
        await refetch();
        
        toast({
          title: 'Updated',
          description: `Engine RPM updated successfully`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update engine RPM',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update engine RPM',
        variant: 'destructive',
      });
    } finally {
      // Clear loading state for this waypoint
      setIsUpdating(prev => ({ ...prev, [waypointId]: false }));
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Voyage Calculations</CardTitle>
          <CardDescription>Loading voyage metrics and fuel consumption data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Calculating voyage metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            Calculation Error
          </CardTitle>
          <CardDescription>Failed to calculate voyage metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
            <p>{(error as Error)?.message || 'Unknown error occurred'}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Calculation
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Calculation Data</CardTitle>
          <CardDescription>Please check voyage configuration and try again</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border-2 border-dashed rounded-md flex flex-col items-center justify-center">
            <Ship className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-center text-muted-foreground mb-2">No calculation data is available for this voyage</p>
            <p className="text-center text-xs text-muted-foreground mb-4">This could be because there are no waypoints or the waypoint data is incomplete</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => refetch()} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Calculate Voyage Metrics
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Format values for display
  const formatFuel = (liters: number) => `${Math.round(liters).toLocaleString()} L`;
  const formatDistance = (nm: number) => `${Math.round(nm).toLocaleString()} NM`;
  const formatDuration = (hours: number) => {
    const fullHours = Math.floor(hours);
    const minutes = Math.round((hours - fullHours) * 60);
    return `${fullHours}h ${minutes}m`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gauge className="h-5 w-5 mr-2 text-primary" />
          Voyage Calculations
        </CardTitle>
        <CardDescription>Estimated fuel consumption, duration, and distances</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary/5 rounded-lg p-4 border">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Total Distance</h4>
                <p className="text-2xl font-bold">{formatDistance(data.totalDistance)}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <LocateFixed className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Progress value={100} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">Total nautical miles traveled</p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-4 border">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Estimated Duration</h4>
                <p className="text-2xl font-bold">{formatDuration(data.durationHours)}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Progress value={100} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">Total travel time at configured speeds</p>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-4 border">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Fuel Consumption</h4>
                <p className="text-2xl font-bold">{formatFuel(data.totalFuelConsumption)}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Progress value={100} className="h-1.5 mb-1" />
            <p className="text-xs text-muted-foreground">Estimated total fuel usage</p>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {/* Leg details section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Route Leg Details</h3>
            <Badge variant="outline" className="text-xs">
              {data.waypoints.length} Waypoints
            </Badge>
          </div>
          
          <div className="space-y-6">
            {data.waypoints.map((waypoint, index) => {
              // Skip the first waypoint when displaying legs (it's the starting point)
              const isFirstWaypoint = index === 0;
              const isLastWaypoint = index === data.waypoints.length - 1;
              
              return (
                <div key={waypoint.id} className={`border rounded-lg ${isFirstWaypoint ? 'bg-muted/5' : ''}`}>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="flex h-8 w-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                          {isFirstWaypoint ? (
                            <Anchor className="h-4 w-4 text-primary" />
                          ) : (
                            <LocateFixed className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{waypoint.name || `Waypoint ${index + 1}`}</h4>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Navigation className="h-3 w-3 mr-1" />
                            {waypoint.latitude}, {waypoint.longitude}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={isFirstWaypoint ? 'outline' : 'secondary'} className="mb-1">
                          {isFirstWaypoint ? 'Departure Point' : `Leg ${index}`}
                        </Badge>
                        {!isFirstWaypoint && waypoint.distance && (
                          <p className="text-xs text-muted-foreground">
                            {waypoint.distance} NM from previous
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {!isFirstWaypoint && (
                      <div className="bg-muted/20 rounded-md p-3 mt-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="grid grid-cols-3 gap-2 w-full">
                            <div className="p-2 rounded bg-background/50 border flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-muted-foreground mb-1">Distance</span>
                              <span className="font-semibold text-sm">{waypoint.distance ? `${waypoint.distance} NM` : 'N/A'}</span>
                            </div>
                            <div className="p-2 rounded bg-background/50 border flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-muted-foreground mb-1">Duration</span>
                              <span className="font-semibold text-sm">{formatDuration(waypoint.estimatedDuration)}</span>
                            </div>
                            <div className="p-2 rounded bg-background/50 border flex flex-col items-center justify-center text-center">
                              <span className="text-xs text-muted-foreground mb-1">Fuel</span>
                              <span className="font-semibold text-sm">{formatFuel(waypoint.estimatedFuelConsumption)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 md:min-w-[200px]">
                            <span className="text-sm whitespace-nowrap">Engine RPM:</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                className="w-24 h-8 px-2 text-sm rounded border border-input bg-background"
                                value={waypoint.engineRpm || ''}
                                placeholder="RPM"
                                disabled={isUpdating[waypoint.id]}
                                onChange={(e) => {
                                  const rpm = e.target.value ? parseInt(e.target.value) : null;
                                  updateWaypointRpm(waypoint.id, rpm);
                                }}
                              />
                              <span className="text-xs text-muted-foreground">RPM</span>
                              {isUpdating[waypoint.id] && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!isLastWaypoint && (
                    <div className="flex justify-center my-1">
                      <div className="h-6 border-l-2 border-dashed" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Calculations are estimates based on engine performance data and may vary.
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Calculation
        </Button>
      </CardFooter>
    </Card>
  );
}