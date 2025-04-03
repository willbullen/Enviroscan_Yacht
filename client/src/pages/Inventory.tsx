import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  PlusCircle, 
  Filter, 
  FilterX, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import MainLayout from "@/components/layout/MainLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const Inventory = () => {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [inventoryFormOpen, setInventoryFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const { toast } = useToast();

  // Fetch all inventory items
  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  // Fetch equipment for compatibility selection
  const { data: equipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: async (updatedItem: Partial<InventoryItem> & { id: number }) => {
      const { id, ...itemData } = updatedItem;
      await apiRequest("PATCH", `/api/inventory/${id}`, itemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Inventory updated",
        description: "The inventory item has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update inventory",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Restock inventory mutation
  const restockInventoryMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest("PATCH", `/api/inventory/${id}`, { 
        quantity,
        lastRestockDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Inventory restocked",
        description: "The inventory item has been successfully restocked.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to restock inventory",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Filter inventory based on selectedTab and stockFilter
  const filteredInventory = !inventory
    ? []
    : inventory.filter((item) => {
        // Filter by category
        if (selectedTab !== "all" && item.category.toLowerCase() !== selectedTab.toLowerCase()) {
          return false;
        }
        
        // Filter by stock level
        if (stockFilter) {
          const stockPercentage = (item.quantity / item.minQuantity) * 100;
          
          if (stockFilter === "low" && stockPercentage > 30) {
            return false;
          } else if (stockFilter === "medium" && (stockPercentage <= 30 || stockPercentage > 80)) {
            return false;
          } else if (stockFilter === "good" && stockPercentage <= 80) {
            return false;
          }
        }
        
        return true;
      });

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setInventoryFormOpen(true);
  };

  const handleRestock = (item: InventoryItem) => {
    const newQuantity = window.prompt(
      `Enter the new quantity for ${item.name} (current: ${item.quantity} ${item.unit}):`,
      (item.minQuantity * 2).toString()
    );
    
    if (newQuantity === null) return;
    
    const parsedQuantity = parseInt(newQuantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    restockInventoryMutation.mutate({ id: item.id, quantity: parsedQuantity });
  };

  const clearFilters = () => {
    setStockFilter(null);
  };

  const getStockStatus = (quantity: number, minQuantity: number) => {
    const percentageLeft = (quantity / minQuantity) * 100;
    
    if (percentageLeft <= 30) {
      return {
        icon: <AlertTriangle className="h-4 w-4 mr-1" />,
        label: "Low Stock",
        className: "text-red-600",
        progressColor: "bg-red-600"
      };
    } else if (percentageLeft <= 80) {
      return {
        icon: <Clock className="h-4 w-4 mr-1" />,
        label: "Medium Stock",
        className: "text-yellow-600",
        progressColor: "bg-yellow-500"
      };
    } else {
      return {
        icon: <CheckCircle className="h-4 w-4 mr-1" />,
        label: "Good Stock",
        className: "text-green-600",
        progressColor: "bg-green-500"
      };
    }
  };

  const getProgressWidth = (quantity: number, minQuantity: number) => {
    // Calculate percentage but cap at 100%
    return Math.min((quantity / minQuantity) * 100, 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <MainLayout title="Inventory">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {stockFilter && <Badge className="ml-2">{stockFilter} stock</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setStockFilter("low")}>
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  Low Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStockFilter("medium")}>
                  <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                  Medium Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStockFilter("good")}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Good Stock
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {stockFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}

          <Dialog open={inventoryFormOpen} onOpenChange={setInventoryFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? "Edit Inventory Item" : "Add New Inventory Item"}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem
                    ? "Update the details of this inventory item."
                    : "Enter the details of the new inventory item."}
                </DialogDescription>
              </DialogHeader>
              <InventoryForm
                item={selectedItem}
                equipment={equipment || []}
                onClose={() => {
                  setInventoryFormOpen(false);
                  setSelectedItem(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <TabsList>
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="fluids">Fluids</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="parts">Parts</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {filteredInventory.length} {filteredInventory.length === 1 ? "item" : "items"} found
            </div>
            <ViewToggle 
              viewMode={viewMode} 
              onChange={setViewMode} 
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          {inventoryLoading ? (
            viewMode === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Skeleton className="h-[450px] w-full rounded-xl" />
              </div>
            )
          ) : filteredInventory.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No inventory items found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or add new items</p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.quantity, item.minQuantity);
                const progressWidth = getProgressWidth(item.quantity, item.minQuantity);
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {item.category}
                        </Badge>
                        <div className={`flex items-center text-sm font-medium ${stockStatus.className}`}>
                          {stockStatus.icon}
                          {stockStatus.label}
                        </div>
                      </div>
                      <CardTitle className="mt-2">{item.name}</CardTitle>
                      <CardDescription>
                        {item.description || (item.partNumber ? `Part #: ${item.partNumber}` : "No description available")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="mb-4">
                        <div className="flex justify-between mb-1 items-center">
                          <span className="text-sm font-medium">Stock Level</span>
                          <span className="text-sm">{item.quantity} of {item.minQuantity} {item.unit}</span>
                        </div>
                        <Progress value={progressWidth} className={`h-2 ${stockStatus.progressColor}`} />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {item.supplier && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Supplier:</span>
                            <span>{item.supplier}</span>
                          </div>
                        )}
                        {item.cost !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Cost per {item.unit}:</span>
                            <span>${item.cost.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Restocked:</span>
                          <span>{formatDate(item.lastRestockDate)}</span>
                        </div>
                        {item.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Storage Location:</span>
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                        Edit
                      </Button>
                      <Button 
                        variant={item.quantity < item.minQuantity ? "default" : "secondary"}
                        size="sm" 
                        onClick={() => handleRestock(item)}
                      >
                        Restock
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min. Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item.quantity, item.minQuantity);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center text-sm font-medium ${stockStatus.className}`}>
                            {stockStatus.icon}
                            {stockStatus.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.minQuantity} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.location || "Not specified"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRestock(item)}>
                                  Restock
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fluids" className="mt-0">
          {filteredInventory.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No fluids found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or add new items</p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Content will be filtered by the selectedTab state */}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min. Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Content will be filtered by the selectedTab state */}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="filters" className="mt-0">
          {filteredInventory.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No filters found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or add new items</p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Content will be filtered by the selectedTab state */}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min. Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Content will be filtered by the selectedTab state */}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="parts" className="mt-0">
          {filteredInventory.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No parts found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or add new items</p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Content will be filtered by the selectedTab state */}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min. Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Content will be filtered by the selectedTab state */}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tools" className="mt-0">
          {filteredInventory.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No tools found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or add new items</p>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Content will be filtered by the selectedTab state */}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min. Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Content will be filtered by the selectedTab state */}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Inventory;
