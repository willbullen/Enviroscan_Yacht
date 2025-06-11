import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User, MapPin, DollarSign, Clock, Building } from "lucide-react";
import { BuildProject } from "@/types/build";
import { format } from "date-fns";

interface ProjectDetailsDialogProps {
  project: BuildProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsDialog({ project, open, onOpenChange }: ProjectDetailsDialogProps) {
  if (!project) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'planning':
        return 'bg-blue-500';
      case 'on-hold':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building className="h-5 w-5" />
            {project.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            <Badge variant="outline" className={getPriorityColor(project.priority)}>
              {project.priority} Priority
            </Badge>
            <Badge variant="outline">
              {project.projectType}
            </Badge>
          </div>

          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">
                      {project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-sm text-muted-foreground">
                      {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {project.progress || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          {project.location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{project.location}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {project.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{project.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {format(new Date(project.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">
                    {format(new Date(project.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}