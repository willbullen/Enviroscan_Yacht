import { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VoyageCalculator } from '@/components/voyage/VoyageCalculator';
import { useVesselQuery } from '@/hooks/useVesselQuery';
import MainLayout from '@/components/layout/MainLayout';

type Voyage = {
  id: number;
  vesselId: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  fuelConsumption: string | null;
  distance: string | null;
  notes: string | null;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
};

type Waypoint = {
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
};

export function VoyageDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const voyageId = parseInt(id);
  const { toast } = useToast();
  
  // Get voyage details
  const voyageQuery = useVesselQuery<Voyage>(
    `/api/voyages/${voyageId}`,
    { enabled: !isNaN(voyageId) }
  );
  
  // Get waypoints
  const waypointsQuery = useVesselQuery<Waypoint[]>(
    `/api/waypoints?voyageId=${voyageId}`,
    { enabled: !isNaN(voyageId) }
  );
  
  const isLoading = voyageQuery.isLoading || waypointsQuery.isLoading;
  const isError = voyageQuery.isError || waypointsQuery.isError;
  const error = voyageQuery.error || waypointsQuery.error;
  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Voyage</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as Error)?.message || 'Failed to load voyage details'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const voyage = voyageQuery.data;
  const waypoints = waypointsQuery.data || [];
  
  if (!voyage) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Voyage Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested voyage could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MainLayout title={voyage.name}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{voyage.name}</h1>
          <p className="text-muted-foreground">
            {voyage.status.charAt(0).toUpperCase() + voyage.status.slice(1)} Voyage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/voyages">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to List
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Voyage Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">Start Date</dt>
                <dd className="text-sm col-span-2">{formatDate(voyage.startDate)}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">End Date</dt>
                <dd className="text-sm col-span-2">{formatDate(voyage.endDate)}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="text-sm col-span-2 capitalize">{voyage.status}</dd>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">Notes</dt>
                <dd className="text-sm col-span-2">{voyage.notes || 'No notes'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Waypoints</CardTitle>
            <CardDescription>
              {waypoints.length} waypoints defined for this voyage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {waypoints.length === 0 ? (
                <p className="text-muted-foreground">No waypoints added yet</p>
              ) : (
                waypoints
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((waypoint, index) => (
                    <div key={waypoint.id} className="border-l-2 border-primary pl-4 pb-4 relative">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary"></div>
                      <h4 className="font-medium">
                        {waypoint.name || `Waypoint ${index + 1}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {waypoint.latitude}, {waypoint.longitude}
                      </p>
                      {waypoint.estimatedArrival && (
                        <p className="text-xs mt-1">
                          Arrival: {formatDate(waypoint.estimatedArrival)}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <VoyageCalculator voyageId={voyageId} />
      </div>
    </MainLayout>
  );
}