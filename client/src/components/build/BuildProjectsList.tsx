import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Calendar, MapPin, DollarSign, Users } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import ProjectDetailsDialog from "./ProjectDetailsDialog";
import EditProjectDialog from "./EditProjectDialog";

interface BuildProject {
  id: number;
  vesselId: number;
  name: string;
  description: string | null;
  projectType: string;
  status: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  estimatedBudget: number | null;
  actualCost: number | null;
  progressPercentage: number;
  projectManagerId: number | null;
  contractorId: number | null;
  location: string | null;
  specifications: unknown;
  milestones: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdById: number | null;
}

interface BuildProjectsListProps {
  projects: BuildProject[];
  loading: boolean;
  vesselId: number;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'planning': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'on_hold': return 'bg-orange-100 text-orange-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatProjectType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function BuildProjectsList({ projects, loading, vesselId }: BuildProjectsListProps) {
  const [selectedProject, setSelectedProject] = useState<BuildProject | null>(null);
  const [editProject, setEditProject] = useState<BuildProject | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: number) => 
      apiRequest(`/api/build-projects/${projectId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/build-projects'] });
    },
  });

  const handleViewDetails = (project: BuildProject) => {
    setSelectedProject(project);
    setDetailsOpen(true);
  };

  const handleEdit = (project: BuildProject) => {
    setEditProject(project);
    setEditOpen(true);
  };

  const handleDelete = async (projectId: number) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProjectMutation.mutateAsync(projectId);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No build projects</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new build or refit project.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(project)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(project)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">{formatProjectType(project.projectType)}</span>
              </div>

              {project.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{project.progressPercentage}%</span>
                </div>
                <Progress value={project.progressPercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {project.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      {format(new Date(project.startDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600 truncate">{project.location}</span>
                  </div>
                )}
                {project.estimatedBudget && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">
                      ${project.estimatedBudget.toLocaleString()}
                    </span>
                  </div>
                )}
                {project.contractorId && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">Contractor</span>
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleViewDetails(project)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProject && (
        <ProjectDetailsDialog
          project={selectedProject}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {editProject && (
        <EditProjectDialog
          project={editProject}
          open={editOpen}
          onOpenChange={setEditOpen}
          vesselId={vesselId}
        />
      )}
    </>
  );
}