import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Fuel, Gauge, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

// Data types for fuel consumption and speed data
type FuelConsumptionDataPoint = {
  id: number;
  vesselId: number;
  engineRpm: number;
  fuelConsumptionRate: number;
  createdAt: string;
  updatedAt: string;
};

type SpeedDataPoint = {
  id: number;
  vesselId: number;
  engineRpm: number;
  speed: number;
  createdAt: string;
  updatedAt: string;
};

interface PerformanceCurvesProps {
  vesselId: number;
}

export function PerformanceCurves({ vesselId }: PerformanceCurvesProps) {
  const [activeTab, setActiveTab] = React.useState('fuel');

  // Fetch fuel consumption data
  const fuelConsumptionQuery = useQuery({
    queryKey: ['vessels', vesselId, 'fuel-consumption-data'],
    queryFn: async () => {
      const response = await apiRequest<FuelConsumptionDataPoint[]>(`/api/vessels/${vesselId}/fuel-consumption-data`, {
        method: 'GET'
      });
      return response;
    },
    enabled: !!vesselId,
  });

  // Fetch speed data
  const speedDataQuery = useQuery({
    queryKey: ['vessels', vesselId, 'speed-data'],
    queryFn: async () => {
      const response = await apiRequest<SpeedDataPoint[]>(`/api/vessels/${vesselId}/speed-data`, {
        method: 'GET'
      });
      return response;
    },
    enabled: !!vesselId,
  });

  // Format data for charts
  const formatFuelData = (data: FuelConsumptionDataPoint[] | undefined) => {
    if (!data || data.length === 0) {
      // If no data, return a sample curve with a note that it's estimated
      return Array.from({ length: 10 }, (_, i) => {
        const rpm = 500 + i * 200;
        const estimatedConsumption = (0.05 * Math.pow(rpm / 500, 2)).toFixed(2);
        return {
          rpm,
          consumption: parseFloat(estimatedConsumption),
          isEstimated: true
        };
      });
    }
    
    // Sort data by engine RPM
    return data
      .sort((a, b) => a.engineRpm - b.engineRpm)
      .map(point => ({
        rpm: point.engineRpm,
        consumption: point.fuelConsumptionRate,
        isEstimated: false
      }));
  };

  const formatSpeedData = (data: SpeedDataPoint[] | undefined) => {
    if (!data || data.length === 0) {
      // If no data, return a sample curve with a note that it's estimated
      return Array.from({ length: 10 }, (_, i) => {
        const rpm = 500 + i * 200;
        const estimatedSpeed = (2 + (rpm - 500) / 200).toFixed(1);
        return {
          rpm,
          speed: parseFloat(estimatedSpeed),
          isEstimated: true
        };
      });
    }
    
    // Sort data by engine RPM
    return data
      .sort((a, b) => a.engineRpm - b.engineRpm)
      .map(point => ({
        rpm: point.engineRpm,
        speed: point.speed,
        isEstimated: false
      }));
  };

  const fuelData = formatFuelData(fuelConsumptionQuery.data);
  const speedData = formatSpeedData(speedDataQuery.data);

  // Loading states
  const isLoading = fuelConsumptionQuery.isLoading || speedDataQuery.isLoading;
  const isError = fuelConsumptionQuery.isError || speedDataQuery.isError;
  const error = fuelConsumptionQuery.error || speedDataQuery.error;

  // Determine if we're showing estimated data
  const isFuelEstimated = !fuelConsumptionQuery.data || fuelConsumptionQuery.data.length === 0;
  const isSpeedEstimated = !speedDataQuery.data || speedDataQuery.data.length === 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Curves</CardTitle>
          <CardDescription>Loading vessel performance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Curves</CardTitle>
          <CardDescription>Error loading performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message || 'Failed to load vessel performance data'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // More compact combined visualization approach
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Performance Curves</CardTitle>
            <CardDescription className="text-xs">
              Engine RPM relationships
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center rounded px-2 py-1 ${activeTab === 'fuel' ? 'bg-muted' : ''}`}>
              <button 
                onClick={() => setActiveTab('fuel')} 
                className="text-xs flex items-center font-medium"
              >
                <Fuel className="h-3 w-3 mr-1 text-purple-500" />
                Fuel
              </button>
            </div>
            <div className={`flex items-center rounded px-2 py-1 ${activeTab === 'speed' ? 'bg-muted' : ''}`}>
              <button 
                onClick={() => setActiveTab('speed')} 
                className="text-xs flex items-center font-medium"
              >
                <Gauge className="h-3 w-3 mr-1 text-green-500" />
                Speed
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Fuel Consumption Chart */}
        {activeTab === 'fuel' && (
          <div className="px-4 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={fuelData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
                  <XAxis 
                    dataKey="rpm" 
                    label={{ value: 'Engine RPM', position: 'insideBottom', offset: 0, fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    label={{ value: 'L/h', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} L/h`, 'Consumption']} 
                    contentStyle={{ fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="consumption" 
                    name="Fuel Consumption" 
                    stroke="#8884d8" 
                    activeDot={{ r: 6 }} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {isFuelEstimated && (
              <div className="text-xs text-amber-500 flex items-center mt-1">
                <Info className="h-3 w-3 mr-1" />
                Based on estimated values. Add actual readings for accuracy.
              </div>
            )}
          </div>
        )}
        
        {/* Speed Chart */}
        {activeTab === 'speed' && (
          <div className="px-4 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={speedData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.1} />
                  <XAxis 
                    dataKey="rpm" 
                    label={{ value: 'Engine RPM', position: 'insideBottom', offset: 0, fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    label={{ value: 'knots', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} knots`, 'Speed']} 
                    contentStyle={{ fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    name="Speed Through Water" 
                    stroke="#82ca9d" 
                    activeDot={{ r: 6 }} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {isSpeedEstimated && (
              <div className="text-xs text-amber-500 flex items-center mt-1">
                <Info className="h-3 w-3 mr-1" />
                Based on estimated values. Add actual readings for accuracy.
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between py-2 px-4 bg-muted/10">
        <span className="text-xs text-muted-foreground">
          Vessel ID: {vesselId}
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <Info className="h-3 w-3 mr-1" />
          Add Data
        </Button>
      </CardFooter>
    </Card>
  );
}