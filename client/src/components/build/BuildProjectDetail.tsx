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
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Hammer, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  Settings,
  Plus,
  FileText,
  AlertTriangle,
  FolderOpen,
  Box
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileUploadDialog } from '@/components/ui/FileUploadDialog';
import { BuildProject } from '@/pages/BuildManagement';
import { toast } from 'sonner';

interface BuildProjectDetailProps {
  projectId: number;
  onBack: () => void;
}

const BuildProjectDetail: React.FC<BuildProjectDetailProps> = ({
  projectId,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isUploadDrawingOpen, setIsUploadDrawingOpen] = useState(false);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);

  // Fetch detailed project information
  const { data: project, isLoading } = useQuery<BuildProject>({
    queryKey: [`/api/build/projects/${projectId}`],
    enabled: !!projectId
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Projects
          </Button>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Projects
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Project not found</h3>
            <p className="text-muted-foreground">
              The requested project could not be found or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hammer className="h-6 w-6" />
              {project.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(project.status)}`}
              >
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-xs ${getPriorityColor(project.priority)}`}
              >
                {project.priority} priority
              </Badge>
              <span className="text-sm text-muted-foreground capitalize">
                {project.projectType.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1.5" />
          Project Settings
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progressPercentage || 0}%</div>
            <Progress value={project.progressPercentage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.budgetTotal && project.budgetSpent 
                ? Math.round((project.budgetSpent / project.budgetTotal) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(project.budgetSpent)} / {formatCurrency(project.budgetTotal)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.team?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.estimatedCompletionDate 
                ? Math.max(0, Math.ceil((new Date(project.estimatedCompletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Until completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="drawings">Drawings</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="models">3D Models</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  Key project information and current status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                    <p className="capitalize">{project.projectType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="capitalize">{project.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p>{formatDate(project.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Target Completion</label>
                    <p>{formatDate(project.estimatedCompletionDate)}</p>
                  </div>
                  {project.yardLocation && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p>{project.yardLocation}</p>
                    </div>
                  )}
                  {project.contractorCompany && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contractor</label>
                      <p>{project.contractorCompany}</p>
                    </div>
                  )}
                </div>
                
                {project.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="mt-1">{project.description}</p>
                  </div>
                )}

                {project.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="mt-1">{project.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest project updates and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">Project created</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Activity history will appear here as the project progresses
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Team</CardTitle>
                    <CardDescription>
                      Manage team members and their roles
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.team && project.team.length > 0 ? (
                  <div className="space-y-3">
                    {project.team.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user?.avatarUrl} />
                            <AvatarFallback>
                              {member.user?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user?.fullName || 'Unknown User'}</p>
                            <p className="text-sm text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                        {member.isLead && (
                          <Badge variant="secondary">Lead</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No team members</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding team members to this project
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add First Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drawings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Technical Drawings
                    </CardTitle>
                    <CardDescription>
                      Manage project drawings and blueprints
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Upload Drawing
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No drawings uploaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload technical drawings, plans, and blueprints
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Upload First Drawing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Project Issues
                    </CardTitle>
                    <CardDescription>
                      Track and manage project issues
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Issue
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No issues reported</h3>
                  <p className="text-muted-foreground mb-4">
                    Issues and defects will appear here
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Report First Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Project Documents
                    </CardTitle>
                    <CardDescription>
                      Manage project documentation
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload specifications, reports, and other documents
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Upload First Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="h-5 w-5" />
                      3D Models & Scans
                    </CardTitle>
                    <CardDescription>
                      View and manage 3D models and scans
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Model
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No 3D models</h3>
                  <p className="text-muted-foreground mb-4">
                    Add 3D models, Matterport scans, and CAD files
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add First Model
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuildProjectDetail; 