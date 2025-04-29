import React, { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Ship, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Info, 
  X,
  Save,
  Map,
  Navigation,
  Eye,
  Image as ImageIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useVessel } from '@/contexts/VesselContext';
import BasicVesselMap from '@/components/vessel/BasicVesselMap';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Types
type VesselFormData = {
  name: string;
  type: string;
  length: string;
  flag: string;
  year: string;
  image: string | null;
};

const VesselAdmin: React.FC = () => {
  const { vessels } = useVessel();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingVessel, setEditingVessel] = useState<number | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  const mapRef = useRef<{ focusVessel: (vesselId: number) => void }>(null);
  
  const [formData, setFormData] = useState<VesselFormData>({
    name: '',
    type: '',
    length: '',
    flag: '',
    year: '',
    image: null
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      length: '',
      flag: '',
      year: '',
      image: null
    });
  };
  
  const handleAddVessel = () => {
    // Here we would send the data to the API
    console.log('Adding vessel:', formData);
    setShowAddDialog(false);
    resetForm();
  };
  
  const handleEditVessel = () => {
    // Here we would send the updated data to the API
    console.log('Updating vessel:', editingVessel, formData);
    setShowEditDialog(false);
    setEditingVessel(null);
    resetForm();
  };

  const startEditVessel = (vesselId: number) => {
    const vessel = vessels.find(v => v.id === vesselId);
    if (vessel) {
      setFormData({
        name: vessel.name,
        type: vessel.type,
        length: vessel.length,
        flag: 'Malta', // Mock data
        year: '2018',  // Mock data
        image: null
      });
      setEditingVessel(vesselId);
      setShowEditDialog(true);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <MainLayout title="Vessel Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Fleet Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Vessel
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Fleet Management & Live Tracking</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  AIS Settings
                </Button>
              </div>
            </div>
            <CardDescription>
              Manage your fleet and track vessel positions in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Fleet List - Left Column */}
              <div className="lg:col-span-1">
                <div className="rounded-md border">
                  <div className="p-4 border-b bg-muted/40">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Ship className="h-4 w-4" />
                      Fleet List
                    </h3>
                  </div>
                  <div className="p-0">
                    <div className="max-h-[500px] overflow-y-auto">
                      {vessels.map((vessel) => (
                        <div 
                          key={vessel.id}
                          className={`p-3 border-b cursor-pointer hover:bg-accent transition-colors flex items-center justify-between ${selectedVesselId === vessel.id ? 'bg-primary/10 border-primary' : ''}`}
                          onClick={() => {
                            setSelectedVesselId(vessel.id);
                            if (mapRef.current) {
                              mapRef.current.focusVessel(vessel.id);
                            }
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <div style={{ color: `var(--${vessel.id === 1 ? 'blue' : vessel.id === 2 ? 'emerald' : vessel.id === 3 ? 'red' : 'purple'})` }}>
                                <Ship className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{vessel.name}</span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 gap-x-4">
                              <div>Type: {vessel.type}</div>
                              <div>Length: {vessel.length}</div>
                              <div>Flag: Malta</div>
                              <div>Built: 2018</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedVesselId(vessel.id);
                              if (mapRef.current) {
                                mapRef.current.focusVessel(vessel.id);
                              }
                            }} title="View on map">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); startEditVessel(vessel.id); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => { resetForm(); setShowAddDialog(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Vessel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marine Tracker Map - Right Column */}
              <div className="lg:col-span-2">
                <div className="rounded-md border h-full">
                  <div className="p-4 border-b bg-muted/40">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      Marine Tracker
                    </h3>
                  </div>
                  <div className="p-0">
                    <BasicVesselMap 
                      height={500}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Vessel Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Vessel</DialogTitle>
              <DialogDescription>
                Enter the details of the new vessel to add to your fleet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g. M/Y Explorer"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Type</Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g. Motor Yacht"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="length" className="text-right">Length</Label>
                <Input
                  id="length"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g. 45m"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="flag" className="text-right">Flag</Label>
                <Input
                  id="flag"
                  name="flag"
                  value={formData.flag}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g. Malta"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">Year Built</Label>
                <Input
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="e.g. 2020"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">Image</Label>
                <div className="col-span-3">
                  <Button variant="outline" className="w-full">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload Vessel Image
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleAddVessel}>
                <Save className="mr-2 h-4 w-4" />
                Add Vessel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Vessel Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Vessel</DialogTitle>
              <DialogDescription>
                Update the details of this vessel.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">Type</Label>
                <Input
                  id="edit-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-length" className="text-right">Length</Label>
                <Input
                  id="edit-length"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-flag" className="text-right">Flag</Label>
                <Input
                  id="edit-flag"
                  name="flag"
                  value={formData.flag}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-year" className="text-right">Year Built</Label>
                <Input
                  id="edit-year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-image" className="text-right">Image</Label>
                <div className="col-span-3">
                  <Button variant="outline" className="w-full">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Upload New Image
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleEditVessel}>
                <Save className="mr-2 h-4 w-4" />
                Update Vessel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default VesselAdmin;