import React, { useState, useRef, useEffect } from 'react';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Box, 
  Plus, 
  Upload,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Ruler,
  MapPin,
  Settings,
  Camera,
  Grid,
  Layers,
  Filter,
  Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Model3D {
  id: number;
  projectId: number;
  modelName: string;
  description?: string;
  modelType: string;
  fileUrl?: string;
  embedCode?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  captureDate?: string;
  isActive: boolean;
  tags?: string[];
  uploadedBy: any;
  createdAt: string;
}

interface Issue {
  id: number;
  issueNumber: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  status: string;
  coordinateX?: number;
  coordinateY?: number;
  coordinateZ?: number;
  locationReference?: string;
}

interface ModelViewer3DProps {
  projectId?: number | null;
  vesselId?: number;
  showAllProjects?: boolean;
}

const ModelViewer3D: React.FC<ModelViewer3DProps> = ({ 
  projectId, 
  vesselId, 
  showAllProjects = false 
}) => {
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIssues, setShowIssues] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [viewMode, setViewMode] = useState<'walkthrough' | 'dollhouse' | 'floorplan'>('walkthrough');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const viewerRef = useRef<HTMLIFrameElement>(null);

  // Fetch 3D models for the project or all projects for vessel
  const modelsQueryKey = showAllProjects && vesselId 
    ? [`/api/build/vessel/${vesselId}/models`]
    : [`/api/build/projects/${projectId}/models`];
  
  const { data: models = [], isLoading } = useQuery<Model3D[]>({
    queryKey: modelsQueryKey,
    enabled: !!(showAllProjects ? vesselId : projectId)
  });

  // Fetch issues with spatial coordinates
  const issuesQueryKey = showAllProjects && vesselId 
    ? [`/api/build/vessel/${vesselId}/issues`]
    : [`/api/build/projects/${projectId}/issues`];
  
  const { data: issues = [] } = useQuery<Issue[]>({
    queryKey: issuesQueryKey,
    enabled: !!(showAllProjects ? vesselId : projectId) && showIssues
  });

  // Upload model mutation
  const uploadModelMutation = useMutation({
    mutationFn: async (modelData: any) => {
      if (!projectId) throw new Error('Project must be selected to upload 3D models');
      return apiRequest('POST', `/api/build/projects/${projectId}/models`, modelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: modelsQueryKey });
      setIsUploadOpen(false);
    },
  });

  const filteredModels = models.filter(model => 
    searchQuery === '' || 
    model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'matterport': return '🏠';
      case 'cad': return '📐';
      case 'scan': return '📸';
      case 'bim': return '🏗️';
      default: return '📦';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Render issue pins on 3D model
  const renderIssuePins = () => {
    if (!showIssues || !selectedModel || selectedModel.modelType !== 'matterport') return null;

    return issues
      .filter(issue => issue.coordinateX !== undefined && issue.coordinateY !== undefined)
      .map(issue => (
        <div
          key={issue.id}
          className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${(issue.coordinateX || 0) * 100}%`,
            top: `${(issue.coordinateY || 0) * 100}%`,
          }}
          title={`${issue.issueNumber}: ${issue.title}`}
        >
          <div className={`w-4 h-4 rounded-full ${getSeverityColor(issue.severity)} border-2 border-white shadow-lg animate-pulse`}>
            <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-white/20 animate-ping"></div>
          </div>
        </div>
      ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Box className="h-5 w-5" />
            3D Models & Scans
          </h2>
          <p className="text-sm text-muted-foreground">
            {showAllProjects 
              ? "View all 3D models and scans across vessel projects"
              : "View and manage 3D models, Matterport scans, and spatial data"
            }
          </p>
        </div>
        {!showAllProjects && (
          <UploadModelDialog 
            open={isUploadOpen}
            onOpenChange={setIsUploadOpen}
            onSubmit={(data) => uploadModelMutation.mutate(data)}
            isLoading={uploadModelMutation.isPending}
          />
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search 3D models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showIssues ? "default" : "outline"}
            size="sm"
            onClick={() => setShowIssues(!showIssues)}
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            Issues ({issues.length})
          </Button>
          <Button
            variant={showMeasurements ? "default" : "outline"}
            size="sm"
            onClick={() => setShowMeasurements(!showMeasurements)}
          >
            <Ruler className="h-4 w-4 mr-1.5" />
            Measurements
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Models List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Models</CardTitle>
              <CardDescription>
                {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-center py-8">
                  <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No 3D models found</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Upload your first 3D model or scan
                  </p>
                  <Button onClick={() => setIsUploadOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Model
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedModel?.id === model.id ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getModelTypeIcon(model.modelType)}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{model.modelName}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {model.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {model.modelType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(model.fileSize)}
                            </span>
                          </div>
                          {model.captureDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Captured {formatDate(model.captureDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issues List (when viewing model) */}
          {selectedModel && showIssues && issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Spatial Issues</CardTitle>
                <CardDescription>
                  Issues with 3D coordinates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {issues
                    .filter(issue => issue.coordinateX !== undefined)
                    .map((issue) => (
                      <div key={issue.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(issue.severity)}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{issue.title}</p>
                          <p className="text-xs text-muted-foreground">{issue.issueNumber}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {issue.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 3D Viewer */}
        <div className="lg:col-span-2">
          <Card className={isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {selectedModel ? selectedModel.modelName : '3D Model Viewer'}
                  </CardTitle>
                  {selectedModel && (
                    <CardDescription>
                      {selectedModel.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedModel?.modelType === 'matterport' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1.5" />
                          View: {viewMode}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setViewMode('walkthrough')}>
                          <Camera className="h-4 w-4 mr-2" />
                          Walkthrough
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewMode('dollhouse')}>
                          <Box className="h-4 w-4 mr-2" />
                          Dollhouse
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewMode('floorplan')}>
                          <Grid className="h-4 w-4 mr-2" />
                          Floor Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className={`relative ${isFullscreen ? 'h-screen' : 'h-[500px]'} bg-gray-100`}>
                {selectedModel ? (
                  <>
                    {selectedModel.modelType === 'matterport' && selectedModel.embedCode ? (
                      <div className="relative w-full h-full">
                        <iframe
                          ref={viewerRef}
                          src={selectedModel.fileUrl}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allowFullScreen
                          className="w-full h-full"
                        />
                        {renderIssuePins()}
                      </div>
                    ) : selectedModel.modelType === 'cad' ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Box className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">CAD Model Viewer</h3>
                          <p className="text-muted-foreground mb-4">
                            CAD model viewer will be implemented here
                          </p>
                          <Button variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Download Model
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Box className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">Unsupported Model Type</h3>
                          <p className="text-muted-foreground">
                            This model type is not yet supported in the viewer
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Box className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a 3D Model</h3>
                      <p className="text-muted-foreground">
                        Choose a 3D model from the list to view it here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Model Information Panel */}
          {selectedModel && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Model Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Type:</span>
                        <p className="capitalize">{selectedModel.modelType}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">File Size:</span>
                        <p>{formatFileSize(selectedModel.fileSize)}</p>
                      </div>
                      {selectedModel.captureDate && (
                        <div>
                          <span className="font-medium text-muted-foreground">Capture Date:</span>
                          <p>{formatDate(selectedModel.captureDate)}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-muted-foreground">Uploaded By:</span>
                        <p>{selectedModel.uploadedBy?.fullName || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    {selectedModel.tags && selectedModel.tags.length > 0 && (
                      <div>
                        <span className="font-medium text-muted-foreground">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedModel.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="metadata" className="space-y-4">
                    <div className="text-sm space-y-3">
                      <div>
                        <span className="font-medium text-muted-foreground">Model ID:</span>
                        <p className="font-mono">{selectedModel.id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Created:</span>
                        <p>{new Date(selectedModel.createdAt).toLocaleString()}</p>
                      </div>
                      {selectedModel.fileUrl && (
                        <div>
                          <span className="font-medium text-muted-foreground">File URL:</span>
                          <p className="text-blue-600 hover:underline cursor-pointer truncate">
                            {selectedModel.fileUrl}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Show Issue Pins</span>
                        <Button
                          variant={showIssues ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowIssues(!showIssues)}
                        >
                          {showIssues ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Measurement Tools</span>
                        <Button
                          variant={showMeasurements ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowMeasurements(!showMeasurements)}
                        >
                          {showMeasurements ? 'Enabled' : 'Disabled'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Upload Model Dialog Component
const UploadModelDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    modelName: '',
    description: '',
    modelType: 'matterport',
    fileUrl: '',
    embedCode: '',
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isActive: true
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-1.5" />
          Add 3D Model
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New 3D Model</DialogTitle>
          <DialogDescription>
            Upload a new 3D model or scan for this project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modelName">Model Name *</Label>
            <Input
              id="modelName"
              value={formData.modelName}
              onChange={(e) => handleChange('modelName', e.target.value)}
              placeholder="Hull Structure Scan - Week 12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Matterport 3D scan showing construction progress"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Model Type</Label>
            <Select value={formData.modelType} onValueChange={(value) => handleChange('modelType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matterport">Matterport Scan</SelectItem>
                <SelectItem value="cad">CAD Model</SelectItem>
                <SelectItem value="scan">3D Scan</SelectItem>
                <SelectItem value="bim">BIM Model</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileUrl">File URL *</Label>
            <Input
              id="fileUrl"
              value={formData.fileUrl}
              onChange={(e) => handleChange('fileUrl', e.target.value)}
              placeholder="https://my.matterport.com/show/?m=abc123"
              required
            />
          </div>

          {formData.modelType === 'matterport' && (
            <div className="space-y-2">
              <Label htmlFor="embedCode">Embed Code</Label>
              <Textarea
                id="embedCode"
                value={formData.embedCode}
                onChange={(e) => handleChange('embedCode', e.target.value)}
                placeholder="<iframe src='...' width='100%' height='400'></iframe>"
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="hull, structure, progress"
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
            <Button type="submit" disabled={isLoading || !formData.modelName || !formData.fileUrl}>
              {isLoading ? 'Adding...' : 'Add Model'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModelViewer3D; 