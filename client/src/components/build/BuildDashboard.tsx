import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  Clock,
  DollarSign,
  Eye
} from 'lucide-react';
import { BuildProject } from '@/pages/BuildManagement';

interface BuildDashboardProps {
  projects: BuildProject[];
  onProjectSelect: (project: BuildProject) => void;
}

const BuildDashboard: React.FC<BuildDashboardProps> = ({
  projects,
  onProjectSelect
}) => {
  // Calculate dashboard metrics
  const activeProjects = projects.filter(p => 
    ['planning', 'design', 'construction', 'commissioning'].includes(p.status)
  );
  
  const recentProjects = projects
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingDeadlines = projects
    .filter(p => p.estimatedCompletionDate && p.status !== 'completed')
    .sort((a, b) => new Date(a.estimatedCompletionDate!).getTime() - new Date(b.estimatedCompletionDate!).getTime())
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'design': return 'bg-purple-100 text-purple-800';
      case 'construction': return 'bg-orange-100 text-orange-800';
      case 'commissioning': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.reduce((sum, p) => sum + (p.budgetTotal || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProjects.length > 0 
                ? Math.round(activeProjects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / activeProjects.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Projects
          </CardTitle>
          <CardDescription>
            Latest build and refit projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No projects created yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onProjectSelect(project)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(project.status)}`}
                      >
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.projectType.replace('_', ' ')} • Created {formatDate(project.createdAt)}
                    </p>
                    {project.progressPercentage !== undefined && (
                      <div className="mt-2">
                        <Progress value={project.progressPercentage} className="h-1" />
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="ml-4">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>
            Projects with approaching completion dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No upcoming deadlines
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((project) => {
                const daysUntil = Math.ceil(
                  (new Date(project.estimatedCompletionDate!).getTime() - new Date().getTime()) 
                  / (1000 * 60 * 60 * 24)
                );
                
                return (
                  <div 
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => onProjectSelect(project)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{project.name}</h4>
                        {daysUntil < 30 && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDate(project.estimatedCompletionDate!)} 
                        {daysUntil > 0 && ` (${daysUntil} days)`}
                        {daysUntil <= 0 && (
                          <span className="text-red-600 font-medium"> (OVERDUE)</span>
                        )}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-4">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildDashboard; 