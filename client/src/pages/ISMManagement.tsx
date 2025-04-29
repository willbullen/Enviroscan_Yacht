import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  Book,
  Upload,
  File,
  X,
  ListChecks
} from 'lucide-react';

// Import form submission component
import FormSubmission from "@/components/ism/FormSubmission";

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

interface FormCategory {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface FormTemplate {
  id: number;
  title: string;
  description: string | null;
  categoryId: number;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface FormTemplateVersion {
  id: number;
  templateId: number;
  versionNumber: string;
  structureDefinition: any; // JSON structure for the form
  createdById: number | null;
  isActive: boolean | null;
  createdAt: string;
}

interface ISMTask {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: number;
  // Allow both camelCase and snake_case property names based on API/DB responses
  templateVersionId?: number;
  formTemplateVersionId?: number;
  form_template_version_id?: number;
  dueDate: string | null;
  vesselId: number;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

interface FormSubmission {
  id: number;
  taskId: number;
  submittedBy: number;
  submissionData: any; // JSON data from form submission
  submittedAt: string;
  status: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewStatus: string | null;
  reviewComments: string | null;
}

interface TaskComment {
  id: number;
  taskId: number;
  userId: number;
  comment: string;
  attachments: string[];
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
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("documents");
  const [isFormAdminDialogOpen, setIsFormAdminDialogOpen] = useState(false);
  const [isNewDocumentDialogOpen, setIsNewDocumentDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    documentType: 'procedure',
    documentNumber: '',
    version: '1.0',
    status: 'draft',
    content: '',
    tags: ['safety', 'ism'],
    attachmentPath: '',
    createdBy: 1 // Assuming user ID 1 (Captain) is creating this
  });
  
  // State for form submission dialog
  const [isFormSubmissionOpen, setIsFormSubmissionOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ISMTask | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
  
  const tasksQuery = useQuery({
    queryKey: ['/api/ism/tasks'],
    enabled: selectedTab === "tasks",
  });
  
  const formCategoriesQuery = useQuery({
    queryKey: ['/api/ism/form-categories'],
    enabled: selectedTab === "tasks",
  });
  
  const formTemplatesQuery = useQuery({
    queryKey: ['/api/ism/form-templates'],
    enabled: selectedTab === "tasks",
  });
  
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    enabled: selectedTab === "tasks",
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Store just the filename in the document data
      setNewDocument({
        ...newDocument,
        attachmentPath: e.target.files[0].name
      });
    }
  };
  
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setNewDocument({
      ...newDocument,
      attachmentPath: ''
    });
  };
  
  const handleDocumentSubmit = async () => {
    try {
      // Validate form
      if (!newDocument.title || !newDocument.documentNumber) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      
      // If a file is selected, we would first upload it to the server
      // In a real implementation, we would use FormData to upload the file
      let documentData = {...newDocument};
      
      if (selectedFile) {
        // In a production environment, you would implement file upload here
        // This is a simplified example:
        // const formData = new FormData();
        // formData.append('file', selectedFile);
        // const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
        // const uploadResult = await uploadResponse.json();
        // documentData.attachmentPath = uploadResult.filePath;
        
        // For now, we'll just store the filename
        documentData.attachmentPath = selectedFile.name;
      }
      
      // Create the document using apiRequest
      await apiRequest('/api/ism/documents', {
        method: 'POST',
        data: documentData,
      });
      
      // Success handling
      queryClient.invalidateQueries({queryKey: ['/api/ism/documents']});
      setIsNewDocumentDialogOpen(false);
      
      // Reset form
      setNewDocument({
        title: '',
        documentType: 'procedure',
        documentNumber: '',
        version: '1.0',
        status: 'draft',
        content: '',
        tags: ['safety', 'ism'],
        attachmentPath: '',
        createdBy: 1
      });
      setSelectedFile(null);
      
      toast({
        title: "Success",
        description: "Document created successfully",
      });
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: `Failed to create document: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  // Function to open the form submission dialog
  const handleCompleteTask = (taskId: number) => {
    const task = (tasksQuery.data as ISMTask[]).find(t => t.id === taskId);
    
    if (task) {
      console.log("Selected task for completion:", task);
      
      // Load the task details via API call to ensure we have the most recent data
      apiRequest(`/api/ism/tasks/${taskId}`, {
        method: 'GET'
      }).then(response => {
        console.log("Retrieved task details:", response);
        
        const formTemplateVersionId = response.formTemplateVersionId || response.form_template_version_id;
        console.log("Found form template version ID:", formTemplateVersionId);
        
        // Create an enhanced task object with the templateVersionId property
        const enhancedTask = {
          ...task,
          id: response.id,
          templateVersionId: formTemplateVersionId
        };
        
        // First, validate that we have the form template version ID
        if (!formTemplateVersionId) {
          console.error("Missing form template version ID in task data:", response);
          toast({
            title: "Error",
            description: "This task doesn't have an associated form template",
            variant: "destructive",
          });
          return;
        }
        
        console.log("Enhanced task with templateVersionId:", enhancedTask);
        setSelectedTask(enhancedTask);
        setIsFormSubmissionOpen(true);
      }).catch(error => {
        console.error('Error loading task details:', error);
        toast({
          title: "Error",
          description: `Failed to load task details: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      });
    } else {
      toast({
        title: "Error",
        description: "Could not find task details",
        variant: "destructive",
      });
    }
  };

  const renderStatus = (status: string | undefined) => {
    if (!status) {
      return <Badge className="bg-gray-500 text-white">Unknown</Badge>;
    }
    
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
          <Button className="flex items-center gap-1" onClick={() => setIsNewDocumentDialogOpen(true)}>
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
                <TableCell>{new Date(doc.updatedAt).toLocaleDateString()}</TableCell>
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
                    ? new Date(audit.startDate).toLocaleDateString() 
                    : 'Not scheduled'}
                </TableCell>
                <TableCell>{new Date(audit.createdAt).toLocaleDateString()}</TableCell>
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
                    ? new Date(training.scheduledDate).toLocaleDateString() 
                    : 'Not scheduled'}
                </TableCell>
                <TableCell>{new Date(training.createdAt).toLocaleDateString()}</TableCell>
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
                <TableCell>{new Date(incident.dateOccurred).toLocaleDateString()}</TableCell>
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
  
  // State for new task dialog
  const [isAssignTaskDialogOpen, setIsAssignTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    form_template_version_id: 1,  // Default to the first form template version, matching the db column name
    assigned_to_id: 1,            // Default to the captain (user ID 1), matching the db column name
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to one week from now
    status: 'pending',
    vessel_id: 1,                // Default vessel ID, matching the db column name
    created_by_id: 1              // Default to current user (captain), matching the db column name
  });

  // Function to handle task creation
  const handleTaskSubmit = async () => {
    try {
      // Validate form
      if (!newTask.title) {
        toast({
          title: "Validation Error",
          description: "Please provide a title for the task",
          variant: "destructive",
        });
        return;
      }

      // Create the task using apiRequest
      // Log what we're about to send
      console.log("Sending task data:", {
        title: newTask.title,
        description: newTask.description,
        formTemplateVersionId: newTask.form_template_version_id,
        assignedToId: newTask.assigned_to_id,
        status: newTask.status,
        dueDate: newTask.due_date,
        vesselId: newTask.vessel_id,
        createdById: newTask.created_by_id
      });

      await apiRequest('/api/ism/tasks', {
        method: 'POST',
        data: {
          // Map snake_case field names to camelCase as expected by the Zod schema validation
          title: newTask.title,
          description: newTask.description,
          formTemplateVersionId: newTask.form_template_version_id,
          assignedToId: newTask.assigned_to_id,
          status: newTask.status,
          // Ensure dueDate is sent as a proper Date object, not a string
          dueDate: new Date(newTask.due_date),
          vesselId: newTask.vessel_id,
          createdById: newTask.created_by_id
        },
      });
      
      // Success handling
      queryClient.invalidateQueries({queryKey: ['/api/ism/tasks']});
      setIsAssignTaskDialogOpen(false);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        form_template_version_id: 1,
        assigned_to_id: 1,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
        vessel_id: 1,
        created_by_id: 1
      });
      
      toast({
        title: "Success",
        description: "Task assigned successfully",
      });
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: `Failed to assign task: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // This function has been replaced by the handleCompleteTask function above

  const renderTasksList = () => {
    if (tasksQuery.isLoading) return <div className="p-8 text-center">Loading ISM tasks...</div>;
    if (tasksQuery.isError) return <div className="p-8 text-center text-red-500">Error loading ISM tasks</div>;
    
    const tasks = tasksQuery.data as ISMTask[] || [];
    
    if (tasks.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <Clipboard className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No ISM tasks found</p>
        </div>
      );
    }
    
    // For the demo, we'll create a simple lookup by ID
    const userMap = new Map();
    if (usersQuery.data) {
      (usersQuery.data as any[]).forEach(user => {
        userMap.set(user.id, user.fullName);
      });
    }
    
    // Get templates for displaying template names
    const templateVersionMap = new Map();
    const templatesData = formTemplatesQuery.data as FormTemplate[] || [];
    templatesData.forEach(template => {
      templateVersionMap.set(template.id, template.title);
    });
    
    const getPriorityBadge = (priority: string | undefined) => {
      if (!priority) {
        return <Badge className="bg-gray-500 text-white">Normal</Badge>;
      }
      
      let colorClass = '';
      switch (priority.toLowerCase()) {
        case 'high':
          colorClass = 'bg-red-500 text-white';
          break;
        case 'medium':
          colorClass = 'bg-orange-500 text-white';
          break;
        case 'low':
          colorClass = 'bg-blue-500 text-white';
          break;
        default:
          colorClass = 'bg-gray-500 text-white';
      }
      return <Badge className={colorClass}>{priority}</Badge>;
    };
    
    const formattedDueDate = (dateString: string | null) => {
      if (!dateString) return 'No due date';
      
      const dueDate = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Check if the date is today or tomorrow for special formatting
      if (dueDate.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return dueDate.toLocaleDateString();
      }
    };
    
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => setIsFormAdminDialogOpen(true)}
            >
              <Settings className="w-4 h-4" /> Manage Forms
            </Button>
            <Button className="flex items-center gap-1" onClick={() => setIsAssignTaskDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Assign Task
            </Button>
          </div>
        </div>
        
        <Table>
          <TableCaption>List of ISM Tasks</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                <TableCell>{renderStatus(task.status)}</TableCell>
                <TableCell>{task.assignedTo ? (userMap.get(task.assignedTo) || `User #${task.assignedTo}`) : 'Unassigned'}</TableCell>
                <TableCell>{task.dueDate ? formattedDueDate(task.dueDate) : 'No due date'}</TableCell>
                <TableCell>{new Date(task.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {task.status !== 'completed' ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCompleteTask(task.id)}
                      className="flex items-center gap-1"
                    >
                      <ListChecks className="w-4 h-4" /> Complete Form
                    </Button>
                  ) : (
                    <Badge className="bg-green-500 text-white">Completed</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // State for form admin features
  const [selectedFormCategory, setSelectedFormCategory] = useState<FormCategory | null>(null);
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<FormTemplate | null>(null);
  const [selectedFormTemplateVersion, setSelectedFormTemplateVersion] = useState<FormTemplateVersion | null>(null);
  const [newFormStructure, setNewFormStructure] = useState<string>('');
  const [formStructureValid, setFormStructureValid] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Form template file upload handling
  const handleFormFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // If it's a JSON file, we can try to parse it
      if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonText = event.target?.result as string;
            // Validate the JSON structure
            const parsed = JSON.parse(jsonText);
            
            // Check if it contains the required fields array
            if (parsed.fields && Array.isArray(parsed.fields)) {
              setNewFormStructure(jsonText);
              setFormStructureValid(true);
            } else {
              setFormStructureValid(false);
              toast({
                title: "Invalid Form Structure",
                description: "The JSON file does not contain the required 'fields' array",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            setFormStructureValid(false);
            toast({
              title: "Invalid JSON",
              description: "The file does not contain valid JSON",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For PDF or Word files, we'd need server-side parsing
        toast({
          title: "File Upload",
          description: "PDF and Word parsing will be implemented soon. Please use JSON format for now.",
          variant: "default",
        });
      }
    }
  };
  
  // Create a form template version from the structure
  const handleCreateFormTemplateVersion = async () => {
    if (!selectedFormTemplate) {
      toast({
        title: "Error",
        description: "Please select a form template first",
        variant: "destructive",
      });
      return;
    }
    
    if (!formStructureValid) {
      toast({
        title: "Error",
        description: "The form structure is not valid",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a new version of the form template
      await apiRequest('/api/ism/form-template-versions', {
        method: 'POST',
        data: {
          templateId: selectedFormTemplate.id,
          versionNumber: "1.0", // This would be incremented in a real scenario
          structureDefinition: newFormStructure || JSON.stringify({
            fields: [
              {
                id: "default_field",
                type: "text",
                label: "Default Field",
                required: true
              }
            ]
          }),
          isActive: true,
          createdById: 1 // Assuming user ID 1 (Captain)
        },
      });
      
      toast({
        title: "Success",
        description: "Form template version created successfully",
      });
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-template-versions']});
      
      // Close the dialog and reset state
      setSelectedFormTemplate(null);
      setNewFormStructure('');
      setUploadedFile(null);
      setIsFormAdminDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating form template version:', error);
      toast({
        title: "Error",
        description: `Failed to create form template version: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout title="ISM Management">
      {/* Form Submission Dialog */}
      {selectedTask && (
        <FormSubmission
          taskId={selectedTask.id}
          formTemplateVersionId={selectedTask.templateVersionId}
          isOpen={isFormSubmissionOpen}
          onClose={() => {
            setIsFormSubmissionOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
      
      {/* Form Administration Dialog */}
      <Dialog open={isFormAdminDialogOpen} onOpenChange={setIsFormAdminDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Template Administration</DialogTitle>
            <DialogDescription>
              Create, edit, and manage form templates and their structures.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="templates">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="builder">Form Builder</TabsTrigger>
            </TabsList>
            
            <TabsContent value="categories" className="py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Form Categories</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Category
                </Button>
              </div>
              
              {formCategoriesQuery.isLoading ? (
                <div className="text-center py-4">Loading categories...</div>
              ) : formCategoriesQuery.isError ? (
                <div className="text-center py-4 text-red-500">Error loading categories</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {(formCategoriesQuery.data as FormCategory[] || []).map(category => (
                    <Card key={category.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-500">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="templates" className="py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Form Templates</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Template
                </Button>
              </div>
              
              {formTemplatesQuery.isLoading ? (
                <div className="text-center py-4">Loading templates...</div>
              ) : formTemplatesQuery.isError ? (
                <div className="text-center py-4 text-red-500">Error loading templates</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {(formTemplatesQuery.data as FormTemplate[] || []).map(template => (
                    <Card key={template.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{template.title}</h4>
                          {template.description && (
                            <p className="text-sm text-gray-500">{template.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedFormTemplate(template)}
                          >
                            Use
                          </Button>
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="builder" className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Form Builder</h3>
                  <div>
                    <p className="text-sm text-gray-500">
                      {selectedFormTemplate ? (
                        <>Selected template: <span className="font-medium">{selectedFormTemplate.title}</span></>
                      ) : (
                        'No template selected'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>Upload Form Structure</Label>
                    <Input
                      type="file"
                      accept=".json,.pdf,.docx"
                      onChange={handleFormFileChange}
                    />
                    <p className="text-xs text-gray-500">
                      Upload a JSON file with the form structure, or a PDF/Word document to extract a form structure.
                    </p>
                    
                    {uploadedFile && (
                      <div className="p-2 border rounded flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{uploadedFile.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Form Structure (JSON)</Label>
                    <Textarea
                      className="min-h-[200px] font-mono text-sm"
                      value={newFormStructure}
                      onChange={(e) => {
                        setNewFormStructure(e.target.value);
                        try {
                          JSON.parse(e.target.value);
                          setFormStructureValid(true);
                        } catch (error) {
                          setFormStructureValid(false);
                        }
                      }}
                      placeholder={`{
  "fields": [
    {
      "id": "field1",
      "type": "text",
      "label": "Field Label",
      "required": true
    }
  ]
}`}
                    />
                    {!formStructureValid && (
                      <p className="text-xs text-red-500">
                        Invalid JSON structure. Please check the format.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFormTemplate(null);
                      setNewFormStructure('');
                      setUploadedFile(null);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleCreateFormTemplateVersion}
                    disabled={!selectedFormTemplate || !formStructureValid}
                  >
                    Create Form Version
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Assign Task Dialog */}
      <Dialog open={isAssignTaskDialogOpen} onOpenChange={setIsAssignTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign New ISM Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to a crew member. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Enter task title"
              />
            </div>
            
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTask.description || ''}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Describe the task requirements and objectives"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="task-template">Form Template *</Label>
              <Select 
                value={newTask.form_template_version_id.toString()}
                onValueChange={(value) => setNewTask({...newTask, form_template_version_id: parseInt(value)})}
              >
                <SelectTrigger id="task-template">
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  {(formTemplatesQuery.data as FormTemplate[] || []).map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="task-assigned">Assign To *</Label>
              <Select 
                value={newTask.assigned_to_id.toString()}
                onValueChange={(value) => setNewTask({...newTask, assigned_to_id: parseInt(value)})}
              >
                <SelectTrigger id="task-assigned">
                  <SelectValue placeholder="Select Crew Member" />
                </SelectTrigger>
                <SelectContent>
                  {(usersQuery.data as any[] || []).map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="task-status">Status</Label>
              <Select 
                value={newTask.status}
                onValueChange={(value) => setNewTask({...newTask, status: value})}
              >
                <SelectTrigger id="task-status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="task-due-date"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newTask.due_date ? newTask.due_date.toLocaleDateString() : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={newTask.due_date}
                    onSelect={(date) => setNewTask({...newTask, due_date: date || new Date()})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTaskSubmit}>Assign Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Document Dialog */}
      <Dialog open={isNewDocumentDialogOpen} onOpenChange={setIsNewDocumentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New ISM Document</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new ISM document. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                placeholder="Document Title"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="documentType">Document Type</Label>
              <Select 
                value={newDocument.documentType}
                onValueChange={(value) => setNewDocument({...newDocument, documentType: value})}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="documentNumber">Document Number *</Label>
              <Input
                id="documentNumber"
                value={newDocument.documentNumber}
                onChange={(e) => setNewDocument({...newDocument, documentNumber: e.target.value})}
                placeholder="ISM-XXX-000"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={newDocument.version}
                onChange={(e) => setNewDocument({...newDocument, version: e.target.value})}
                placeholder="1.0"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={newDocument.status}
                onValueChange={(value) => setNewDocument({...newDocument, status: value})}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="outdated">Outdated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newDocument.content}
                onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                placeholder="Document content or description"
                className="min-h-[120px]"
              />
            </div>
            
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="documentFile">Attach Document</Label>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => document.getElementById('documentFile')?.click()}>
                  <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload a document, or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, XLSX, or other document formats
                  </p>
                  <input 
                    type="file" 
                    id="documentFile" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-2">
                    <File className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeSelectedFile}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDocumentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDocumentSubmit}>Create Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
          <TabsList className="grid grid-cols-5 w-full">
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
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Clipboard className="w-4 h-4" />
              Tasks
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

              <TabsContent value="tasks" className="m-0">
                {renderTasksList()}
              </TabsContent>
            </ScrollArea>
          </Card>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ISMManagement;