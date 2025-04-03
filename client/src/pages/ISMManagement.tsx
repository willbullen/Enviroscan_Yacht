import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from "@/components/layout/MainLayout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Clipboard, 
  ClipboardCheck, 
  FileText, 
  Users, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Plus, 
  Filter, 
  Book
} from 'lucide-react';

interface ISMDocument {
  id: number;
  title: string;
  documentType: string;
  documentNumber: string;
  status: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  approvalDate: string | null;
}

interface ISMAudit {
  id: number;
  title: string;
  auditType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface ISMTraining {
  id: number;
  title: string;
  trainingType: string;
  status: string;
  scheduledDate: string | null;
  completionDate: string | null;
  createdAt: string;
}

interface ISMIncident {
  id: number;
  title: string;
  incidentType: string;
  status: string;
  severity: string;
  dateOccurred: string;
  dateReported: string;
  createdAt: string;
}

const statusColors = {
  draft: "bg-yellow-500",
  pending: "bg-blue-500",
  approved: "bg-green-500",
  outdated: "bg-gray-500",
  active: "bg-green-500",
  inactive: "bg-gray-500",
  completed: "bg-green-500",
  planned: "bg-blue-500",
  in_progress: "bg-orange-500",
  scheduled: "bg-blue-500",
  cancelled: "bg-red-500",
  open: "bg-yellow-500",
  closed: "bg-gray-500",
  investigating: "bg-orange-500",
  resolved: "bg-green-500",
};

const ISMManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("documents");

  // Queries for different ISM entities
  const documentsQuery = useQuery({
    queryKey: ['/api/ism/documents'],
    enabled: selectedTab === "documents",
  });

  const auditsQuery = useQuery({
    queryKey: ['/api/ism/audits'],
    enabled: selectedTab === "audits",
  });

  const trainingQuery = useQuery({
    queryKey: ['/api/ism/training'],
    enabled: selectedTab === "training",
  });

  const incidentsQuery = useQuery({
    queryKey: ['/api/ism/incidents'],
    enabled: selectedTab === "incidents",
  });

  const renderStatus = (status: string) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || "bg-gray-500";
    return (
      <Badge 
        className={`${colorClass} text-white`}
      >
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const renderDocumentsList = () => {
    if (documentsQuery.isLoading) return <div className="p-8 text-center">Loading documents...</div>;
    if (documentsQuery.isError) return <div className="p-8 text-center text-red-500">Error loading documents</div>;
    
    const documents = documentsQuery.data as ISMDocument[] || [];
    
    if (documents.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No ISM documents found</p>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
          <Button className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Document
          </Button>
        </div>
        
        <Table>
          <TableCaption>List of ISM Documents</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Doc. Number</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map(doc => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>{doc.documentType}</TableCell>
                <TableCell>{doc.documentNumber}</TableCell>
                <TableCell>{doc.version}</TableCell>
                <TableCell>{renderStatus(doc.status)}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderAuditsList = () => {
    if (auditsQuery.isLoading) return <div className="p-8 text-center">Loading audits...</div>;
    if (auditsQuery.isError) return <div className="p-8 text-center text-red-500">Error loading audits</div>;
    
    const audits = auditsQuery.data as ISMAudit[] || [];
    
    if (audits.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No ISM audits found</p>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
          <Button className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Schedule Audit
          </Button>
        </div>
        
        <Table>
          <TableCaption>List of ISM Audits</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map(audit => (
              <TableRow key={audit.id}>
                <TableCell className="font-medium">{audit.title}</TableCell>
                <TableCell>{audit.auditType}</TableCell>
                <TableCell>{renderStatus(audit.status)}</TableCell>
                <TableCell>
                  {audit.startDate 
                    ? format(new Date(audit.startDate), 'MMM d, yyyy') 
                    : 'Not scheduled'}
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderTrainingList = () => {
    if (trainingQuery.isLoading) return <div className="p-8 text-center">Loading training sessions...</div>;
    if (trainingQuery.isError) return <div className="p-8 text-center text-red-500">Error loading training sessions</div>;
    
    const trainings = trainingQuery.data as ISMTraining[] || [];
    
    if (trainings.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No ISM training sessions found</p>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
          <Button className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Schedule Training
          </Button>
        </div>
        
        <Table>
          <TableCaption>List of ISM Training Sessions</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainings.map(training => (
              <TableRow key={training.id}>
                <TableCell className="font-medium">{training.title}</TableCell>
                <TableCell>{training.trainingType}</TableCell>
                <TableCell>{renderStatus(training.status)}</TableCell>
                <TableCell>
                  {training.scheduledDate 
                    ? format(new Date(training.scheduledDate), 'MMM d, yyyy') 
                    : 'Not scheduled'}
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(training.createdAt), { addSuffix: true })}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderIncidentsList = () => {
    if (incidentsQuery.isLoading) return <div className="p-8 text-center">Loading incidents...</div>;
    if (incidentsQuery.isError) return <div className="p-8 text-center text-red-500">Error loading incidents</div>;
    
    const incidents = incidentsQuery.data as ISMIncident[] || [];
    
    if (incidents.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No ISM incidents found</p>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="w-4 h-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Search className="w-4 h-4" /> Search
            </Button>
          </div>
          <Button className="flex items-center gap-1">
            <Plus className="w-4 h-4" /> Report Incident
          </Button>
        </div>
        
        <Table>
          <TableCaption>List of ISM Incidents</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Occurred</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map(incident => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">{incident.title}</TableCell>
                <TableCell>{incident.incidentType}</TableCell>
                <TableCell>
                  <Badge 
                    className={
                      incident.severity === 'high' ? 'bg-red-500 text-white' :
                      incident.severity === 'medium' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-white'
                    }
                  >
                    {incident.severity}
                  </Badge>
                </TableCell>
                <TableCell>{renderStatus(incident.status)}</TableCell>
                <TableCell>{format(new Date(incident.dateOccurred), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ISM Management</h1>
            <p className="text-muted-foreground">
              Manage International Safety Management documents, audits, training, and incidents
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              View Calendar
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Book className="w-4 h-4" />
              ISM Code Reference
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="audits" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Audits
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Incidents
            </TabsTrigger>
          </TabsList>
          
          <Card className="border-none shadow-none mt-4">
            <ScrollArea className="h-[70vh]">
              <TabsContent value="documents" className="m-0">
                {renderDocumentsList()}
              </TabsContent>
              
              <TabsContent value="audits" className="m-0">
                {renderAuditsList()}
              </TabsContent>
              
              <TabsContent value="training" className="m-0">
                {renderTrainingList()}
              </TabsContent>
              
              <TabsContent value="incidents" className="m-0">
                {renderIncidentsList()}
              </TabsContent>
            </ScrollArea>
          </Card>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ISMManagement;