import React, { useState } from 'react';
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
  FileText, 
  Plus, 
  Filter, 
  Search,
  Upload,
  Eye,
  Download,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  File
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Drawing {
  id: number;
  projectId: number;
  drawingNumber: string;
  title: string;
  description?: string;
  buildGroup: string;
  discipline: string;
  drawingType: string;
  scale?: string;
  status: string;
  revisionNumber?: string;
  isCurrentRevision?: boolean;
  approvalRequired?: boolean;
  approvedBy?: any;
  approvedAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  tags?: string[];
  createdBy: any;
  createdAt: string;
  updatedAt: string;
  comments?: any[];
  revisions?: any[];
}

interface DrawingManagerProps {
  projectId: number;
}

const DrawingManager: React.FC<DrawingManagerProps> = ({ projectId }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [buildGroupFilter, setBuildGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('grid');

  // Fetch drawings for the project
  const { data: drawings = [], isLoading } = useQuery<Drawing[]>({
    queryKey: [`/api/build/projects/${projectId}/drawings`],
    enabled: !!projectId
  });

  // Upload drawing mutation
  const uploadDrawingMutation = useMutation({
    mutationFn: async (drawingData: any) => {
      return apiRequest('POST', `/api/build/projects/${projectId}/drawings`, drawingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/build/projects/${projectId}/drawings`] });
      setIsUploadOpen(false);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'for_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'superseded': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBuildGroupIcon = (buildGroup: string) => {
    switch (buildGroup) {
      case 'general_arrangement': return '🏗️';
      case 'structural': return '🔩';
      case 'mechanical': return '⚙️';
      case 'electrical': return '⚡';
      case 'interior': return '🏠';
      case 'exterior': return '🚢';
      default: return '📋';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter drawings
  const filteredDrawings = drawings.filter(drawing => {
    const matchesSearch = searchQuery === '' || 
      drawing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBuildGroup = buildGroupFilter === 'all' || drawing.buildGroup === buildGroupFilter;
    const matchesStatus = statusFilter === 'all' || drawing.status === statusFilter;
    
    return matchesSearch && matchesBuildGroup && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Technical Drawings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage project drawings, blueprints, and technical documentation
          </p>
        </div>
        <UploadDrawingDialog 
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onSubmit={(data) => uploadDrawingMutation.mutate(data)}
          isLoading={uploadDrawingMutation.isPending}
        />
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drawings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={buildGroupFilter} onValueChange={setBuildGroupFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Build Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="general_arrangement">General Arrangement</SelectItem>
              <SelectItem value="structural">Structural</SelectItem>
              <SelectItem value="mechanical">Mechanical</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="interior">Interior</SelectItem>
              <SelectItem value="exterior">Exterior</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="for_review">For Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="superseded">Superseded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDrawings.length} drawing{filteredDrawings.length !== 1 ? 's' : ''} found
        </p>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Drawings Display */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="grid" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : filteredDrawings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No drawings found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || buildGroupFilter !== 'all' || statusFilter !== 'all'
                    ? "Try adjusting your search or filter criteria"
                    : "No drawings have been uploaded for this project yet"
                  }
                </p>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Upload First Drawing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrawings.map((drawing) => (
                <Card key={drawing.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getBuildGroupIcon(drawing.buildGroup)}</span>
                        <Badge className={getStatusColor(drawing.status)}>
                          {drawing.status.replace('_', ' ')}
                        </Badge>
                        {drawing.isCurrentRevision && (
                          <Badge variant="outline">Current</Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDrawing(drawing)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {drawing.fileUrl && (
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div>
                      <div className="text-sm font-mono text-muted-foreground">
                        {drawing.drawingNumber} {drawing.revisionNumber && `Rev. ${drawing.revisionNumber}`}
                      </div>
                      <CardTitle className="text-base mt-1">{drawing.title}</CardTitle>
                      {drawing.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {drawing.description}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Drawing Thumbnail */}
                    <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      {drawing.thumbnailUrl ? (
                        <img 
                          src={drawing.thumbnailUrl} 
                          alt={drawing.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <File className="h-12 w-12 text-gray-400" />
                      )}
                    </div>

                    {/* Drawing Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="capitalize">{drawing.drawingType.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discipline:</span>
                        <span className="capitalize">{drawing.discipline.replace('_', ' ')}</span>
                      </div>
                      {drawing.scale && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Scale:</span>
                          <span>{drawing.scale}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(drawing.createdAt)}</span>
                      </div>
                      {drawing.fileName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">File Size:</span>
                          <span>{formatFileSize(drawing.fileSize)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedDrawing(drawing)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {drawing.fileUrl && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Comments indicator */}
                    {drawing.comments && drawing.comments.length > 0 && (
                      <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{drawing.comments.length} comment{drawing.comments.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          {filteredDrawings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No drawings found</h3>
                <p className="text-muted-foreground">
                  Start by uploading your first technical drawing
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDrawings.map((drawing) => (
                <Card key={drawing.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-lg">{getBuildGroupIcon(drawing.buildGroup)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{drawing.title}</span>
                            <Badge className={getStatusColor(drawing.status)}>
                              {drawing.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {drawing.drawingNumber} {drawing.revisionNumber && `Rev. ${drawing.revisionNumber}`} • 
                            {' '}{drawing.buildGroup.replace('_', ' ')} • 
                            Created {formatDate(drawing.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDrawing(drawing)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Drawing Detail Dialog */}
      {selectedDrawing && (
        <DrawingDetailDialog
          drawing={selectedDrawing}
          open={!!selectedDrawing}
          onOpenChange={() => setSelectedDrawing(null)}
        />
      )}
    </div>
  );
};

// Upload Drawing Dialog Component
const UploadDrawingDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    drawingNumber: '',
    title: '',
    description: '',
    buildGroup: 'general_arrangement',
    discipline: 'naval_architecture',
    drawingType: 'plan',
    scale: '',
    revisionNumber: 'A',
    approvalRequired: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-1.5" />
          Upload Drawing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload New Drawing</DialogTitle>
          <DialogDescription>
            Upload a new technical drawing or blueprint for this project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drawingNumber">Drawing Number *</Label>
              <Input
                id="drawingNumber"
                value={formData.drawingNumber}
                onChange={(e) => handleChange('drawingNumber', e.target.value)}
                placeholder="e.g., GA-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisionNumber">Revision</Label>
              <Input
                id="revisionNumber"
                value={formData.revisionNumber}
                onChange={(e) => handleChange('revisionNumber', e.target.value)}
                placeholder="A"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Drawing Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="General Arrangement Plan"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the drawing"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Build Group</Label>
              <Select value={formData.buildGroup} onValueChange={(value) => handleChange('buildGroup', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_arrangement">General Arrangement</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Discipline</Label>
              <Select value={formData.discipline} onValueChange={(value) => handleChange('discipline', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="naval_architecture">Naval Architecture</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="interior_design">Interior Design</SelectItem>
                  <SelectItem value="systems">Systems</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Drawing Type</Label>
              <Select value={formData.drawingType} onValueChange={(value) => handleChange('drawingType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="detail">Detail</SelectItem>
                  <SelectItem value="isometric">Isometric</SelectItem>
                  <SelectItem value="3d_view">3D View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scale">Scale</Label>
              <Input
                id="scale"
                value={formData.scale}
                onChange={(e) => handleChange('scale', e.target.value)}
                placeholder="1:100"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">File Upload</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Select the drawing file to upload (PDF, DWG, or image formats)
            </p>
            <Input type="file" accept=".pdf,.dwg,.jpg,.jpeg,.png,.tiff" />
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
            <Button type="submit" disabled={isLoading || !formData.drawingNumber || !formData.title}>
              {isLoading ? 'Uploading...' : 'Upload Drawing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Drawing Detail Dialog Component
const DrawingDetailDialog: React.FC<{
  drawing: Drawing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ drawing, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg">{getBuildGroupIcon(drawing.buildGroup)}</span>
            <Badge className={`text-xs ${{
              'draft': 'bg-gray-100 text-gray-800',
              'for_review': 'bg-yellow-100 text-yellow-800',
              'approved': 'bg-green-100 text-green-800',
              'superseded': 'bg-orange-100 text-orange-800',
              'cancelled': 'bg-red-100 text-red-800'
            }[drawing.status] || 'bg-gray-100 text-gray-800'}`}>
              {drawing.status.replace('_', ' ')}
            </Badge>
          </div>
          <DialogTitle>{drawing.title}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {drawing.drawingNumber} {drawing.revisionNumber && `Rev. ${drawing.revisionNumber}`}
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drawing Preview */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-gray-100 rounded-lg flex items-center justify-center">
              {drawing.thumbnailUrl ? (
                <img 
                  src={drawing.thumbnailUrl} 
                  alt={drawing.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <File className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No preview available</p>
                </div>
              )}
            </div>
            {drawing.fileUrl && (
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Drawing
              </Button>
            )}
          </div>

          {/* Drawing Details */}
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Drawing Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Build Group:</span>
                  <p className="capitalize">{drawing.buildGroup.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Discipline:</span>
                  <p className="capitalize">{drawing.discipline.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Type:</span>
                  <p className="capitalize">{drawing.drawingType.replace('_', ' ')}</p>
                </div>
                {drawing.scale && (
                  <div>
                    <span className="font-medium text-muted-foreground">Scale:</span>
                    <p>{drawing.scale}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-muted-foreground">Created By:</span>
                  <p>{drawing.createdBy?.fullName || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Created:</span>
                  <p>{new Date(drawing.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {drawing.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{drawing.description}</p>
              </div>
            )}

            {drawing.approvalRequired && (
              <div>
                <h4 className="font-medium mb-2">Approval Status</h4>
                {drawing.approvedBy ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approved by {drawing.approvedBy.fullName}</span>
                    {drawing.approvedAt && (
                      <span className="text-muted-foreground">
                        on {new Date(drawing.approvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Pending approval</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Comments & Reviews</h4>
              <div className="text-center py-4 text-sm text-muted-foreground">
                Comments and review functionality will be implemented here
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function moved outside component
const getBuildGroupIcon = (buildGroup: string) => {
  switch (buildGroup) {
    case 'general_arrangement': return '🏗️';
    case 'structural': return '🔩';
    case 'mechanical': return '⚙️';
    case 'electrical': return '⚡';
    case 'interior': return '🏠';
    case 'exterior': return '🚢';
    default: return '📋';
  }
};

export default DrawingManager; 