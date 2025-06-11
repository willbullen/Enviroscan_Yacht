import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, MoreHorizontal, Download, Edit, Trash2, Search, Plus, Eye } from "lucide-react";
import { BuildDrawing } from "@/types/build";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BuildDrawingsListProps {
  vesselId: number;
}

export default function BuildDrawingsList({ vesselId }: BuildDrawingsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: drawings = [], isLoading } = useQuery({
    queryKey: ["/api/build-drawings", vesselId],
    enabled: !!vesselId,
  });

  const deleteDrawingMutation = useMutation({
    mutationFn: (drawingId: number) => 
      apiRequest('DELETE', `/api/build-drawings/${drawingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/build-drawings'] });
      toast({
        title: "Drawing deleted",
        description: "Drawing has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting drawing",
        description: error.message || "Failed to delete drawing.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (drawingId: number) => {
    if (window.confirm("Are you sure you want to delete this drawing?")) {
      deleteDrawingMutation.mutate(drawingId);
    }
  };

  const filteredDrawings = drawings.filter((drawing: BuildDrawing) =>
    drawing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drawing.drawingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drawing.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="text-muted-foreground">Loading drawings...</div>
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
              placeholder="Search drawings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredDrawings.length} drawing{filteredDrawings.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Drawing
        </Button>
      </div>

      {/* Drawings Grid */}
      {filteredDrawings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No drawings found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No drawings match your search criteria." : "Get started by adding your first technical drawing."}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Drawing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrawings.map((drawing: BuildDrawing) => (
            <Card key={drawing.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium mb-1 line-clamp-2">
                      {drawing.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {drawing.drawingNumber}
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
                        onClick={() => handleDelete(drawing.id)}
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
                      {drawing.category}
                    </Badge>
                    <Badge className={getStatusColor(drawing.status)}>
                      {drawing.status}
                    </Badge>
                  </div>
                  
                  {drawing.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {drawing.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Rev. {drawing.revision}</span>
                    <span>{format(new Date(drawing.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  
                  {drawing.fileSize && (
                    <div className="text-xs text-muted-foreground">
                      Size: {(drawing.fileSize / 1024 / 1024).toFixed(2)} MB
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