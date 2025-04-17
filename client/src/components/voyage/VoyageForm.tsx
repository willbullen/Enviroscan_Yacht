import { useState, useEffect } from 'react';
import { useNavigate } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useVessel } from '@/contexts/VesselContext';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

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

export function VoyageForm({ voyageId, defaultValues, onSuccess }: VoyageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [navigate, setLocation] = useNavigate();
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

  // Handle form submission
  const onSubmit = async (data: VoyageFormValues) => {
    setIsSubmitting(true);

    try {
      const endpoint = voyageId ? `/api/voyages/${voyageId}` : '/api/voyages';
      const method = voyageId ? 'PATCH' : 'POST';

      const response = await apiRequest(endpoint, {
        method,
        data,
      });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{voyageId ? 'Edit Voyage' : 'Create New Voyage'}</CardTitle>
        <CardDescription>
          {voyageId 
            ? 'Update voyage details and settings' 
            : 'Enter details to create a new voyage plan'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => voyageId ? onSuccess?.() : navigate('/voyages')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}