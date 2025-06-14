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
  Image as ImageIcon,
  Search,
  MousePointerClick
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
import VesselSearchForm from '@/components/vessel/VesselSearchForm';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Types
export type VesselFormData = {
  name: string;
  type: string;
  length: string;
  flag: string;
  year: string;
  image: string | null;
  mmsi?: string;
  position?: string;
};

const VesselAdmin: React.FC = () => {
  const { 
    vessels, 
    addVessel, 
    updateVessel, 
    deleteVessel, 
    refreshVessels 
  } = useVessel();
  const [isAddingVessel, setIsAddingVessel] = useState(false);
  const [isEditingVessel, setIsEditingVessel] = useState(false);
  const [editingVessel, setEditingVessel] = useState<number | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<number | null>(null);
  const [isSearchingForVessel, setIsSearchingForVessel] = useState(false);
  const [allowMapClickForEdit, setAllowMapClickForEdit] = useState(false);
  const mapRef = useRef<{ 
    focusVessel: (vesselId: number) => void;
    focusPosition: (latitude: number, longitude: number, zoom?: number) => void;
  }>(null);
  
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
      image: null,
      mmsi: undefined,
      position: undefined
    });
  };
  
  const handleAddVessel = async () => {
    try {
      // Show loading state
      console.log('Adding vessel:', formData);
      
      // Convert form data to proper format
      const result = await addVessel({
        name: formData.name,
        type: formData.type,
        length: formData.length,
        flag: formData.flag,
        mmsi: formData.mmsi,
        // Add other fields as needed
      });
      
      if (result) {
        console.log('Vessel added successfully:', result);
        // Close the form and reset
        setIsAddingVessel(false);
        resetForm();
      } else {
        console.error('Failed to add vessel');
        // Display error message to user
        alert('Failed to add vessel. Please try again.');
      }
    } catch (error) {
      console.error('Error adding vessel:', error);
      alert('Error adding vessel. Please try again.');
    }
  };
  
  const handleEditVessel = async () => {
    if (!editingVessel) {
      console.error('No vessel selected for editing');
      return;
    }
    
    try {
      console.log('Updating vessel:', editingVessel, formData);
      
      // Convert form data to proper format
      const result = await updateVessel(editingVessel, {
        name: formData.name,
        type: formData.type,
        length: formData.length,
        flag: formData.flag,
        mmsi: formData.mmsi,
        // Add other fields as needed
      });
      
      if (result) {
        console.log('Vessel updated successfully:', result);
        // Close the form and reset
        setIsEditingVessel(false);
        setEditingVessel(null);
        resetForm();
      } else {
        console.error('Failed to update vessel');
        // Display error message to user
        alert('Failed to update vessel. Please try again.');
      }
    } catch (error) {
      console.error('Error updating vessel:', error);
      alert('Error updating vessel. Please try again.');
    }
  };

  const startEditVessel = (vesselId: number) => {
    const vessel = vessels.find(v => v.id === vesselId);
    if (vessel) {
      // Get vessel position if available
      let position: string | undefined = undefined;
      if (vessel.latitude && vessel.longitude) {
        position = `${vessel.latitude.toFixed(6)}, ${vessel.longitude.toFixed(6)}`;
      }

      setFormData({
        name: vessel.name,
        type: vessel.type,
        length: vessel.length,
        flag: 'Malta', // Mock data
        year: '2018',  // Mock data
        image: null,
        position: position
      });
      setEditingVessel(vesselId);
      setIsEditingVessel(true);
      
      // Also enable map position selection for the edit form
      setAllowMapClickForEdit(true);
    }
  };
  
  const startAddVessel = () => {
    resetForm();
    setIsAddingVessel(true);
    setIsSearchingForVessel(false);
  };
  
  const startSearchVessel = () => {
    resetForm();
    setIsAddingVessel(true);
    setIsSearchingForVessel(true);
  };
  
  const cancelAction = () => {
    setIsAddingVessel(false);
    setIsEditingVessel(false);
    setEditingVessel(null);
    setIsSearchingForVessel(false);
    setAllowMapClickForEdit(false);
    resetForm();
  };
  
  const handleSelectVessel = (vesselData: VesselFormData) => {
    setFormData(vesselData);
    setIsSearchingForVessel(false);
  };
  
  const handleFocusVesselOnMap = (latitude: number, longitude: number) => {
    if (mapRef.current) {
      mapRef.current.focusPosition(latitude, longitude, 13);
    }
  };
  
  const handleMapPositionSelect = (latitude: number, longitude: number) => {
    console.log('Position selected from map:', latitude, longitude);
    // Here we would typically use the coordinates to set a vessel's position
    // or lookup nearby vessels from an API
    
    // For now, just add coordinates to the form data
    setFormData(prev => ({
      ...prev,
      position: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    }));
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
          <Button 
            onClick={startAddVessel}
            className="gap-1.5 font-medium"
            title="Register a new vessel to the fleet"
          >
            <PlusCircle className="h-4 w-4" />
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
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5 border-primary/20 hover:border-primary/60 transition-colors font-medium"
                  title="Configure vessel tracking settings"
                >
                  <Info className="h-4 w-4 text-primary/70" />
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
                          {isSearchingForVessel ? (
                            <div className="border rounded-md p-4 mb-2 bg-muted/20">
                              <div className="text-sm font-medium mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Search className="h-4 w-4" /> 
                                  Search Vessel Database
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setIsSearchingForVessel(false)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <VesselSearchForm 
                                onSelectVessel={handleSelectVessel} 
                                onFocusVesselOnMap={handleFocusVesselOnMap}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 mb-4">
                              <Button 
                                variant="outline" 
                                className="w-full flex justify-center items-center gap-2 border-primary/20 hover:border-primary/60 transition-colors font-medium"
                                onClick={startSearchVessel}
                                title="Find vessels using AIS marine tracking data"
                              >
                                <Search className="h-4 w-4 text-primary/70" />
                                <span>Search AIS Database</span>
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Find vessels using Marine Traffic/AIS data
                              </p>
                            </div>
                          )}
                          
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
                            <Label htmlFor="mmsi">MMSI Number</Label>
                            <Input
                              id="mmsi"
                              name="mmsi"
                              value={formData.mmsi || ''}
                              onChange={handleChange}
                              placeholder="e.g. 366998410"
                            />
                            <p className="text-xs text-muted-foreground">
                              MMSI is required for AIS tracking and vessel identification
                            </p>
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
                          {formData.position && (
                            <div className="grid gap-2">
                              <Label htmlFor="position">Position (from map)</Label>
                              <div className="flex gap-2 items-center">
                                <Input
                                  id="position"
                                  name="position"
                                  value={formData.position}
                                  readOnly
                                  className="flex-1 bg-muted/30"
                                />
                                <Button 
                                  type="button" 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => {
                                    const [lat, lng] = formData.position?.split(',').map(s => parseFloat(s.trim())) || [];
                                    if (lat && lng && mapRef.current) {
                                      mapRef.current.focusPosition(lat, lng, 14);
                                    }
                                  }}
                                  title="View on map"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Tip:</span> Click on the map to select a different position
                              </p>
                            </div>
                          )}
                          
                          <div className="grid gap-2">
                            <Label htmlFor="image">Vessel Image</Label>
                            <Button variant="outline" className="w-full">
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Upload Vessel Image
                            </Button>
                          </div>
                          <div className="flex justify-between gap-3 pt-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 gap-1.5 border-primary/20 hover:border-primary/60 transition-colors"
                              onClick={cancelAction}
                              title="Discard vessel information and return to list"
                            >
                              <X className="h-4 w-4 text-primary/70" />
                              Cancel
                            </Button>
                            <Button 
                              className="flex-1 gap-1.5 font-medium"
                              onClick={handleAddVessel}
                              title="Save the new vessel to the database"
                            >
                              <Save className="h-4 w-4" />
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
                            <Label htmlFor="edit-mmsi">MMSI Number</Label>
                            <Input
                              id="edit-mmsi"
                              name="mmsi"
                              value={formData.mmsi || ''}
                              onChange={handleChange}
                            />
                            <p className="text-xs text-muted-foreground">
                              MMSI is required for AIS tracking and vessel identification
                            </p>
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
                            <Label htmlFor="edit-position">Position</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                id="edit-position"
                                name="position"
                                value={formData.position || ''}
                                readOnly
                                className="flex-1 bg-muted/30"
                              />
                              <Button 
                                type="button" 
                                size="icon" 
                                variant="outline"
                                onClick={() => {
                                  const [lat, lng] = formData.position?.split(',').map(s => parseFloat(s.trim())) || [];
                                  if (lat && lng && mapRef.current) {
                                    mapRef.current.focusPosition(lat, lng, 14);
                                  }
                                }}
                                title="View on map"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Button 
                                type="button" 
                                size="sm"
                                variant={allowMapClickForEdit ? "default" : "outline"}
                                onClick={() => setAllowMapClickForEdit(!allowMapClickForEdit)}
                                className="text-xs flex items-center gap-1"
                              >
                                {allowMapClickForEdit ? (
                                  <>
                                    <MousePointerClick className="h-3 w-3" />
                                    Disable Map Selection
                                  </>
                                ) : (
                                  <>
                                    <MousePointerClick className="h-3 w-3" />
                                    Enable Map Selection
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                {allowMapClickForEdit 
                                  ? "Click on the map to update vessel position" 
                                  : "Enable to select position from map"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="edit-image">Vessel Image</Label>
                            <Button variant="outline" className="w-full">
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Update Vessel Image
                            </Button>
                          </div>
                          <div className="flex justify-between gap-3 pt-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 gap-1.5 border-primary/20 hover:border-primary/60 transition-colors"
                              onClick={cancelAction}
                              title="Discard changes and return to list"
                            >
                              <X className="h-4 w-4 text-primary/70" />
                              Cancel
                            </Button>
                            <Button 
                              className="flex-1 gap-1.5 font-medium"
                              onClick={handleEditVessel}
                              title="Save changes to vessel information"
                            >
                              <Save className="h-4 w-4" />
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
                                  <div>Flag: {vessel.flag || 'Unknown'}</div>
                                  <div>MMSI: {vessel.mmsi || 'Not Set'}</div>
                                  {vessel.latitude && vessel.longitude && (
                                    <div className="col-span-2 mt-1 flex items-center gap-1">
                                      <Navigation className="h-3 w-3 text-primary" />
                                      <span className="text-primary-foreground/80">
                                        Position: {vessel.latitude.toFixed(4)}, {vessel.longitude.toFixed(4)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 px-2 text-xs" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSelectedVesselId(vessel.id);
                                    if (mapRef.current) {
                                      mapRef.current.focusVessel(vessel.id);
                                    }
                                  }} 
                                  title="View vessel on map"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  <span>View</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 px-2 text-xs" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    startEditVessel(vessel.id); 
                                  }}
                                  title="Edit vessel details"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  <span>Edit</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 px-2 text-xs text-destructive hover:text-destructive/90 hover:bg-destructive/10" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this vessel? This action cannot be undone.')) {
                                      // Show a loading state
                                      console.log('Deleting vessel:', vessel.id);
                                      
                                      deleteVessel(vessel.id)
                                        .then(success => {
                                          if (success) {
                                            console.log('Vessel deleted successfully');
                                            // Refresh the vessels list
                                            refreshVessels();
                                          } else {
                                            console.error('Failed to delete vessel');
                                            alert('Failed to delete vessel. Please try again.');
                                          }
                                        })
                                        .catch(error => {
                                          console.error('Error deleting vessel:', error);
                                          alert('Error deleting vessel. Please try again.');
                                        });
                                    }
                                  }}
                                  title="Delete vessel"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  <span>Delete</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-1.5 border-primary/20 hover:border-primary/60 transition-colors font-medium"
                            onClick={startAddVessel}
                            title="Register a new vessel to the fleet"
                          >
                            <PlusCircle className="h-4 w-4 text-primary/70" />
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
                      allowMapClick={isAddingVessel || (isEditingVessel && allowMapClickForEdit)}
                      onMapPositionSelect={handleMapPositionSelect}
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