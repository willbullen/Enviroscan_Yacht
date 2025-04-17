import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
  
  const { data, isLoading, isError, error, refetch } = useQuery<VoyageCalculation>({
    queryKey: [`/api/voyages/${voyageId}/calculate`],
    enabled: !!voyageId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Calculation Error</CardTitle>
          <CardDescription>Failed to calculate voyage metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{(error as Error)?.message || 'Unknown error occurred'}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Please check voyage configuration and try again</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => refetch()} variant="outline">Calculate</Button>
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
        <CardTitle>Voyage Calculation</CardTitle>
        <CardDescription>Estimated fuel consumption and duration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Total Distance</h4>
            <p className="text-2xl font-bold">{formatDistance(data.totalDistance)}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Estimated Duration</h4>
            <p className="text-2xl font-bold">{formatDuration(data.durationHours)}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Fuel Consumption</h4>
            <p className="text-2xl font-bold">{formatFuel(data.totalFuelConsumption)}</p>
          </div>
        </div>

        <Separator className="my-4" />
        
        <h3 className="text-lg font-semibold mb-2">Leg Details</h3>
        <div className="space-y-4">
          {data.waypoints.map((waypoint, index) => {
            // Skip the first waypoint when displaying legs (it's the starting point)
            const isFirstWaypoint = index === 0;
            const isLastWaypoint = index === data.waypoints.length - 1;
            
            return (
              <div key={waypoint.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{waypoint.name || `Waypoint ${index + 1}`}</h4>
                    <p className="text-sm text-muted-foreground">
                      {waypoint.latitude}, {waypoint.longitude}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {index > 0 ? `Leg ${index}` : 'Starting Point'}
                    </p>
                  </div>
                </div>
                
                {!isFirstWaypoint && (
                  <>
                    <div className="flex justify-between items-center mt-2 mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Engine RPM:</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="w-24 h-8 px-2 text-sm rounded border border-input bg-background"
                          value={waypoint.engineRpm || ''}
                          placeholder="RPM"
                          onChange={async (e) => {
                            // Update the engine RPM for this waypoint
                            const rpm = e.target.value ? parseInt(e.target.value) : null;
                            
                            try {
                              const response = await fetch(`/api/waypoints/${waypoint.id}`, {
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
                                refetch();
                                
                                toast({
                                  title: 'Updated',
                                  description: `Engine RPM updated for ${waypoint.name || `Waypoint ${index + 1}`}`,
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
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">RPM</span>
                      </div>
                    </div>
                  
                    <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Distance: </span>
                        {waypoint.distance ? `${waypoint.distance} NM` : 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Est. Duration: </span>
                        {formatDuration(waypoint.estimatedDuration)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fuel: </span>
                        {formatFuel(waypoint.estimatedFuelConsumption)}
                      </div>
                    </div>
                  </>
                )}
                
                {!isLastWaypoint && (
                  <div className="flex justify-center mt-4">
                    <div className="h-6 border-l-2 border-dashed" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => refetch()} variant="outline">Refresh Calculation</Button>
      </CardFooter>
    </Card>
  );
}