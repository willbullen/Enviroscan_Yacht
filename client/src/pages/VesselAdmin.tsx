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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useVessel } from '@/contexts/VesselContext';
import InteractiveVesselMap from '@/components/vessel/InteractiveVesselMap';
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
  const [isAddingVessel, setIsAddingVessel] = useState(false);
  const [isEditingVessel, setIsEditingVessel] = useState(false);
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
    setIsAddingVessel(false);
    resetForm();
  };
  
  const handleEditVessel = () => {
    // Here we would send the updated data to the API
    console.log('Updating vessel:', editingVessel, formData);
    setIsEditingVessel(false);
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
      setIsEditingVessel(true);
    }
  };
  
  const startAddVessel = () => {
    resetForm();
    setIsAddingVessel(true);
  };
  
  const cancelAction = () => {
    setIsAddingVessel(false);
    setIsEditingVessel(false);
    setEditingVessel(null);
    resetForm();
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
          <Button onClick={startAddVessel}>
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
                    {isAddingVessel ? (
                      <div className="p-4">
                        <div className="border-b pb-3 mb-4">
                          <h3 className="text-base font-medium">Add New Vessel</h3>
                          <p className="text-xs text-muted-foreground mt-1">Enter vessel details below</p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Vessel Name</Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="e.g. M/Y Explorer"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="type">Vessel Type</Label>
                            <Input
                              id="type"
                              name="type"
                              value={formData.type}
                              onChange={handleChange}
                              placeholder="e.g. Motor Yacht"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="length">Length</Label>
                            <Input
                              id="length"
                              name="length"
                              value={formData.length}
                              onChange={handleChange}
                              placeholder="e.g. 45m"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="flag">Flag</Label>
                            <Input
                              id="flag"
                              name="flag"
                              value={formData.flag}
                              onChange={handleChange}
                              placeholder="e.g. Malta"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="year">Year Built</Label>
                            <Input
                              id="year"
                              name="year"
                              value={formData.year}
                              onChange={handleChange}
                              placeholder="e.g. 2020"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="image">Vessel Image</Label>
                            <Button variant="outline" className="w-full">
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Upload Vessel Image
                            </Button>
                          </div>
                          <div className="flex justify-between gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={cancelAction}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleAddVessel}>
                              <Save className="mr-2 h-4 w-4" />
                              Add Vessel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : isEditingVessel ? (
                      <div className="p-4">
                        <div className="border-b pb-3 mb-4">
                          <h3 className="text-base font-medium">Edit Vessel</h3>
                          <p className="text-xs text-muted-foreground mt-1">Update vessel information</p>
                        </div>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-name">Vessel Name</Label>
                            <Input
                              id="edit-name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-type">Vessel Type</Label>
                            <Input
                              id="edit-type"
                              name="type"
                              value={formData.type}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-length">Length</Label>
                            <Input
                              id="edit-length"
                              name="length"
                              value={formData.length}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-flag">Flag</Label>
                            <Input
                              id="edit-flag"
                              name="flag"
                              value={formData.flag}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-year">Year Built</Label>
                            <Input
                              id="edit-year"
                              name="year"
                              value={formData.year}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-image">Vessel Image</Label>
                            <Button variant="outline" className="w-full">
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Update Vessel Image
                            </Button>
                          </div>
                          <div className="flex justify-between gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={cancelAction}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleEditVessel}>
                              <Save className="mr-2 h-4 w-4" />
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
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
                          <Button variant="outline" size="sm" className="w-full" onClick={startAddVessel}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Vessel
                          </Button>
                        </div>
                      </>
                    )}
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
                    <InteractiveVesselMap 
                      ref={mapRef}
                      height={500}
                      selectedVesselId={selectedVesselId}
                      onVesselSelect={setSelectedVesselId}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default VesselAdmin;