import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  ArrowLeft, 
  PencilIcon, 
  Anchor, 
  Ship, 
  Calendar, 
  Clock, 
  MapPin, 
  LocateFixed,
  FileText,
  Fuel,
  Route,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Download,
  Share2,
  Printer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VoyageCalculator } from '@/components/voyage/VoyageCalculator';
import { VoyageMap } from '@/components/voyage/VoyageMap';
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
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
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

  // Status badge variant based on status
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'planned':
        return 'outline';
      case 'active':
        return 'default';
      case 'completed':
        return 'success';
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'active':
        return <Navigation className="h-4 w-4 mr-1" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'canceled':
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading voyage details...</p>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto mt-8 px-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Voyage</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{(error as Error)?.message || 'Failed to load voyage details'}</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={() => navigate('/voyages')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Voyages
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const voyage = voyageQuery.data;
  const waypoints = waypointsQuery.data || [];
  
  if (!voyage) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto mt-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Voyage Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">The requested voyage could not be found.</p>
              <Button variant="outline" onClick={() => navigate('/voyages')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Voyages
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header section with title, status, and actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{voyage.name}</h1>
            <Badge variant={getStatusVariant(voyage.status)} className="ml-2 capitalize flex items-center">
              {getStatusIcon(voyage.status)}
              {voyage.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center">
            <Ship className="h-4 w-4 mr-1" />
            Vessel ID: {voyage.vesselId} • Created: {formatDate(voyage.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/voyages/${id}/edit`}>
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/voyages">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Quick info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Departure</p>
                <p className="text-lg font-semibold">{formatDate(voyage.startDate)}</p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Arrival</p>
                <p className="text-lg font-semibold">{formatDate(voyage.endDate)}</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Waypoints</p>
                <p className="text-lg font-semibold">{waypoints.length}</p>
              </div>
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize">{voyage.status}</p>
              </div>
              {getStatusIcon(voyage.status) || <Navigation className="h-5 w-5 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main content with tabs */}
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:w-[400px] mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Ship className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="route" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Route
          </TabsTrigger>
          <TabsTrigger value="calculations" className="flex items-center gap-1">
            <Fuel className="h-4 w-4" />
            Calculations
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Voyage Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="grid grid-cols-3 gap-1">
                    <dt className="text-sm font-medium text-muted-foreground">Voyage Name</dt>
                    <dd className="text-sm col-span-2">{voyage.name}</dd>
                  </div>
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
                    <dd className="text-sm col-span-2 capitalize flex items-center">
                      <Badge variant={getStatusVariant(voyage.status)} className="mr-2 capitalize flex items-center">
                        {getStatusIcon(voyage.status)}
                        {voyage.status}
                      </Badge>
                    </dd>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                    <dd className="text-sm col-span-2">{formatDate(voyage.createdAt)}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                    <dd className="text-sm col-span-2">{formatDate(voyage.updatedAt)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Notes & Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                    <div className="text-sm p-3 border rounded-md bg-muted/10 min-h-[100px]">
                      {voyage.notes || 'No additional notes for this voyage.'}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Voyage Summary</h4>
                    <div className="border rounded-md p-3">
                      <div className="grid grid-cols-2 gap-y-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Waypoints</p>
                          <p className="text-sm font-medium">{waypoints.length}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Distance</p>
                          <p className="text-sm font-medium">{voyage.distance || 'Calculating...'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Fuel Consumption</p>
                          <p className="text-sm font-medium">{voyage.fuelConsumption || 'Calculating...'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm font-medium capitalize">{voyage.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('route')}>
                    View Route Details
                    <MapPin className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {waypoints.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Route Overview</CardTitle>
                <CardDescription>
                  Quick view of the planned route with {waypoints.length} waypoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mb-4">
                  <VoyageMap 
                    voyageId={voyageId} 
                    waypoints={waypoints} 
                    onWaypointsChange={() => {}} 
                    readOnly={true} 
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setActiveTab('route')}>
                    View Detailed Route
                    <Route className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Route Tab Content */}
        <TabsContent value="route" className="space-y-6">
          <div className="grid md:grid-cols-[1fr_350px] gap-6">
            <Card className="order-2 md:order-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Route Map</CardTitle>
                <CardDescription>
                  Visual representation of the voyage route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <VoyageMap 
                    voyageId={voyageId} 
                    waypoints={waypoints} 
                    onWaypointsChange={() => {}} 
                    readOnly={true} 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="order-1 md:order-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Waypoints</CardTitle>
                <CardDescription>
                  {waypoints.length} waypoints defined for this voyage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  <div className="space-y-4">
                    {waypoints.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center border rounded-md border-dashed">
                        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No waypoints added yet</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          asChild
                        >
                          <Link to={`/voyages/${id}/edit`}>
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit Voyage
                          </Link>
                        </Button>
                      </div>
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
                            {waypoint.engineRpm && (
                              <p className="text-xs mt-1">
                                Engine RPM: {waypoint.engineRpm}
                              </p>
                            )}
                            {waypoint.estimatedArrival && (
                              <p className="text-xs mt-1">
                                Arrival: {formatDate(waypoint.estimatedArrival)}
                              </p>
                            )}
                            {waypoint.notes && (
                              <p className="text-xs mt-1 text-muted-foreground italic">
                                "{waypoint.notes}"
                              </p>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full justify-center"
                  onClick={() => setActiveTab('calculations')}
                >
                  View Calculations
                  <Fuel className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Calculations Tab Content */}
        <TabsContent value="calculations" className="space-y-6">
          <VoyageCalculator voyageId={voyageId} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}