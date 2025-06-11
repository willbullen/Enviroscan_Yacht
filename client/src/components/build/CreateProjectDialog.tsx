import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { BuildProject } from '@/pages/BuildManagement';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (projectData: Partial<BuildProject>) => void;
  isLoading: boolean;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: 'refit',
    priority: 'medium',
    yardLocation: '',
    contractorCompany: '',
    budgetTotal: '',
    startDate: '',
    estimatedCompletionDate: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      ...formData,
      budgetTotal: formData.budgetTotal ? parseFloat(formData.budgetTotal) : undefined,
      startDate: formData.startDate || undefined,
      estimatedCompletionDate: formData.estimatedCompletionDate || undefined,
    };
    
    onSubmit(projectData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Build Project</DialogTitle>
          <DialogDescription>
            Create a new yacht build or refit project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., M/Y Explorer Refit 2024"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the project..."
                rows={3}
              />
            </div>

            {/* Project Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type *</Label>
                <Select 
                  value={formData.projectType} 
                  onValueChange={(value) => handleChange('projectType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_build">New Build</SelectItem>
                    <SelectItem value="refit">Refit</SelectItem>
                    <SelectItem value="major_refit">Major Refit</SelectItem>
                    <SelectItem value="survey_rectification">Survey Rectification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location & Contractor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yardLocation">Yard Location</Label>
                <Input
                  id="yardLocation"
                  value={formData.yardLocation}
                  onChange={(e) => handleChange('yardLocation', e.target.value)}
                  placeholder="e.g., Palma, Mallorca"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractorCompany">Contractor</Label>
                <Input
                  id="contractorCompany"
                  value={formData.contractorCompany}
                  onChange={(e) => handleChange('contractorCompany', e.target.value)}
                  placeholder="e.g., MB92 Barcelona"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budgetTotal">Budget (USD)</Label>
              <Input
                id="budgetTotal"
                type="number"
                value={formData.budgetTotal}
                onChange={(e) => handleChange('budgetTotal', e.target.value)}
                placeholder="e.g., 500000"
                min="0"
                step="1000"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCompletionDate">Estimated Completion</Label>
                <Input
                  id="estimatedCompletionDate"
                  type="date"
                  value={formData.estimatedCompletionDate}
                  onChange={(e) => handleChange('estimatedCompletionDate', e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional project notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog; 