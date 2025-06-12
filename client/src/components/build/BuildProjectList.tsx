import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  MapPin, 
  User, 
  Building2, 
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight
} from 'lucide-react';
import { BuildProject } from '@/pages/BuildManagement';

interface BuildProjectListProps {
  projects: BuildProject[];
  loading: boolean;
  onProjectSelect: (project: BuildProject) => void;
  searchQuery: string;
  filterStatus: string;
}

const BuildProjectList: React.FC<BuildProjectListProps> = ({
  projects,
  loading,
  onProjectSelect,
  searchQuery,
  filterStatus
}) => {
  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.yardLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.contractorCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'construction': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'commissioning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount?: string | number) => {
    if (!amount) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground">
            {searchQuery || filterStatus !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "Create your first build project to get started"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredProjects.map((project) => (
        <Card 
          key={project.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onProjectSelect(project)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {project.name}
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusColor(project.status)}`}
                  >
                    {project.status.replace('_', ' ')}
                  </Badge>
                  {project.priority !== 'medium' && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(project.priority)}`}
                    >
                      {project.priority}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {project.description || 'No description provided'}
                </CardDescription>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Project Type */}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Type:</span>
                <span className="capitalize">{project.projectType.replace('_', ' ')}</span>
              </div>

              {/* Project Manager */}
              {project.projectManager && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">PM:</span>
                  <span>{project.projectManager.fullName}</span>
                </div>
              )}

              {/* Location */}
              {project.yardLocation && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span>{project.yardLocation}</span>
                </div>
              )}

              {/* Start Date */}
              {project.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Started:</span>
                  <span>{formatDate(project.startDate)}</span>
                </div>
              )}

              {/* Estimated Completion */}
              {project.estimatedCompletionDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Due:</span>
                  <span>{formatDate(project.estimatedCompletionDate)}</span>
                </div>
              )}

              {/* Budget */}
              {project.budgetTotal && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Budget:</span>
                  <span>{formatCurrency(project.budgetTotal)}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {project.progressPercentage !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Progress
                  </span>
                  <span>{project.progressPercentage}%</span>
                </div>
                <Progress value={project.progressPercentage} className="h-2" />
              </div>
            )}

            {/* Budget Progress */}
            {project.budgetTotal && project.budgetSpent && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Budget Spent
                  </span>
                  <span>
                    {formatCurrency(project.budgetSpent)} / {formatCurrency(project.budgetTotal)}
                  </span>
                </div>
                <Progress 
                  value={(project.budgetSpent / project.budgetTotal) * 100} 
                  className="h-2" 
                />
              </div>
            )}

            {/* Team & Stats */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {project.team && project.team.length > 0 && (
                  <span>{project.team.length} team member{project.team.length !== 1 ? 's' : ''}</span>
                )}
                {project.drawings && project.drawings.length > 0 && (
                  <span>{project.drawings.length} drawing{project.drawings.length !== 1 ? 's' : ''}</span>
                )}
                {project.issues && project.issues.length > 0 && (
                  <span>{project.issues.length} issue{project.issues.length !== 1 ? 's' : ''}</span>
                )}
              </div>
              
              <Button variant="ghost" size="sm" className="gap-1.5">
                View Details
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BuildProjectList; 