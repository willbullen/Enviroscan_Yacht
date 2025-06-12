import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import FileUpload, { UploadedFile } from '@/components/ui/FileUpload';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
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
  FileText, 
  Plus, 
  Upload,
  Eye,
  Download,
  MessageSquare,
  CheckCircle,
  Clock,
  MoreHorizontal,
  File,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  // Define columns for the data table
  const columns: ColumnDef<Drawing>[] = [
    {
      accessorKey: "drawingNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Drawing Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const drawing = row.original;
        return (
          <div className="font-mono text-sm">
            {drawing.drawingNumber}
            {drawing.revisionNumber && (
              <span className="text-muted-foreground ml-1">Rev. {drawing.revisionNumber}</span>
            )}
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
        const drawing = row.original;
        return (
          <div className="max-w-[250px]">
            <div className="font-medium">{drawing.title}</div>
            {drawing.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {drawing.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "buildGroup",
      header: "Build Group",
      cell: ({ row }) => {
        const buildGroup = row.getValue("buildGroup") as string;
        return (
          <div className="flex items-center gap-2">
            <span className="text-lg">{getBuildGroupIcon(buildGroup)}</span>
            <span className="capitalize">{buildGroup?.replace('_', ' ') || 'N/A'}</span>
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
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(status)}>
              {status?.replace('_', ' ') || 'Unknown'}
            </Badge>
            {row.original.isCurrentRevision && (
              <Badge variant="outline" className="text-xs">Current</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "discipline",
      header: "Discipline",
      cell: ({ row }) => {
        const discipline = row.getValue("discipline") as string;
        return <span className="capitalize">{discipline?.replace('_', ' ') || 'N/A'}</span>;
      },
    },
    {
      accessorKey: "drawingType",
      header: "Type",
      cell: ({ row }) => {
        const drawingType = row.getValue("drawingType") as string;
        return <span className="capitalize">{drawingType?.replace('_', ' ') || 'N/A'}</span>;
      },
    },
    {
      accessorKey: "scale",
      header: "Scale",
      cell: ({ row }) => {
        return row.getValue("scale") || "—";
      },
    },
    {
      accessorKey: "fileSize",
      header: "File Size",
      cell: ({ row }) => {
        const fileSize = row.getValue("fileSize") as number;
        return formatFileSize(fileSize);
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
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => {
        const creator = row.getValue("createdBy") as any;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator?.avatarUrl} />
              <AvatarFallback className="text-xs">
                {creator?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{creator?.fullName || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "comments",
      header: "Comments",
      cell: ({ row }) => {
        const comments = row.getValue("comments") as any[];
        if (!comments || comments.length === 0) return "—";
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const drawing = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedDrawing(drawing)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {drawing.fileUrl && (
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
              {drawing.status === 'for_review' && (
                <DropdownMenuItem>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Drawing Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage technical drawings and blueprints for this project
          </p>
        </div>
        <UploadDrawingDialog 
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onSubmit={(data) => uploadDrawingMutation.mutate(data)}
          isLoading={uploadDrawingMutation.isPending}
        />
      </div>

      {/* Drawings Data Table */}
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
      ) : drawings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No drawings found</h3>
            <p className="text-muted-foreground mb-4">
              No drawings have been uploaded for this project yet
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Upload First Drawing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable 
          columns={columns} 
          data={drawings}
          filterColumn="title"
          filterPlaceholder="Search drawings..."
        />
      )}

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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
      setUploadError('Please upload a drawing file');
      return;
    }

    const uploadedFile = uploadedFiles[0]; // Use first uploaded file
    const submitData = {
      ...formData,
      fileUrl: uploadedFile.url,
      fileName: uploadedFile.originalName,
      fileSize: uploadedFile.fileSize,
      thumbnailUrl: uploadedFile.thumbnailPath ? `/api/thumbnails/${uploadedFile.thumbnailPath.split('/').pop()}` : undefined
    };
    
    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    setUploadError('');
    toast.success(`Drawing file uploaded successfully`);
  };

  const handleFileError = (error: string) => {
    setUploadError(error);
    toast.error(`Upload failed: ${error}`);
  };

  const handleClose = () => {
    setUploadedFiles([]);
    setUploadError('');
    setFormData({
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-1.5" />
          Upload Drawing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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

          <div className="space-y-4">
            <h4 className="font-medium">Drawing File</h4>
            <FileUpload
              category="drawings"
              onUpload={handleFileUpload}
              onError={handleFileError}
              multiple={false}
              metadata={{
                projectId: formData.drawingNumber,
                drawingNumber: formData.drawingNumber,
                buildGroup: formData.buildGroup
              }}
            />
            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.drawingNumber || !formData.title || uploadedFiles.length === 0}
            >
              {isLoading ? 'Creating Drawing...' : 'Create Drawing'}
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
              {drawing.status?.replace('_', ' ') || 'Unknown'}
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
                  <p className="capitalize">{drawing.buildGroup?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Discipline:</span>
                  <p className="capitalize">{drawing.discipline?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Type:</span>
                  <p className="capitalize">{drawing.drawingType?.replace('_', ' ') || 'N/A'}</p>
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