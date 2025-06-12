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
  FolderOpen, 
  Plus, 
  Upload,
  Eye,
  Download,
  File,
  FileText,
  MoreHorizontal,
  ArrowUpDown
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

interface Document {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  category: string;
  documentType: string;
  tags?: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isLatestVersion?: boolean;
  versionNumber?: string;
  uploadedBy: any;
  uploadedAt: string;
  versions?: any[];
}

interface DocumentManagerProps {
  projectId: number;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ projectId }) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Fetch documents for the project
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: [`/api/build/projects/${projectId}/documents`],
    enabled: !!projectId
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      return apiRequest('POST', `/api/build/projects/${projectId}/documents`, documentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/build/projects/${projectId}/documents`] });
      setIsUploadOpen(false);
    },
  });

  // Define columns for the data table
  const columns: ColumnDef<Document>[] = [
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
        const document = row.original;
        return (
          <div className="max-w-[300px]">
            <div className="font-medium">{document.title}</div>
            {document.description && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {document.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return (
          <Badge className={getCategoryColor(category)}>
            {category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "documentType",
      header: "Type",
      cell: ({ row }) => {
        const documentType = row.getValue("documentType") as string;
        return <span className="capitalize">{documentType}</span>;
      },
    },
    {
      id: "file",
      header: "File",
      cell: ({ row }) => {
        const document = row.original;
        return (
          <div className="flex items-center gap-2">
            {getFileIcon(document.mimeType)}
            <div className="min-w-0">
              <div className="text-sm font-medium truncate max-w-[150px]" title={document.fileName}>
                {document.fileName || 'No file'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFileSize(document.fileSize)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "uploadedBy",
      header: "Uploaded By",
      cell: ({ row }) => {
        const uploadedBy = row.getValue("uploadedBy") as any;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={uploadedBy?.avatarUrl} />
              <AvatarFallback className="text-xs">
                {uploadedBy?.fullName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{uploadedBy?.fullName || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "uploadedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Uploaded
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return formatDate(row.getValue("uploadedAt"));
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.getValue("tags") as string[];
        if (!tags || tags.length === 0) return "—";
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "version",
      header: "Version",
      cell: ({ row }) => {
        const document = row.original;
        return (
          <div className="flex items-center gap-2">
            {document.versionNumber && (
              <span className="text-sm font-mono">{document.versionNumber}</span>
            )}
            {document.isLatestVersion && (
              <Badge variant="outline" className="text-xs">Latest</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const document = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedDocument(document)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {document.fileUrl && (
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'specification': return 'bg-blue-100 text-blue-800';
      case 'report': return 'bg-green-100 text-green-800';
      case 'certificate': return 'bg-purple-100 text-purple-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      case 'correspondence': return 'bg-yellow-100 text-yellow-800';
      case 'manual': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-8 w-8 text-gray-400" />;
    
    if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (mimeType.includes('word')) return <FileText className="h-8 w-8 text-blue-500" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-8 w-8 text-green-500" />;
    if (mimeType.includes('image')) return <FileText className="h-8 w-8 text-purple-500" />;
    
    return <File className="h-8 w-8 text-gray-400" />;
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
            <FolderOpen className="h-5 w-5" />
            Document Library
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage project documentation, specifications, and reports
          </p>
        </div>
        <UploadDocumentDialog 
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          onSubmit={(data) => uploadDocumentMutation.mutate(data)}
          isLoading={uploadDocumentMutation.isPending}
        />
      </div>

      {/* Documents Data Table */}
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
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              No documents have been uploaded for this project yet
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable 
          columns={columns} 
          data={documents}
          filterColumn="title"
          filterPlaceholder="Search documents..."
        />
      )}

      {/* Document Detail Dialog */}
      {selectedDocument && (
        <DocumentDetailDialog
          document={selectedDocument}
          open={!!selectedDocument}
          onOpenChange={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

// Upload Document Dialog Component
const UploadDocumentDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}> = ({ open, onOpenChange, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'specification',
    documentType: 'technical',
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
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
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload New Document</DialogTitle>
          <DialogDescription>
            Upload a new document for this project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Technical Specification - Hull Structure"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the document"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specification">Specification</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="correspondence">Correspondence</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.documentType} onValueChange={(value) => handleChange('documentType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="structural, specification, hull"
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">File Upload</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Select the document file to upload
            </p>
            <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" />
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
            <Button type="submit" disabled={isLoading || !formData.title}>
              {isLoading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Document Detail Dialog Component
const DocumentDetailDialog: React.FC<{
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ document, open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getFileIcon(document.mimeType)}
            <Badge className={getCategoryColor(document.category)}>
              {document.category}
            </Badge>
          </div>
          <DialogTitle>{document.title}</DialogTitle>
          {document.description && (
            <DialogDescription>{document.description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Category:</span>
              <p className="capitalize">{document.category}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Type:</span>
              <p className="capitalize">{document.documentType}</p>
            </div>
            {document.fileName && (
              <div>
                <span className="font-medium text-muted-foreground">File Name:</span>
                <p>{document.fileName}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-muted-foreground">File Size:</span>
              <p>{formatFileSize(document.fileSize)}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Uploaded By:</span>
              <p>{document.uploadedBy?.fullName || 'Unknown'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Upload Date:</span>
              <p>{new Date(document.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {document.tags && document.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Version History</h4>
            <div className="text-center py-4 text-sm text-muted-foreground">
              Version history will be implemented here
            </div>
          </div>

          {document.fileUrl && (
            <div className="flex gap-3">
              <Button className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Document
              </Button>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'specification': return 'bg-blue-100 text-blue-800';
    case 'report': return 'bg-green-100 text-green-800';
    case 'certificate': return 'bg-purple-100 text-purple-800';
    case 'contract': return 'bg-orange-100 text-orange-800';
    case 'correspondence': return 'bg-yellow-100 text-yellow-800';
    case 'manual': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <File className="h-8 w-8 text-gray-400" />;
  
  if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
  if (mimeType.includes('word')) return <FileText className="h-8 w-8 text-blue-500" />;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileText className="h-8 w-8 text-green-500" />;
  if (mimeType.includes('image')) return <FileText className="h-8 w-8 text-purple-500" />;
  
  return <File className="h-8 w-8 text-gray-400" />;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export default DocumentManager; 