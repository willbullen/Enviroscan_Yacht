import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertTriangle, MoreHorizontal, Edit, Trash2, Search, Plus, Eye, Clock, User } from "lucide-react";
import { BuildIssue } from "@/types/build";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BuildIssuesListProps {
  vesselId: number;
}

export default function BuildIssuesList({ vesselId }: BuildIssuesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["/api/build-issues", vesselId],
    enabled: !!vesselId,
  });

  const deleteIssueMutation = useMutation({
    mutationFn: (issueId: number) => 
      apiRequest('DELETE', `/api/build-issues/${issueId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/build-issues'] });
      toast({
        title: "Issue deleted",
        description: "Issue has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting issue",
        description: error.message || "Failed to delete issue.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (issueId: number) => {
    if (window.confirm("Are you sure you want to delete this issue?")) {
      deleteIssueMutation.mutate(issueId);
    }
  };

  const filteredIssues = issues.filter((issue: BuildIssue) =>
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading issues...</div>
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
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No issues found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No issues match your search criteria." : "Great! No issues have been reported for this project."}
            </p>
            {!searchTerm && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Report First Issue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue: BuildIssue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(issue.priority)}>
                        {issue.priority}
                      </Badge>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {issue.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-medium mb-1">
                      {issue.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {issue.description}
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
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Issue
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(issue.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Created {format(new Date(issue.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {issue.assignedToId && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Assigned</span>
                      </div>
                    )}
                  </div>
                  {issue.dueDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Due {format(new Date(issue.dueDate), 'MMM dd')}</span>
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