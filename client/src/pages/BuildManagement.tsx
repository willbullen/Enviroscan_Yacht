import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Hammer, 
  PlusCircle, 
  Filter, 
  Search,
  Users,
  FileText,
  AlertTriangle,
  FolderOpen,
  Box,
  BarChart3,
  Calendar,
  Target,
  Activity,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useVessel } from '@/contexts/VesselContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import BuildProjectList from '@/components/build/BuildProjectList';
import BuildProjectDetail from '@/components/build/BuildProjectDetail';
import CreateProjectDialog from '@/components/build/CreateProjectDialog';
import BuildDashboard from '@/components/build/BuildDashboard';
import IssueTracker from '@/components/build/IssueTracker';
import DrawingManager from '@/components/build/DrawingManager';
import DocumentManager from '@/components/build/DocumentManager';
import ModelViewer3D from '@/components/build/ModelViewer3D';

// Types for our build management system - matching database schema
export interface BuildProject {
  id: number;
  vesselId: number;
  name: string;
  description?: string;
  projectType: 'new_build' | 'refit' | 'major_refit' | 'survey_rectification';
  status: 'planning' | 'design' | 'construction' | 'commissioning' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  budgetTotal?: string; // Database uses decimal/string
  budgetSpent?: string; // Database uses decimal/string
  progressPercentage?: number;
  projectManagerId?: number;
  yardLocation?: string;
  contractorCompany?: string;
  notes?: string;
  tags?: string[];
  createdById: number;
  createdAt: string;
  updatedAt: string;
  vessel?: any;
  projectManager?: any;
  createdBy?: any;
  team?: any[];
  drawings?: any[];
  issues?: any[];
  documents?: any[];
  models3D?: any[];
  milestones?: any[];
}

export interface BuildDrawing {
  id: number;
  projectId: number;
  drawingNumber: string;
  title: string;
  description?: string;
  buildGroup: 'general_arrangement' | 'structural' | 'mechanical' | 'electrical' | 'interior' | 'exterior';
  discipline: 'naval_architecture' | 'engineering' | 'interior_design' | 'systems';
  drawingType: 'plan' | 'section' | 'detail' | 'isometric' | '3d_view';
  scale?: string;
  status: 'draft' | 'for_review' | 'approved' | 'superseded' | 'cancelled';
  revisionNumber?: string;
  isCurrentRevision?: boolean;
  approvalRequired?: boolean;
  approvedById?: number;
  approvedAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  thumbnailUrl?: string;
  tags?: string[];
  metadata?: any;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuildIssue {
  id: number;
  projectId: number;
  issueNumber: string;
  title: string;
  description: string;
  issueType: 'defect' | 'rework' | 'design_change' | 'procurement' | 'quality' | 'safety' | 'schedule';
  category: 'structural' | 'mechanical' | 'electrical' | 'interior' | 'systems' | 'exterior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  locationReference?: string;
  locationCoordinatesGA?: any;
  locationCoordinates3D?: any;
  drawingReference?: string;
  relatedDrawingId?: number;
  assignedToId?: number;
  reportedById: number;
  dueDate?: string;
  resolvedById?: number;
  resolvedAt?: string;
  resolutionNotes?: string;
  estimatedEffort?: number;
  actualEffort?: number;
  costImpact?: number;
  scheduleImpact?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  photos?: any[];
  comments?: any[];
}

const BuildManagement: React.FC = () => {
  const { currentVessel } = useVessel();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch build projects for the current vessel
  const { 
    data: projects = [], 
    isLoading: projectsLoading,
    error: projectsError 
  } = useQuery<BuildProject[]>({
    queryKey: [`/api/build/projects/vessel/${currentVessel.id}`],
    enabled: !!currentVessel.id
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Partial<BuildProject>) => {
      return apiRequest('POST', '/api/build/projects', {
        ...projectData,
        vesselId: currentVessel.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/build/projects/vessel/${currentVessel.id}`] });
      setIsCreateProjectOpen(false);
    },
  });

  // Get project summary stats
  const getProjectStats = () => {
    const total = projects.length;
    const active = projects.filter((p: BuildProject) => 
      ['planning', 'design', 'construction', 'commissioning'].includes(p.status)
    ).length;
    const completed = projects.filter((p: BuildProject) => p.status === 'completed').length;
    const onHold = projects.filter((p: BuildProject) => p.status === 'on_hold').length;
    
    return { total, active, completed, onHold };
  };

  const stats = getProjectStats();

  // Handle project selection
  const handleProjectSelect = (project: BuildProject) => {
    setSelectedProjectId(project.id);
    setActiveTab('overview');
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
    setActiveTab('dashboard');
  };

  // If a project is selected, show the detail view
  if (selectedProjectId) {
    return (
      <MainLayout title="Build Management - Project Details">
        <BuildProjectDetail 
          projectId={selectedProjectId}
          onBack={handleBackToList}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Build Management">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="h-6 w-6" />
            Build Management
          </h1>
          <p className="text-muted-foreground">
            Manage yacht construction and refit projects for {currentVessel.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateProjectOpen(true)}
            className="gap-1.5 font-medium"
          >
            <PlusCircle className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Hammer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.onHold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Project-Centric Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Build Projects</CardTitle>
          <CardDescription>
            Select a project to manage drawings, issues, documents, and 3D models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-1.5">
                <Hammer className="h-4 w-4" />
                Projects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <BuildDashboard 
                projects={projects}
                onProjectSelect={handleProjectSelect}
              />
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
              
              <BuildProjectList 
                projects={projects}
                loading={projectsLoading}
                onProjectSelect={handleProjectSelect}
                searchQuery={searchQuery}
                filterStatus={filterStatus}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        onSubmit={(projectData) => createProjectMutation.mutate(projectData)}
        isLoading={createProjectMutation.isPending}
      />
    </MainLayout>
  );
};

export default BuildManagement; 