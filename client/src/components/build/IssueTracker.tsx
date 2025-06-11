import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Plus, 
  Filter, 
  Search,
  Camera,
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Eye,
  Edit,
  MoreHorizontal,
  Target,
  Crosshair
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Issue {
  id: number;
  projectId: number;
  issueNumber: string;
  title: string;
  description: string;
  issueType: string;
  category: string;
  severity: string;
  priority: string;
  status: string;
  locationReference?: string;
  dueDate?: string;
  assignedTo?: any;
  reportedBy: any;
  photos?: any[];
  comments?: any[];
  createdAt: string;
  updatedAt: string;
}

interface IssueTrackerProps {
  projectId: number;
}

const IssueTracker: React.FC<IssueTrackerProps> = ({ projectId }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Fetch issues for the project
  const { data: issues = [], isLoading } = useQuery<Issue[]>({
    queryKey: [`/api/build/projects/${projectId}/issues`],
    enabled: !!projectId
  });

  // Create issue mutation
  const createIssueMutation = useMutation({
    mutationFn: async (issueData: any) => {
      return apiRequest('POST', `/api/build/projects/${projectId}/issues`, issueData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/build/projects/${projectId}/issues`] });
      setIsCreateOpen(false);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.issueNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Issue Tracker
          </h2>
          <p className="text-sm text-muted-foreground">
            Track and manage project issues, defects, and work items
          </p>
        </div>
        <CreateIssueDialog 
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={(data) => createIssueMutation.mutate(data)}
          isLoading={createIssueMutation.isPending}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No issues found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? "Try adjusting your search or filter criteria"
                : "No issues have been reported for this project yet"
              }
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Issue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {issue.issueNumber}
                      </span>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                        {issue.priority}
                      </Badge>
                      <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {issue.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedIssue(issue)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Issue
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Type:</span>
                    <span className="capitalize">{issue.issueType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Category:</span>
                    <span className="capitalize">{issue.category}</span>
                  </div>
                  {issue.locationReference && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{issue.locationReference}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Reported by {issue.reportedBy?.fullName || 'Unknown'}</span>
                  </div>
                  {issue.assignedTo && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Assigned to {issue.assignedTo.fullName}</span>
                    </div>
                  )}
                  {issue.dueDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due {formatDate(issue.dueDate)}</span>
                    </div>
                  )}
                </div>

                {/* Issue Metadata */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {issue.photos && issue.photos.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Camera className="h-4 w-4" />
                        <span>{issue.photos.length} photo{issue.photos.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {issue.comments && issue.comments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{issue.comments.length} comment{issue.comments.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <span>Created {formatDate(issue.createdAt)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Detail Dialog */}
      {selectedIssue && (
        <IssueDetailDialog
          issue={selectedIssue}
          open={!!selectedIssue}
          onOpenChange={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
};

// Create Issue Dialog Component
const CreateIssueDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issueType: 'defect',
    category: 'structural',
    severity: 'medium',
    priority: 'medium',
    locationReference: '',
    coordinateX: null as number | null,
    coordinateY: null as number | null,
    coordinateZ: null as number | null,
    dueDate: ''
  });
  const [showSpatialPicker, setShowSpatialPicker] = useState(false);

  // Mock drawing data - in real app, this would come from API
  const mockDrawings = [
    {
      id: 1,
      drawingNumber: 'GA-001',
      title: 'General Arrangement - Main Deck',
      thumbnailUrl: '/api/placeholder-drawing.svg',
      buildGroup: 'general_arrangement'
    },
    {
      id: 2,
      drawingNumber: 'STR-002',
      title: 'Hull Structure - Frames 10-20',
      thumbnailUrl: '/api/placeholder-drawing.svg',
      buildGroup: 'structural'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      dueDate: formData.dueDate || undefined,
      coordinateX: formData.coordinateX,
      coordinateY: formData.coordinateY,
      coordinateZ: formData.coordinateZ || 0.5
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpatialLocation = (coordinates: { x: number; y: number; z?: number }, drawingId?: number, locationRef?: string) => {
    setFormData(prev => ({
      ...prev,
      coordinateX: coordinates.x,
      coordinateY: coordinates.y,
      coordinateZ: coordinates.z || 0.5,
      locationReference: locationRef || prev.locationReference
    }));
    setShowSpatialPicker(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Report a new issue, defect, or work item for this project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the issue"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select value={formData.issueType} onValueChange={(value) => handleChange('issueType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defect">Defect</SelectItem>
                  <SelectItem value="rework">Rework</SelectItem>
                  <SelectItem value="design_change">Design Change</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="systems">Systems</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(value) => handleChange('severity', value)}>
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

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spatial Location Section */}
          <div className="space-y-2">
            <Label>Location Reference</Label>
            <div className="space-y-2">
              <Input
                value={formData.locationReference}
                onChange={(e) => handleChange('locationReference', e.target.value)}
                placeholder="e.g., Main salon, port side"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSpatialPicker(true)}
                className="w-full"
              >
                <Target className="h-4 w-4 mr-2" />
                {formData.coordinateX !== null ? 'Update Spatial Location' : 'Add Spatial Location'}
              </Button>
              
              {formData.coordinateX !== null && formData.coordinateY !== null && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Spatial Location Set</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">X:</span>
                      <span className="ml-1 font-mono">{(formData.coordinateX * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Y:</span>
                      <span className="ml-1 font-mono">{(formData.coordinateY * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Z:</span>
                      <span className="ml-1 font-mono">{((formData.coordinateZ || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title || !formData.description}>
              {isLoading ? 'Creating...' : 'Create Issue'}
            </Button>
          </div>
        </form>

        {/* Spatial Location Picker Dialog */}
        <SpatialLocationPicker
          isOpen={showSpatialPicker}
          onClose={() => setShowSpatialPicker(false)}
          onLocationSelect={handleSpatialLocation}
          drawings={mockDrawings}
          existingCoordinates={
            formData.coordinateX !== null && formData.coordinateY !== null
              ? { x: formData.coordinateX, y: formData.coordinateY, z: formData.coordinateZ || 0.5 }
              : undefined
          }
        />
      </DialogContent>
    </Dialog>
  );
};

// Add SpatialLocationPicker component
const SpatialLocationPicker: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: { x: number; y: number; z?: number }, drawingId?: number, locationRef?: string) => void;
  drawings: any[];
  existingCoordinates?: { x: number; y: number; z?: number };
}> = ({ isOpen, onClose, onLocationSelect, drawings, existingCoordinates }) => {
  const [selectedDrawing, setSelectedDrawing] = useState(drawings[0] || null);
  const [coordinates, setCoordinates] = useState(existingCoordinates || null);
  const [isPickingMode, setIsPickingMode] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!isPickingMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setCoordinates({ x: clampedX, y: clampedY, z: 0.5 });
    setIsPickingMode(false);
  }, [isPickingMode]);

  const handleSave = () => {
    if (coordinates) {
      const locationRef = selectedDrawing 
        ? `${selectedDrawing.drawingNumber} - ${selectedDrawing.title}`
        : 'General vessel location';
      
      onLocationSelect(coordinates, selectedDrawing?.id, locationRef);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Select Issue Location
          </DialogTitle>
          <DialogDescription>
            Click on the vessel plan to pinpoint the exact location of the issue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Drawing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {drawings.map((drawing) => (
                    <div
                      key={drawing.id}
                      className={`p-2 border rounded cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedDrawing?.id === drawing.id ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => setSelectedDrawing(drawing)}
                    >
                      <div className="text-sm font-medium">{drawing.drawingNumber}</div>
                      <div className="text-xs text-muted-foreground">{drawing.title}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant={isPickingMode ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => setIsPickingMode(!isPickingMode)}
                >
                  <Crosshair className="h-4 w-4 mr-2" />
                  {isPickingMode ? 'Cancel Picking' : 'Pick Location'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <div className={`relative h-full bg-gray-100 ${isPickingMode ? 'cursor-crosshair' : 'cursor-default'}`}>
                  {selectedDrawing ? (
                    <>
                      <img
                        ref={imageRef}
                        src="/api/placeholder-drawing.svg"
                        alt={selectedDrawing.title}
                        className="w-full h-full object-contain"
                        onClick={handleImageClick}
                      />
                      
                      {coordinates && (
                        <div
                          className="absolute transform -translate-x-1/2 -translate-y-full z-10"
                          style={{
                            left: `${coordinates.x * 100}%`,
                            top: `${coordinates.y * 100}%`,
                          }}
                        >
                          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                            <MapPin className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Select a drawing to begin</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!coordinates}>
            Use This Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Issue Detail Dialog Component
const IssueDetailDialog: React.FC<{
  issue: Issue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ issue, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">
              {issue.issueNumber}
            </span>
            <Badge className={`text-xs ${{
              'open': 'bg-red-100 text-red-800',
              'in_progress': 'bg-yellow-100 text-yellow-800',
              'resolved': 'bg-green-100 text-green-800',
              'closed': 'bg-gray-100 text-gray-800'
            }[issue.status] || 'bg-gray-100 text-gray-800'}`}>
              {issue.status.replace('_', ' ')}
            </Badge>
          </div>
          <DialogTitle>{issue.title}</DialogTitle>
          <DialogDescription>
            {issue.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Type:</span>
              <p className="capitalize">{issue.issueType.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Category:</span>
              <p className="capitalize">{issue.category}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Severity:</span>
              <p className="capitalize">{issue.severity}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Priority:</span>
              <p className="capitalize">{issue.priority}</p>
            </div>
            {issue.locationReference && (
              <div className="col-span-2">
                <span className="font-medium text-muted-foreground">Location:</span>
                <p>{issue.locationReference}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Issue Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Reported By:</span>
                <p>{issue.reportedBy?.fullName || 'Unknown'}</p>
              </div>
              {issue.assignedTo && (
                <div>
                  <span className="font-medium text-muted-foreground">Assigned To:</span>
                  <p>{issue.assignedTo.fullName}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-muted-foreground">Created:</span>
                <p>{new Date(issue.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              {issue.dueDate && (
                <div>
                  <span className="font-medium text-muted-foreground">Due Date:</span>
                  <p>{new Date(issue.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Photos & Comments</h4>
              <div className="text-sm text-muted-foreground">
                {issue.photos?.length || 0} photos, {issue.comments?.length || 0} comments
              </div>
            </div>
            <div className="text-center py-8 text-muted-foreground">
              Photo and comment management will be implemented here
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IssueTracker; 