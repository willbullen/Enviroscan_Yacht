import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Ship, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Info, 
  X,
  Save,
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
    <MainLayout title="Vessel Administration">
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Vessel Management</h1>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Vessel
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>
              Manage all vessels in your fleet. Add, edit, or remove vessels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vessel Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Year Built</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vessels.map((vessel) => (
                  <TableRow key={vessel.id}>
                    <TableCell className="font-medium">{vessel.name}</TableCell>
                    <TableCell>{vessel.type}</TableCell>
                    <TableCell>{vessel.length}</TableCell>
                    <TableCell>Malta</TableCell> {/* Mock data */}
                    <TableCell>2018</TableCell> {/* Mock data */}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => startEditVessel(vessel.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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