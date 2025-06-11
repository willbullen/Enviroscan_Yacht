import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Building, FileText, AlertTriangle, Box, Image } from "lucide-react";
import BuildProjectsList from "@/components/build/BuildProjectsList";
import BuildDrawingsList from "@/components/build/BuildDrawingsList";
import BuildIssuesList from "@/components/build/BuildIssuesList";
import BuildDocumentsList from "@/components/build/BuildDocumentsList";
import CreateProjectDialog from "@/components/build/CreateProjectDialog";

export default function BuildManagement() {
  const [activeTab, setActiveTab] = useState("projects");
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  
  // For now, use a hardcoded vessel ID until vessel context is available
  const vesselId = 1;

  // Fetch build projects for the selected vessel
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/build-projects", vesselId],
    enabled: !!vesselId,
  });

  const vesselProjects = (projects as any[]).filter((p: any) => p.vesselId === vesselId);
  const activeProjects = vesselProjects.filter((p: any) => !['completed', 'cancelled'].includes(p.status));

  // Fetch build issues for active projects
  const { data: issues = [] } = useQuery({
    queryKey: ["/api/build-issues"],
    enabled: !!vesselId,
  });

  const openIssues = (issues as any[]).filter((issue: any) => 
    vesselProjects.some((p: any) => p.id === issue.projectId) && 
    !['resolved', 'closed'].includes(issue.status)
  );

  // Fetch build drawings
  const { data: drawings = [] } = useQuery({
    queryKey: ["/api/build-drawings"],
    enabled: !!vesselId,
  });

  const vesselDrawings = (drawings as any[]).filter((drawing: any) => 
    vesselProjects.some((p: any) => p.id === drawing.projectId)
  );

  // Fetch build documents
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/build-documents"],
    enabled: !!vesselId,
  });

  const vesselDocuments = (documents as any[]).filter((doc: any) => 
    vesselProjects.some((p: any) => p.id === doc.projectId)
  );

  // Fetch 3D models
  const { data: models = [] } = useQuery({
    queryKey: ["/api/build-3d-models"],
    enabled: !!vesselId,
  });

  const vesselModels = (models as any[]).filter((model: any) => 
    vesselProjects.some((p: any) => p.id === model.projectId)
  );

  // Remove vessel check for now since we're using hardcoded vessel ID

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Build & Refit Management</h1>
          <p className="text-muted-foreground">
            Manage yacht construction and refit projects for Vessel ID: {vesselId}
          </p>
        </div>
        <Button onClick={() => setCreateProjectOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {vesselProjects.length} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openIssues.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drawings</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vesselDrawings.length}</div>
            <p className="text-xs text-muted-foreground">
              Technical drawings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vesselDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Project documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">3D Models</CardTitle>
            <Cube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vesselModels.length}</div>
            <p className="text-xs text-muted-foreground">
              Digital models
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="drawings" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Drawings
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Issues
            {openIssues.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {openIssues.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            3D Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          <BuildProjectsList 
            projects={vesselProjects} 
            loading={projectsLoading}
            vesselId={vesselId}
          />
        </TabsContent>

        <TabsContent value="drawings" className="mt-6">
          <BuildDrawingsList 
            drawings={vesselDrawings}
            projects={vesselProjects}
            vesselId={vesselId}
          />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <BuildIssuesList 
            issues={issues.filter(issue => 
              vesselProjects.some(p => p.id === issue.projectId)
            )}
            projects={vesselProjects}
            vesselId={vesselId}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <BuildDocumentsList 
            documents={vesselDocuments}
            projects={vesselProjects}
            vesselId={vesselId}
          />
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <Build3DModelsList 
            models={vesselModels}
            projects={vesselProjects}
            vesselId={vesselId}
          />
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <CreateProjectDialog 
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        vesselId={selectedVessel.id}
      />
    </div>
  );
}