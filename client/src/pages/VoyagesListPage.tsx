import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useVesselQuery } from '@/hooks/useVesselQuery';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  CalendarIcon,
  AnchorIcon,
  MapIcon,
  PlusIcon,
  InfoIcon,
} from 'lucide-react';

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

export function VoyagesListPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data, isLoading, isError, error } = useVesselQuery<Voyage[]>('/api/voyages');
  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'planned':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'active':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'completed':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        break;
      case 'canceled':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <div className="max-w-5xl mx-auto mt-8 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Voyages</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{(error as Error)?.message || 'Failed to load voyages'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const voyages = data || [];

  return (
    <div className="max-w-6xl mx-auto mt-6 px-4 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Voyages</h1>
          <p className="text-muted-foreground">
            Plan and manage vessel voyages
          </p>
        </div>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          New Voyage
        </Button>
      </div>
      
      {voyages.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Voyages Found</CardTitle>
            <CardDescription>
              Get started by creating your first voyage
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MapIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground max-w-md">
              Voyages allow you to plan routes, calculate fuel consumption, and track vessel journeys.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Voyage
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Voyages</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voyages.map((voyage) => (
                  <TableRow key={voyage.id}>
                    <TableCell className="font-medium">{voyage.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={voyage.status} />
                    </TableCell>
                    <TableCell>{formatDate(voyage.startDate)}</TableCell>
                    <TableCell>{formatDate(voyage.endDate)}</TableCell>
                    <TableCell>{voyage.distance ? `${voyage.distance} NM` : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link to={`/voyages/${voyage.id}`}>
                            <InfoIcon className="w-4 h-4 mr-1" />
                            Details
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}