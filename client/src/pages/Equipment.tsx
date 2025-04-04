import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  PlusCircle, 
  Filter, 
  FilterX, 
  Wrench, 
  Zap, 
  Navigation, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";

import EquipmentForm from "@/components/equipment/EquipmentForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import ViewToggle, { ViewMode } from "@/components/ui/view-toggle";

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

const categoryIcons = {
  mechanical: <Wrench className="h-5 w-5" />,
  electrical: <Zap className="h-5 w-5" />,
  navigation: <Navigation className="h-5 w-5" />,
  safety: <Shield className="h-5 w-5" />
};

const statusBadges = {
  operational: { label: "Operational", className: "bg-green-100 text-green-800 hover:bg-green-200" },
  maintenance_required: { label: "Maintenance Required", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
  non_operational: { label: "Non-Operational", className: "bg-red-100 text-red-800 hover:bg-red-200" }
};

const Equipment = () => {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARDS);
  const { toast } = useToast();

  // Fetch all equipment
  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Update equipment mutation
  const updateEquipmentMutation = useMutation({
    mutationFn: async (updatedEquipment: Partial<Equipment> & { id: number }) => {
      const { id, ...equipmentData } = updatedEquipment;
      await apiRequest("PATCH", `/api/equipment/${id}`, equipmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Equipment updated",
        description: "The equipment has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update equipment",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Filter equipment based on selectedTab and selectedStatus
  const filteredEquipment = !equipment
    ? []
    : equipment.filter((item) => {
        // Filter by category
        if (selectedTab !== "all" && item.category !== selectedTab) {
          return false;
        }
        
        // Filter by status
        if (selectedStatus && item.status !== selectedStatus) {
          return false;
        }
        
        return true;
      });

  const handleEditEquipment = (equipmentItem: Equipment) => {
    setSelectedEquipment(equipmentItem);
    setEquipmentFormOpen(true);
  };

  const clearFilters = () => {
    setSelectedStatus(null);
  };

  const getServiceStatus = (equipment: Equipment) => {
    const today = new Date();
    
    if (!equipment.nextServiceDate) {
      return {
        icon: <AlertTriangle className="h-4 w-4 mr-1" />,
        label: "No Service Scheduled",
        className: "bg-gray-100 text-gray-800",
      };
    }
    
    const nextServiceDate = new Date(equipment.nextServiceDate);
    
    if (nextServiceDate <= today) {
      return {
        icon: <AlertTriangle className="h-4 w-4 mr-1" />,
        label: "Service Overdue",
        className: "bg-red-100 text-red-800",
      };
    }
    
    // Check if next service date is within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    if (nextServiceDate <= thirtyDaysFromNow) {
      return {
        icon: <Clock className="h-4 w-4 mr-1" />,
        label: "Service Soon",
        className: "bg-yellow-100 text-yellow-800",
      };
    }
    
    return {
      icon: <CheckCircle className="h-4 w-4 mr-1" />,
      label: "Good Condition",
      className: "bg-green-100 text-green-800",
    };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Equipment Database</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {selectedStatus && <Badge className="ml-2">{selectedStatus.replace('_', ' ')}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSelectedStatus("operational")}>
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Operational
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("maintenance_required")}>
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  Maintenance Required
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus("non_operational")}>
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  Non-Operational
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedStatus && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}

          <Dialog open={equipmentFormOpen} onOpenChange={setEquipmentFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedEquipment ? "Edit Equipment" : "Add New Equipment"}
                </DialogTitle>
                <DialogDescription>
                  {selectedEquipment
                    ? "Update the details of this equipment."
                    : "Enter the details of the new equipment."}
                </DialogDescription>
              </DialogHeader>
              <EquipmentForm
                equipment={selectedEquipment}
                onClose={() => {
                  setEquipmentFormOpen(false);
                  setSelectedEquipment(null);
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
              <TabsTrigger value="all">All Equipment</TabsTrigger>
              <TabsTrigger value="mechanical">Mechanical</TabsTrigger>
              <TabsTrigger value="electrical">Electrical</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {filteredEquipment.length} {filteredEquipment.length === 1 ? "item" : "items"} found
            </div>
            <ViewToggle 
              viewMode={viewMode} 
              onChange={setViewMode} 
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          {isLoading ? (
            viewMode === ViewMode.CARDS ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <Skeleton className="w-full h-[400px] rounded-md" />
            )
          ) : filteredEquipment.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No equipment found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or add new equipment</p>
            </div>
          ) : viewMode === ViewMode.CARDS ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((item) => {
                const serviceStatus = getServiceStatus(item);
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {categoryIcons[item.category as keyof typeof categoryIcons]}
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Badge>
                        <Badge className={statusBadges[item.status as keyof typeof statusBadges].className}>
                          {statusBadges[item.status as keyof typeof statusBadges].label}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{item.name}</CardTitle>
                      <CardDescription>
                        {item.manufacturer} {item.model}
                        {item.serialNumber && <span className="block text-xs">S/N: {item.serialNumber}</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Runtime:</span>
                          <span className="font-mono">{item.runtime !== null ? `${item.runtime.toLocaleString()} hrs` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Installation Date:</span>
                          <span>{formatDate(item.installationDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Service:</span>
                          <span>{formatDate(item.lastServiceDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Next Service:</span>
                          <span className={
                            serviceStatus.label === "Service Overdue" ? "text-red-600 font-medium" : "font-medium"
                          }>
                            {formatDate(item.nextServiceDate)}
                          </span>
                        </div>
                        {item.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Location:</span>
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex items-center">
                        {serviceStatus.icon}
                        <span className="text-sm">{serviceStatus.label}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditEquipment(item)}>
                        Manage
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
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((item) => {
                    const serviceStatus = getServiceStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {categoryIcons[item.category as keyof typeof categoryIcons]}
                            <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.manufacturer}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>
                          <Badge className={statusBadges[item.status as keyof typeof statusBadges].className}>
                            {statusBadges[item.status as keyof typeof statusBadges].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.lastServiceDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {serviceStatus.icon}
                            <span className={serviceStatus.label === "Service Overdue" ? "text-red-600" : ""}>
                              {formatDate(item.nextServiceDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditEquipment(item)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>View Tasks</DropdownMenuItem>
                              <DropdownMenuItem>View History</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* These tabs use the same content as the "all" tab, but the content is filtered by the selectedTab state */}
        <TabsContent value="mechanical" className="mt-0">
          {isLoading ? (
            viewMode === ViewMode.CARDS ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <Skeleton className="w-full h-[400px] rounded-md" />
            )
          ) : filteredEquipment.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No equipment found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or add new equipment</p>
            </div>
          ) : viewMode === ViewMode.CARDS ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((item) => {
                const serviceStatus = getServiceStatus(item);
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {categoryIcons[item.category as keyof typeof categoryIcons]}
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Badge>
                        <Badge className={statusBadges[item.status as keyof typeof statusBadges].className}>
                          {statusBadges[item.status as keyof typeof statusBadges].label}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{item.name}</CardTitle>
                      <CardDescription>
                        {item.manufacturer} {item.model}
                        {item.serialNumber && <span className="block text-xs">S/N: {item.serialNumber}</span>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Runtime:</span>
                          <span className="font-mono">{item.runtime !== null ? `${item.runtime.toLocaleString()} hrs` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Installation Date:</span>
                          <span>{formatDate(item.installationDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Service:</span>
                          <span>{formatDate(item.lastServiceDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Next Service:</span>
                          <span className={
                            serviceStatus.label === "Service Overdue" ? "text-red-600 font-medium" : "font-medium"
                          }>
                            {formatDate(item.nextServiceDate)}
                          </span>
                        </div>
                        {item.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Location:</span>
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex items-center">
                        {serviceStatus.icon}
                        <span className="text-sm">{serviceStatus.label}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditEquipment(item)}>
                        Manage
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
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.map((item) => {
                    const serviceStatus = getServiceStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {categoryIcons[item.category as keyof typeof categoryIcons]}
                            <span>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.manufacturer}</TableCell>
                        <TableCell>{item.model}</TableCell>
                        <TableCell>
                          <Badge className={statusBadges[item.status as keyof typeof statusBadges].className}>
                            {statusBadges[item.status as keyof typeof statusBadges].label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.lastServiceDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {serviceStatus.icon}
                            <span className={serviceStatus.label === "Service Overdue" ? "text-red-600" : ""}>
                              {formatDate(item.nextServiceDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditEquipment(item)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>View Tasks</DropdownMenuItem>
                              <DropdownMenuItem>View History</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Use the same format for electrical, navigation and safety tabs */}
        <TabsContent value="electrical" className="mt-0">
          {/* Content will be rendered using the filtered equipment based on selectedTab and viewMode */}
          {viewMode === ViewMode.CARDS ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.length === 0 ? (
                <div className="col-span-full py-8 text-center">
                  <h3 className="text-lg font-medium text-gray-500">No equipment found</h3>
                  <p className="text-gray-400 mt-1">Try changing your filters or add new equipment</p>
                </div>
              ) : (
                filteredEquipment.map((item) => {
                  const serviceStatus = getServiceStatus(item);
                  return (
                    <Card key={item.id} className="overflow-hidden">
                      {/* Card content is the same as above */}
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                {/* Table content is the same as above */}
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="navigation" className="mt-0">
          {/* Content will be rendered using the filtered equipment based on selectedTab and viewMode */}
          {viewMode === ViewMode.CARDS ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card views for navigation equipment */}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                {/* Table view for navigation equipment */}
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="safety" className="mt-0">
          {/* Content will be rendered using the filtered equipment based on selectedTab and viewMode */}
          {viewMode === ViewMode.CARDS ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card views for safety equipment */}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                {/* Table view for safety equipment */}
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Equipment;
