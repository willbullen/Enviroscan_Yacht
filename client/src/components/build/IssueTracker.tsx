import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
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
  Eye,
  Edit,
  MapPin,
  User,
  Calendar,
  Camera,
  MessageSquare,
  Target,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SpatialIssuePicker from './SpatialIssuePicker';

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

  // Define columns for the data table
  const columns: ColumnDef<Issue>[] = [
    {
      accessorKey: "issueNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Issue Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="font-mono text-sm">
            {row.getValue("issueNumber")}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const issue = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="font-medium">{issue.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {issue.description}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status?.replace('_', ' ') || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        return (
          <Badge variant="outline" className={getPriorityColor(priority)}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const severity = row.getValue("severity") as string;
        return (
          <Badge variant="outline" className={getSeverityColor(severity)}>
            {severity}
          </Badge>
        );
      },
    },
    {
      accessorKey: "issueType",
      header: "Type",
      cell: ({ row }) => {
        const issueType = row.getValue("issueType") as string;
        return <span className="capitalize">{issueType?.replace('_', ' ') || 'N/A'}</span>;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return <span className="capitalize">{category}</span>;
      },
    },
    {
      accessorKey: "locationReference",
      header: "Location",
      cell: ({ row }) => {
        const location = row.getValue("locationReference") as string;
        if (!location) return "—";
        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignedTo = row.getValue("assignedTo") as any;
        if (!assignedTo) return "—";
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignedTo?.avatarUrl} />
              <AvatarFallback className="text-xs">
                {assignedTo?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{assignedTo?.fullName || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "reportedBy",
      header: "Reported By",
      cell: ({ row }) => {
        const reportedBy = row.getValue("reportedBy") as any;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={reportedBy?.avatarUrl} />
              <AvatarFallback className="text-xs">
                {reportedBy?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{reportedBy?.fullName || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate") as string;
        if (!dueDate) return "—";
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(dueDate)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return formatDate(row.getValue("createdAt"));
      },
    },
    {
      id: "attachments",
      header: "Attachments",
      cell: ({ row }) => {
        const issue = row.original;
        const photoCount = issue.photos?.length || 0;
        const commentCount = issue.comments?.length || 0;
        
        if (photoCount === 0 && commentCount === 0) return "—";
        
        return (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {photoCount > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                <span>{photoCount}</span>
              </div>
            )}
            {commentCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{commentCount}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const issue = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedIssue(issue)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Issue
              </DropdownMenuItem>
              {issue.status === 'open' && (
                <DropdownMenuItem>
                  <Target className="mr-2 h-4 w-4" />
                  Assign
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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

      {/* Issues Data Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No issues found</h3>
            <p className="text-muted-foreground mb-4">
              No issues have been reported for this project yet
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Issue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable 
          columns={columns} 
          data={issues}
          filterColumn="title"
          filterPlaceholder="Search issues..."
        />
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
              {issue.status?.replace('_', ' ') || 'Unknown'}
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
              <p className="capitalize">{issue.issueType?.replace('_', ' ') || 'N/A'}</p>
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