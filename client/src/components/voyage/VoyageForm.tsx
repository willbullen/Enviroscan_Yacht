import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useVessel } from '@/contexts/VesselContext';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Map, Info, AlertCircle, CheckCircle2, CircleDot, FileText, Ship, Navigation, AnchorIcon, ChevronRight, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoyageMap } from './VoyageMap';

// Define the form schema with validation
const voyageFormSchema = z.object({
  name: z.string().min(1, 'Voyage name is required'),
  vesselId: z.number(),
  status: z.string().default('planned'),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type VoyageFormValues = z.infer<typeof voyageFormSchema>;

interface VoyageFormProps {
  voyageId?: number;
  defaultValues?: VoyageFormValues;
  onSuccess?: () => void;
}

// Define waypoint type for the form
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

export function VoyageForm({ voyageId, defaultValues, onSuccess }: VoyageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isLoadingWaypoints, setIsLoadingWaypoints] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const { currentVessel } = useVessel();

  // Initialize the form with default values
  const form = useForm<VoyageFormValues>({
    resolver: zodResolver(voyageFormSchema),
    defaultValues: defaultValues || {
      name: '',
      vesselId: currentVessel?.id || 1,
      status: 'planned',
      startDate: null,
      endDate: null,
      notes: '',
    },
  });

  // Load voyage data if editing
  useEffect(() => {
    if (voyageId && !defaultValues) {
      setIsLoading(true);
      fetch(`/api/voyages/${voyageId}`)
        .then(response => response.json())
        .then(data => {
          // Transform date strings to Date objects for the form
          const formData = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
          };
          form.reset(formData);
        })
        .catch(error => {
          toast({
            title: 'Error',
            description: 'Failed to load voyage data',
            variant: 'destructive',
          });
          console.error('Failed to load voyage data:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [voyageId, defaultValues, form, toast]);
  
  // Load waypoints if editing a voyage
  useEffect(() => {
    if (voyageId) {
      setIsLoadingWaypoints(true);
      fetch(`/api/waypoints?voyageId=${voyageId}`)
        .then(response => response.json())
        .then(data => {
          setWaypoints(data);
        })
        .catch(error => {
          toast({
            title: 'Error',
            description: 'Failed to load waypoints',
            variant: 'destructive',
          });
          console.error('Failed to load waypoints:', error);
        })
        .finally(() => {
          setIsLoadingWaypoints(false);
        });
    }
  }, [voyageId, toast]);

  // Handle form submission
  const onSubmit = async (data: VoyageFormValues) => {
    setIsSubmitting(true);

    try {
      const endpoint = voyageId ? `/api/voyages/${voyageId}` : '/api/voyages';
      const method = voyageId ? 'PATCH' : 'POST';

      const fetchResponse = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!fetchResponse.ok) {
        throw new Error(`API request failed with status ${fetchResponse.status}`);
      }

      const response = await fetchResponse.json();

      // If creating a new voyage, navigate to its details page
      if (!voyageId && response.id) {
        toast({
          title: 'Success',
          description: 'Voyage created successfully',
        });
        navigate(`/voyages/${response.id}`);
      } else {
        toast({
          title: 'Success',
          description: 'Voyage updated successfully',
        });
        // Update the query cache to reflect changes
        queryClient.invalidateQueries({ queryKey: ['/api/voyages'] });
        if (voyageId) {
          queryClient.invalidateQueries({ queryKey: [`/api/voyages/${voyageId}`] });
        }
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error saving voyage:', error);
      toast({
        title: 'Error',
        description: 'Failed to save voyage',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle changes to the waypoints array
  const handleWaypointsChange = async (newWaypoints: Waypoint[]) => {
    setWaypoints(newWaypoints);
    
    // If we have a voyage ID, we need to sync the waypoints with the server
    if (voyageId) {
      try {
        // First, get the current waypoints from the server
        const response = await fetch(`/api/waypoints?voyageId=${voyageId}`);
        const existingWaypoints = await response.json();
        
        // Process each updated waypoint
        for (const waypoint of newWaypoints) {
          if (waypoint.id) {
            // Update existing waypoint
            const existingWp = existingWaypoints.find((wp: Waypoint) => wp.id === waypoint.id);
            if (existingWp && 
                (waypoint.latitude !== existingWp.latitude || 
                waypoint.longitude !== existingWp.longitude || 
                waypoint.name !== existingWp.name || 
                waypoint.orderIndex !== existingWp.orderIndex)) {
              
              const updateResponse = await fetch(`/api/waypoints/${waypoint.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(waypoint)
              });
              
              if (!updateResponse.ok) {
                throw new Error(`Failed to update waypoint with status ${updateResponse.status}`);
              }
            }
          } else {
            // Create new waypoint
            const createResponse = await fetch('/api/waypoints', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...waypoint,
                voyageId
              })
            });
            
            if (!createResponse.ok) {
              throw new Error(`Failed to create waypoint with status ${createResponse.status}`);
            }
          }
        }
        
        // Find deleted waypoints (those in existingWaypoints but not in newWaypoints)
        for (const existingWp of existingWaypoints) {
          if (!newWaypoints.some(wp => wp.id === existingWp.id)) {
            // Delete this waypoint
            const deleteResponse = await fetch(`/api/waypoints/${existingWp.id}`, {
              method: 'DELETE'
            });
            
            if (!deleteResponse.ok) {
              throw new Error(`Failed to delete waypoint with status ${deleteResponse.status}`);
            }
          }
        }
        
        // Reload the waypoints after changes
        const updatedResponse = await fetch(`/api/waypoints?voyageId=${voyageId}`);
        const updatedWaypoints = await updatedResponse.json();
        setWaypoints(updatedWaypoints);
        
        toast({
          title: 'Success',
          description: 'Waypoints updated successfully',
        });
      } catch (error) {
        console.error('Error updating waypoints:', error);
        toast({
          title: 'Error',
          description: 'Failed to update waypoints',
          variant: 'destructive',
        });
      }
    }
  };

  // Create a new voyage with waypoints
  const onSubmitWithWaypoints = async (data: VoyageFormValues) => {
    setIsSubmitting(true);

    try {
      // First, create or update the voyage using fetch directly to avoid potential issues with apiRequest
      const endpoint = voyageId ? `/api/voyages/${voyageId}` : '/api/voyages';
      const method = voyageId ? 'PATCH' : 'POST';

      const fetchResponse = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!fetchResponse.ok) {
        throw new Error(`API request failed with status ${fetchResponse.status}`);
      }

      const response = await fetchResponse.json();

      // If creating a new voyage, handle waypoints
      if (!voyageId && response.id) {
        const newVoyageId = response.id;
        
        // Save any waypoints that were added before the voyage was created
        if (waypoints.length > 0) {
          try {
            for (const waypoint of waypoints) {
              const waypointResponse = await fetch('/api/waypoints', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...waypoint,
                  voyageId: newVoyageId
                }),
              });
              
              if (!waypointResponse.ok) {
                throw new Error(`Failed to save waypoint with status ${waypointResponse.status}`);
              }
            }
          } catch (error) {
            console.error('Error saving waypoints:', error);
            toast({
              title: 'Warning',
              description: 'Created voyage but failed to save some waypoints',
              variant: 'destructive',
            });
          }
        }

        toast({
          title: 'Success',
          description: 'Voyage created successfully',
        });
        navigate(`/voyages/${newVoyageId}`);
      } else {
        toast({
          title: 'Success',
          description: 'Voyage updated successfully',
        });
        // Update the query cache to reflect changes
        queryClient.invalidateQueries({ queryKey: ['/api/voyages'] });
        if (voyageId) {
          queryClient.invalidateQueries({ queryKey: [`/api/voyages/${voyageId}`] });
        }
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error saving voyage:', error);
      toast({
        title: 'Error',
        description: 'Failed to save voyage',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{voyageId ? 'Edit Voyage' : 'Create New Voyage'}</CardTitle>
            <CardDescription>
              {voyageId 
                ? 'Update voyage details and settings' 
                : 'Enter details to create a new voyage plan'
              }
            </CardDescription>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeTab === 'details' ? 'bg-primary text-primary-foreground' : 'border'}`}>
              <span>1</span>
            </div>
            <ChevronRight className="h-4 w-4" />
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activeTab === 'waypoints' ? 'bg-primary text-primary-foreground' : 'border'}`}>
              <span>2</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="details" className="flex items-center">
              <Ship className="mr-2 h-4 w-4" />
              Voyage Details
            </TabsTrigger>
            <TabsTrigger value="waypoints" className="flex items-center">
              <Navigation className="mr-2 h-4 w-4" />
              Route Planning
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-muted mb-6">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium mb-1">Step 1: Enter Basic Voyage Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by providing a name for your voyage, status, and dates. After completing this step, you'll define waypoints in the next step.
                  </p>
                </div>
              </div>
            </div>
            
            <Form {...form}>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voyage Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter voyage name" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Select date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const startDate = form.getValues("startDate");
                                return startDate ? date < startDate : false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional information about this voyage"
                          className="min-h-[120px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between space-x-2 pt-4">
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveTab('waypoints')}
                  >
                    Next: Set Waypoints
                    <Map className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => voyageId ? onSuccess?.() : navigate('/voyages')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => {
                        const data = form.getValues();
                        form.trigger().then(isValid => {
                          if (isValid) {
                            onSubmitWithWaypoints(data);
                          }
                        });
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        voyageId ? 'Update Voyage' : 'Create Voyage'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          </TabsContent>
          
          <TabsContent value="waypoints" className="space-y-4 mt-4">
            {isLoadingWaypoints ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg border border-muted mb-6">
                  <div className="flex items-start space-x-3">
                    <Navigation className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium mb-1">Step 2: Plan Your Voyage Route</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Define your voyage route by adding waypoints on the map. These will be used to calculate distances, fuel consumption, and estimated arrival times.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">1</div>
                          <span>Click "Add Waypoint" button</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">2</div>
                          <span>Click on the map to place waypoints</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">3</div>
                          <span>Click on a waypoint to edit or remove it</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                  <div>
                    <div className="mb-3">
                      <h3 className="text-lg font-medium mb-1">Marine Chart</h3>
                      <p className="text-sm text-muted-foreground">
                        Interactive map for adding and managing waypoints
                      </p>
                    </div>
                    <VoyageMap 
                      voyageId={voyageId} 
                      waypoints={waypoints} 
                      onWaypointsChange={handleWaypointsChange} 
                    />
                  </div>
                  
                  <div>
                    <div className="mb-3">
                      <h3 className="text-lg font-medium mb-1">Waypoint List</h3>
                      <p className="text-sm text-muted-foreground">
                        All defined waypoints for this voyage
                      </p>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      {waypoints.length === 0 ? (
                        <div className="p-6 text-center">
                          <Map className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">No waypoints added yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use the map to add waypoints to your voyage
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {waypoints.map((waypoint, index) => (
                            <div key={index} className="p-3 hover:bg-muted/50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{waypoint.name || `Waypoint ${index + 1}`}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {waypoint.latitude}, {waypoint.longitude}
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    // Remove this waypoint
                                    const updatedWaypoints = waypoints.filter((_, i) => i !== index);
                                    // Update orderIndex values
                                    const reindexedWaypoints = updatedWaypoints.map((wp, i) => ({
                                      ...wp,
                                      orderIndex: i,
                                    }));
                                    handleWaypointsChange(reindexedWaypoints);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between space-x-2 pt-4">
                  <Button 
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveTab('details')}
                  >
                    <span className="mr-2">Back to Details</span>
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => voyageId ? onSuccess?.() : navigate('/voyages')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => {
                        // Get the current data from the form
                        const data = form.getValues();
                        // Manually trigger validation
                        form.trigger().then(isValid => {
                          if (isValid) {
                            // If form is valid, submit it
                            onSubmitWithWaypoints(data);
                          } else {
                            // If not valid, show an error toast
                            toast({
                              title: "Validation Error",
                              description: "Please check the form for errors",
                              variant: "destructive",
                            });
                            // Switch to details tab to show errors
                            setActiveTab("details");
                          }
                        });
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        voyageId ? 'Update Voyage' : 'Create Voyage'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}