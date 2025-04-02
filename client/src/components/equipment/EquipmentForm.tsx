import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface Equipment {
  id: number;
  name: string;
  category: string;
  model: string;
  manufacturer: string;
  serialNumber: string | null;
  installationDate: string | null;
  runtime: number;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  nextServiceHours: number | null;
  notes: string | null;
  status: string;
  location: string | null;
}

interface EquipmentFormProps {
  equipment: Equipment | null;
  onClose: () => void;
}

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  model: z.string().min(1, "Model is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  serialNumber: z.string().nullable(),
  installationDate: z.date().nullable(),
  runtime: z.string().transform(val => parseFloat(val)),
  lastServiceDate: z.date().nullable(),
  nextServiceDate: z.date().nullable(),
  nextServiceHours: z.string().nullable().transform(val => val ? parseFloat(val) : null),
  notes: z.string().nullable(),
  status: z.string().min(1, "Status is required"),
  location: z.string().nullable(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

const EquipmentForm: React.FC<EquipmentFormProps> = ({ equipment, onClose }) => {
  const { toast } = useToast();
  const isEditMode = Boolean(equipment);

  const defaultValues: EquipmentFormValues = {
    name: equipment?.name || "",
    category: equipment?.category || "mechanical",
    model: equipment?.model || "",
    manufacturer: equipment?.manufacturer || "",
    serialNumber: equipment?.serialNumber || "",
    installationDate: equipment?.installationDate ? new Date(equipment.installationDate) : null,
    runtime: equipment?.runtime ? equipment.runtime.toString() : "0",
    lastServiceDate: equipment?.lastServiceDate ? new Date(equipment.lastServiceDate) : null,
    nextServiceDate: equipment?.nextServiceDate ? new Date(equipment.nextServiceDate) : null,
    nextServiceHours: equipment?.nextServiceHours ? equipment.nextServiceHours.toString() : null,
    notes: equipment?.notes || "",
    status: equipment?.status || "operational",
    location: equipment?.location || "",
  };

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues,
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      return apiRequest("POST", "/api/equipment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Equipment created",
        description: "The equipment has been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create equipment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      if (!equipment) throw new Error("Equipment not found");
      return apiRequest("PATCH", `/api/equipment/${equipment.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Equipment updated",
        description: "The equipment has been updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update equipment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormValues) => {
    if (isEditMode) {
      updateEquipmentMutation.mutate(data);
    } else {
      createEquipmentMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter equipment name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="navigation">Navigation</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input placeholder="Enter manufacturer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Enter model" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter serial number" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter location on yacht" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="installationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Installation Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={"pl-3 text-left font-normal"}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="maintenance_required">Maintenance Required</SelectItem>
                    <SelectItem value="non_operational">Non-Operational</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="runtime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Runtime (hours)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter runtime hours" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>Current equipment runtime in hours</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextServiceHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Service Hours</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter next service hours" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>Runtime hours when next service is due</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lastServiceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Last Service Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={"pl-3 text-left font-normal"}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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
            name="nextServiceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Next Service Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={"pl-3 text-left font-normal"}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
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
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any notes or additional information"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}
          >
            {createEquipmentMutation.isPending || updateEquipmentMutation.isPending ? 
              "Saving..." : 
              isEditMode ? "Update Equipment" : "Add Equipment"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EquipmentForm;
