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
import { Checkbox } from "@/components/ui/checkbox";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  description: string | null;
  quantity: number;
  unit: string;
  minQuantity: number;
  location: string | null;
  partNumber: string | null;
  supplier: string | null;
  cost: number | null;
  lastRestockDate: string | null;
  compatibleEquipmentIds: number[] | null;
}

interface Equipment {
  id: number;
  name: string;
  model: string;
}

interface InventoryFormProps {
  item: InventoryItem | null;
  equipment: Equipment[];
  onClose: () => void;
}

const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().nullable(),
  quantity: z.string().transform((val) => parseInt(val)),
  unit: z.string().min(1, "Unit is required"),
  minQuantity: z.string().transform((val) => parseInt(val)),
  location: z.string().nullable(),
  partNumber: z.string().nullable(),
  supplier: z.string().nullable(),
  cost: z.string()
    .nullable()
    .transform((val) => (val && val !== "" ? parseFloat(val) : null)),
  lastRestockDate: z.date().nullable(),
  compatibleEquipmentIds: z.array(z.string()).transform(vals => 
    vals.map(val => parseInt(val))
  ),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

const InventoryForm: React.FC<InventoryFormProps> = ({ item, equipment, onClose }) => {
  const { toast } = useToast();
  const isEditMode = Boolean(item);

  const defaultValues: InventoryFormValues = {
    name: item?.name || "",
    category: item?.category || "Fluids",
    description: item?.description || "",
    quantity: item?.quantity ? item.quantity.toString() : "0",
    unit: item?.unit || "units",
    minQuantity: item?.minQuantity ? item.minQuantity.toString() : "5",
    location: item?.location || "",
    partNumber: item?.partNumber || "",
    supplier: item?.supplier || "",
    cost: item?.cost ? item.cost.toString() : "",
    lastRestockDate: item?.lastRestockDate ? new Date(item.lastRestockDate) : null,
    compatibleEquipmentIds: item?.compatibleEquipmentIds 
      ? item.compatibleEquipmentIds.map(id => id.toString())
      : [],
  };

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues,
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      return apiRequest("POST", "/api/inventory", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Inventory item created",
        description: "The inventory item has been created successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create inventory item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      if (!item) throw new Error("Inventory item not found");
      return apiRequest("PATCH", `/api/inventory/${item.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Inventory item updated",
        description: "The inventory item has been updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update inventory item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InventoryFormValues) => {
    if (isEditMode) {
      updateInventoryMutation.mutate(data);
    } else {
      createInventoryMutation.mutate(data);
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
                <FormLabel>Item Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter item name" {...field} />
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
                    <SelectItem value="Fluids">Fluids</SelectItem>
                    <SelectItem value="Filters">Filters</SelectItem>
                    <SelectItem value="Parts">Parts</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter item description"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="Enter quantity" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="gallons">Gallons</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="pcs">Pieces</SelectItem>
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
            name="minQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="Enter minimum quantity" {...field} />
                </FormControl>
                <FormDescription>
                  Reorder point when stock level alerts will be triggered
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter storage location"
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
            name="partNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter part number"
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
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter supplier name"
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
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per Unit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter cost"
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
            name="lastRestockDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Last Restock Date</FormLabel>
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
          name="compatibleEquipmentIds"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Compatible Equipment</FormLabel>
                <FormDescription>
                  Select equipment this inventory item is compatible with
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {equipment.map((equip) => (
                  <FormField
                    key={equip.id}
                    control={form.control}
                    name="compatibleEquipmentIds"
                    render={({ field }) => {
                      const isChecked = field.value.includes(equip.id.toString());
                      return (
                        <FormItem
                          key={equip.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const value = equip.id.toString();
                                if (checked) {
                                  field.onChange([...field.value, value]);
                                } else {
                                  field.onChange(
                                    field.value.filter((val) => val !== value)
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {equip.name} - {equip.model}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
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
            disabled={createInventoryMutation.isPending || updateInventoryMutation.isPending}
          >
            {createInventoryMutation.isPending || updateInventoryMutation.isPending ? 
              "Saving..." : 
              isEditMode ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InventoryForm;
