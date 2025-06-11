import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, MoreHorizontal, Download, Edit, Trash2, Search, Plus, Eye, Upload } from "lucide-react";
import { BuildDocument } from "@/types/build";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BuildDocumentsListProps {
  vesselId: number;
}

export default function BuildDocumentsList({ vesselId }: BuildDocumentsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/build-documents", vesselId],
    enabled: !!vesselId,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => 
      apiRequest('DELETE', `/api/build-documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/build-documents'] });
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting document",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (documentId: number) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const filteredDocuments = documents.filter((document: BuildDocument) =>
    document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    document.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDocumentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'specification':
      case 'manual':
      case 'report':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'under-review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading documents...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No documents match your search criteria." : "Get started by uploading your first project document."}
            </p>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document: BuildDocument) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getDocumentTypeIcon(document.documentType)}
                      <CardTitle className="text-base font-medium line-clamp-2">
                        {document.title}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {document.documentType}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(document.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      v{document.version}
                    </Badge>
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                  
                  {document.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {document.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(document.createdAt), 'MMM dd, yyyy')}</span>
                    {document.fileSize && (
                      <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    )}
                  </div>
                  
                  {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {document.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {document.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{document.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}