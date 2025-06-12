import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
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
  Box,
  MoreHorizontal,
  ArrowUpDown,
  Edit,
  Trash2
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BuildProject } from '@/pages/BuildManagement';
import { toast } from 'sonner';
import DrawingManager from './DrawingManager';
import IssueTracker from './IssueTracker';
import DocumentManager from './DocumentManager';
import ModelViewer3D from './ModelViewer3D';

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
                ? (() => {
                    const spent = parseFloat(project.budgetSpent);
                    const total = parseFloat(project.budgetTotal);
                    return !isNaN(spent) && !isNaN(total) && total > 0 
                      ? Math.round((spent / total) * 100) 
                      : 0;
                  })()
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
                  <Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.team && project.team.length > 0 ? (
                  <DataTable
                    columns={teamColumns}
                    data={project.team}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No team members</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding team members to this project
                    </p>
                    <Button onClick={() => setIsAddMemberOpen(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add First Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drawings" className="space-y-4">
            <DrawingManager projectId={projectId} />
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <IssueTracker projectId={projectId} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentManager projectId={projectId} />
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <ModelViewer3D projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input 
                type="text" 
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter member name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <input 
                type="text" 
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter role (e.g., Project Manager, Engineer)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input 
                type="email" 
                className="w-full mt-1 px-3 py-2 border rounded-md"
                placeholder="Enter email address"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsAddMemberOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: Implement add member functionality
              toast.success('Team member added successfully');
              setIsAddMemberOpen(false);
            }}>
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const teamColumns: ColumnDef<any>[] = [
  {
    accessorKey: "user",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Team Member
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const member = row.original;
      const user = member.user;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>
              {user?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user?.fullName || 'Unknown User'}</div>
            <div className="text-sm text-muted-foreground">{user?.username || ''}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return <span className="capitalize">{role?.replace('_', ' ') || 'No role'}</span>;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const member = row.original;
      return (
        <div className="flex items-center gap-2">
          {member.isLead && (
            <Badge variant="secondary">Lead</Badge>
          )}
          <Badge variant="outline" className="text-xs">
            Active
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "assignedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Assigned
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const assignedAt = row.getValue("assignedAt") as string;
      return assignedAt ? new Date(assignedAt).toLocaleDateString() : "—";
    },
  },
  {
    accessorKey: "assignedBy",
    header: "Assigned By",
    cell: ({ row }) => {
      const assignedBy = row.getValue("assignedBy") as any;
      return assignedBy?.fullName || "—";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove from Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default BuildProjectDetail; 