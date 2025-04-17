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
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Gauge className="h-4 w-4 mr-2 text-primary" />
              Voyage Calculations
            </CardTitle>
            <CardDescription className="text-xs">Fuel, duration, and distances</CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="ghost" size="sm" className="h-7">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-4">
        {/* Summary metrics - more compact */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/30 rounded p-2 border">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs text-muted-foreground">Distance</h4>
                <p className="text-base font-semibold">{formatDistance(data.totalDistance)}</p>
              </div>
              <LocateFixed className="h-4 w-4 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/30 rounded p-2 border">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs text-muted-foreground">Duration</h4>
                <p className="text-base font-semibold">{formatDuration(data.durationHours)}</p>
              </div>
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </div>
          
          <div className="bg-muted/30 rounded p-2 border">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs text-muted-foreground">Fuel</h4>
                <p className="text-base font-semibold">{formatFuel(data.totalFuelConsumption)}</p>
              </div>
              <Fuel className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {/* Leg details section - more compact */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Route Leg Details</h3>
            <Badge variant="outline" className="text-xs">
              {data.waypoints.length} Waypoints
            </Badge>
          </div>
          
          <div className="space-y-3">
            {data.waypoints.map((waypoint, index) => {
              // Skip the first waypoint when displaying legs (it's the starting point)
              const isFirstWaypoint = index === 0;
              const isLastWaypoint = index === data.waypoints.length - 1;
              
              return (
                <div key={waypoint.id} className={`border rounded ${isFirstWaypoint ? 'bg-muted/10' : ''} text-sm overflow-hidden`}>
                  <div className="p-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex h-6 w-6 rounded-full bg-primary/10 items-center justify-center mr-2">
                          {isFirstWaypoint ? (
                            <Anchor className="h-3 w-3 text-primary" />
                          ) : (
                            <LocateFixed className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-xs">{waypoint.name || `Waypoint ${index + 1}`}</h4>
                          <p className="text-xs text-muted-foreground">
                            {waypoint.latitude.substring(0, 8)}, {waypoint.longitude.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={isFirstWaypoint ? 'outline' : 'secondary'} className="text-xs">
                          {isFirstWaypoint ? 'Start' : `Leg ${index}`}
                        </Badge>
                      </div>
                    </div>
                    
                    {!isFirstWaypoint && (
                      <div className="bg-muted/10 rounded mt-2 p-2 flex items-center justify-between text-xs">
                        <div className="flex space-x-3">
                          <div className="flex items-center">
                            <LocateFixed className="h-3 w-3 text-muted-foreground mr-1" />
                            <span>{waypoint.distance ? `${waypoint.distance} NM` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                            <span>{formatDuration(waypoint.estimatedDuration)}</span>
                          </div>
                          <div className="flex items-center">
                            <Fuel className="h-3 w-3 text-muted-foreground mr-1" />
                            <span>{formatFuel(waypoint.estimatedFuelConsumption)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">RPM:</span>
                          <input
                            type="number"
                            className="w-16 h-6 px-1 text-xs rounded border border-input bg-background"
                            value={waypoint.engineRpm || ''}
                            placeholder="RPM"
                            disabled={isUpdating[waypoint.id]}
                            onChange={(e) => {
                              const rpm = e.target.value ? parseInt(e.target.value) : null;
                              updateWaypointRpm(waypoint.id, rpm);
                            }}
                          />
                          {isUpdating[waypoint.id] && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!isLastWaypoint && (
                    <div className="flex justify-center">
                      <div className="h-3 border-l border-dashed opacity-50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 px-4 pb-3">
        <p className="text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          Calculations are estimates based on engine performance data.
        </p>
      </CardFooter>
    </Card>
  );
}