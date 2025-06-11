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
  FolderOpen, 
  Plus, 
  Search,
  Upload,
  Eye,
  Download,
  FileText,
  File,
  MoreHorizontal,
  Clock,
  User,
  Tag,
  Filter
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
  projectId?: number | null;
  vesselId?: number;
  showAllProjects?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  projectId, 
  vesselId, 
  showAllProjects = false 
}) => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('cards');

  // Fetch documents for the project or all projects for vessel
  const queryKey = showAllProjects && vesselId 
    ? [`/api/build/vessel/${vesselId}/documents`]
    : [`/api/build/projects/${projectId}/documents`];
  
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey,
    enabled: !!(showAllProjects ? vesselId : projectId)
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      if (!projectId) throw new Error('Project must be selected to upload documents');
      return apiRequest('POST', `/api/build/projects/${projectId}/documents`, documentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsUploadOpen(false);
    },
  });

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

  // Filter documents
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = searchQuery === '' || 
      document.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || document.category === categoryFilter;
    const matchesType = typeFilter === 'all' || document.documentType === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // Group documents by category for cards view
  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

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
            {showAllProjects 
              ? "View all documents across vessel projects"
              : "Manage project documentation, specifications, and reports"
            }
          </p>
        </div>
        {!showAllProjects && (
          <UploadDocumentDialog 
            open={isUploadOpen}
            onOpenChange={setIsUploadOpen}
            onSubmit={(data) => uploadDocumentMutation.mutate(data)}
            isLoading={uploadDocumentMutation.isPending}
          />
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="specification">Specifications</SelectItem>
              <SelectItem value="report">Reports</SelectItem>
              <SelectItem value="certificate">Certificates</SelectItem>
              <SelectItem value="contract">Contracts</SelectItem>
              <SelectItem value="correspondence">Correspondence</SelectItem>
              <SelectItem value="manual">Manuals</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary and View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
        </p>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Documents Display */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="cards" className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all'
                    ? "Try adjusting your search or filter criteria"
                    : "No documents have been uploaded for this project yet"
                  }
                </p>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Upload First Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(documentsByCategory).map(([category, docs]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-medium capitalize">{category.replace('_', ' ')}</h3>
                    <Badge variant="secondary">{docs.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map((document) => (
                      <Card key={document.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getCategoryColor(document.category)}>
                                  {document.category}
                                </Badge>
                                {document.isLatestVersion && (
                                  <Badge variant="outline">Latest</Badge>
                                )}
                              </div>
                              <CardTitle className="text-base">{document.title}</CardTitle>
                              {document.description && (
                                <CardDescription className="mt-1 line-clamp-2">
                                  {document.description}
                                </CardDescription>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedDocument(document)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {document.fileUrl && (
                                  <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* File Icon */}
                          <div className="flex justify-center mb-4">
                            {getFileIcon(document.mimeType)}
                          </div>

                          {/* Document Info */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Type:</span>
                              <span className="capitalize">{document.documentType}</span>
                            </div>
                            {document.fileName && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">File:</span>
                                <span className="truncate max-w-[120px]" title={document.fileName}>
                                  {document.fileName}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Size:</span>
                              <span>{formatFileSize(document.fileSize)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Uploaded:</span>
                              <span>{formatDate(document.uploadedAt)}</span>
                            </div>
                          </div>

                          {/* Tags */}
                          {document.tags && document.tags.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-1">
                                {document.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {document.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{document.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => setSelectedDocument(document)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {document.fileUrl && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground">
                  Start by uploading your first project document
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div>{getFileIcon(document.mimeType)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{document.title}</span>
                            <Badge className={getCategoryColor(document.category)}>
                              {document.category}
                            </Badge>
                            {document.isLatestVersion && (
                              <Badge variant="outline">Latest</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {document.fileName} • {formatFileSize(document.fileSize)} • 
                            Uploaded {formatDate(document.uploadedAt)} by {document.uploadedBy?.fullName || 'Unknown'}
                          </div>
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {document.tags.slice(0, 5).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDocument(document)}
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