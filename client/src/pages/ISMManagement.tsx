import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
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
  Book,
  Upload,
  File,
  X
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

interface ISMTask {
  id: number;
  title: string;
  category: string;
  taskType: string;
  status: string;
  version: string;
  documentNumber: string;
  createdAt: string;
  updatedAt: string;
  estimatedDuration: number | null;
}

interface ISMTaskSubmission {
  id: number;
  taskId: number;
  status: string;
  submittedBy: number;
  submissionDate: string;
  responses: any; // Form responses
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewComments: string | null;
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
  const [isNewDocumentDialogOpen, setIsNewDocumentDialogOpen] = useState(false);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isViewTaskDialogOpen, setIsViewTaskDialogOpen] = useState(false);
  const [isCompleteTaskDialogOpen, setIsCompleteTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskSubmission, setTaskSubmission] = useState({
    taskId: 0,
    submittedBy: 1, // Default to user ID 1
    status: 'submitted',
    responses: {},
    duration: 0,
    location: '',
    comments: ''
  });
  
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
  
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'emergency',
    taskType: 'checklist',
    documentNumber: 'EM-',
    version: '1.0',
    status: 'active',
    description: '',
    instructions: '',
    items: [], // Will be populated with form items
    estimatedDuration: 30,
    createdBy: 1 // Assuming user ID 1 (Captain) is creating this
  });
  
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
  
  const taskSubmissionsQuery = useQuery({
    queryKey: ['/api/ism/task-submissions/recent'],
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
  
  const handleTaskSubmit = async () => {
    try {
      // Validate form
      if (!newTask.title || !newTask.documentNumber) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure we have at least one checklist item
      if (newTask.items.length === 0) {
        // Add a default empty item if none exist
        newTask.items = [{ type: "checkbox", label: "Complete task", required: true, value: null }];
      }
      
      // Create the task using apiRequest
      await apiRequest('/api/ism/tasks', {
        method: 'POST',
        data: newTask,
      });
      
      // Success handling
      queryClient.invalidateQueries({queryKey: ['/api/ism/tasks']});
      setIsNewTaskDialogOpen(false);
      
      // Reset form
      setNewTask({
        title: '',
        category: 'emergency',
        taskType: 'checklist',
        documentNumber: 'EM-',
        version: '1.0',
        status: 'active',
        description: '',
        instructions: '',
        items: [],
        estimatedDuration: 30,
        createdBy: 1
      });
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  const handleTaskCompletionSubmit = async () => {
    try {
      // Check if we have a task selected
      if (!selectedTask) {
        toast({
          title: "Error",
          description: "No task selected for completion",
          variant: "destructive",
        });
        return;
      }
      
      // Validate required fields
      const hasAllRequiredFields = selectedTask.items && selectedTask.items.every((item: any, index: number) => {
        if (!item.required) return true;
        
        const itemKey = `item-${index}`;
        const response = taskSubmission.responses[itemKey];
        
        if (item.type === 'checkbox') {
          return response === true;
        } else {
          return response && response.toString().trim() !== '';
        }
      });
      
      if (!hasAllRequiredFields) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields in the checklist",
          variant: "destructive",
        });
        return;
      }
      
      // Format submission data
      const submissionData = {
        taskId: selectedTask.id,
        submittedBy: taskSubmission.submittedBy,
        status: 'submitted',
        responses: taskSubmission.responses,
        duration: taskSubmission.duration || 0,
        location: taskSubmission.location || null,
        comments: taskSubmission.comments || null,
        submissionDate: new Date().toISOString()
      };
      
      // Submit the task completion using apiRequest
      await apiRequest('/api/ism/task-submissions', {
        method: 'POST',
        data: submissionData,
      });
      
      // Success handling
      queryClient.invalidateQueries({queryKey: ['/api/ism/task-submissions/recent']});
      setIsCompleteTaskDialogOpen(false);
      
      // Reset form
      setTaskSubmission({
        taskId: 0,
        submittedBy: 1,
        status: 'submitted',
        responses: {},
        duration: 0,
        location: '',
        comments: ''
      });
      
      toast({
        title: "Success",
        description: "Task completed and submitted successfully",
      });
    } catch (error: any) {
      console.error('Error submitting task completion:', error);
      toast({
        title: "Error",
        description: `Failed to submit task completion: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

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

  const renderTasksList = () => {
    if (tasksQuery.isLoading) return <div className="p-8 text-center">Loading tasks...</div>;
    if (tasksQuery.isError) return <div className="p-8 text-center text-red-500">Error loading tasks</div>;
    
    const tasks = tasksQuery.data as ISMTask[] || [];
    const submissions = taskSubmissionsQuery.data as ISMTaskSubmission[] || [];
    
    if (tasks.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <Clipboard className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No ISM tasks found</p>
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
          <Button className="flex items-center gap-1" onClick={() => setIsNewTaskDialogOpen(true)}>
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Task Submissions</CardTitle>
            <CardDescription>Recent submissions for ISM tasks and checklists</CardDescription>
          </CardHeader>
          <CardContent>
            {taskSubmissionsQuery.isLoading ? (
              <div className="text-center py-4">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No recent submissions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map(submission => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {tasks.find(t => t.id === submission.taskId)?.title || `Task #${submission.taskId}`}
                      </TableCell>
                      <TableCell>User #{submission.submittedBy}</TableCell>
                      <TableCell>{renderStatus(submission.status)}</TableCell>
                      <TableCell>{format(new Date(submission.submissionDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <Table>
          <TableCaption>List of ISM Tasks and Checklists</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Doc Number</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.category}</TableCell>
                <TableCell>{task.taskType}</TableCell>
                <TableCell>{task.documentNumber}</TableCell>
                <TableCell>{task.version}</TableCell>
                <TableCell>{renderStatus(task.status)}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setIsViewTaskDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setTaskSubmission({
                        ...taskSubmission,
                        taskId: task.id
                      });
                      setIsCompleteTaskDialogOpen(true);
                    }}
                  >
                    Complete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <MainLayout title="ISM Management">
      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New ISM Task/Checklist</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new ISM task or checklist. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="taskTitle">Title *</Label>
              <Input
                id="taskTitle"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Task or Checklist Title"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="taskCategory">Category</Label>
              <Select 
                value={newTask.category}
                onValueChange={(value) => setNewTask({...newTask, category: value})}
              >
                <SelectTrigger id="taskCategory">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="taskType">Task Type</Label>
              <Select 
                value={newTask.taskType}
                onValueChange={(value) => setNewTask({...newTask, taskType: value})}
              >
                <SelectTrigger id="taskType">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="taskDocNumber">Document Number *</Label>
              <Input
                id="taskDocNumber"
                value={newTask.documentNumber}
                onChange={(e) => setNewTask({...newTask, documentNumber: e.target.value})}
                placeholder="EM-001"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="taskVersion">Version</Label>
              <Input
                id="taskVersion"
                value={newTask.version}
                onChange={(e) => setNewTask({...newTask, version: e.target.value})}
                placeholder="1.0"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="taskStatus">Status</Label>
              <Select 
                value={newTask.status}
                onValueChange={(value) => setNewTask({...newTask, status: value})}
              >
                <SelectTrigger id="taskStatus">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="taskDuration">Estimated Duration (minutes)</Label>
              <Input
                id="taskDuration"
                type="number"
                value={newTask.estimatedDuration.toString()}
                onChange={(e) => setNewTask({...newTask, estimatedDuration: parseInt(e.target.value) || 0})}
                placeholder="30"
              />
            </div>
            
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="taskDescription">Description</Label>
              <Textarea
                id="taskDescription"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Task or checklist description"
                className="min-h-[80px]"
              />
            </div>
            
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="taskInstructions">Instructions</Label>
              <Textarea
                id="taskInstructions"
                value={newTask.instructions}
                onChange={(e) => setNewTask({...newTask, instructions: e.target.value})}
                placeholder="Instructions for completing this task or checklist"
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTaskSubmit}>Create Task</Button>
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
              Tasks & Checklists
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
      
      {/* View Task Dialog */}
      <Dialog open={isViewTaskDialogOpen} onOpenChange={setIsViewTaskDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedTask.title}</span>
                  <Badge className={`${statusColors[selectedTask.status as keyof typeof statusColors] || "bg-gray-500"} text-white`}>
                    {selectedTask.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="flex flex-col gap-1 mt-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Document Number:</p>
                      <p className="text-sm font-medium">{selectedTask.documentNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Version:</p>
                      <p className="text-sm font-medium">{selectedTask.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Category:</p>
                    <Badge variant="outline">{selectedTask.category}</Badge>
                    <p className="text-sm text-muted-foreground ml-4">Type:</p>
                    <Badge variant="outline">{selectedTask.taskType}</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <Separator className="my-4" />
              
              {selectedTask.description && (
                <div className="my-2">
                  <h4 className="text-sm font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>
              )}
              
              {selectedTask.instructions && (
                <div className="my-4">
                  <h4 className="text-sm font-semibold mb-1">Instructions</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.instructions}</p>
                </div>
              )}
              
              <div className="my-4">
                <h4 className="text-sm font-semibold mb-3">Checklist Items</h4>
                {selectedTask.items && selectedTask.items.length > 0 ? (
                  <div className="space-y-3 border rounded-md p-4">
                    {selectedTask.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        {item.type === 'checkbox' ? (
                          <Checkbox id={`view-item-${index}`} disabled />
                        ) : (
                          <span className="h-4 w-4 mr-2 mt-1">•</span>
                        )}
                        <Label 
                          htmlFor={`view-item-${index}`} 
                          className={`text-sm ${item.required ? 'font-medium' : ''}`}
                        >
                          {item.label}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No checklist items available</p>
                )}
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewTaskDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewTaskDialogOpen(false);
                    setTaskSubmission({
                      ...taskSubmission,
                      taskId: selectedTask.id
                    });
                    setIsCompleteTaskDialogOpen(true);
                  }}
                >
                  Complete This Task
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Complete Task Dialog */}
      <Dialog open={isCompleteTaskDialogOpen} onOpenChange={setIsCompleteTaskDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle>Complete Task: {selectedTask.title}</DialogTitle>
                <DialogDescription>
                  Fill in the checklist below to complete this task. Items marked with * are required.
                </DialogDescription>
              </DialogHeader>
              
              <Separator className="my-4" />
              
              <div className="my-4">
                <h4 className="text-sm font-semibold mb-3">Checklist Items</h4>
                {selectedTask.items && selectedTask.items.length > 0 ? (
                  <div className="space-y-4 border rounded-md p-4">
                    {selectedTask.items.map((item: any, index: number) => {
                      const itemKey = `item-${index}`;
                      if (item.type === 'checkbox') {
                        return (
                          <div key={index} className="flex items-start gap-2">
                            <Checkbox 
                              id={itemKey}
                              checked={!!taskSubmission.responses[itemKey]}
                              onCheckedChange={(checked) => {
                                setTaskSubmission({
                                  ...taskSubmission,
                                  responses: {
                                    ...taskSubmission.responses,
                                    [itemKey]: !!checked
                                  }
                                });
                              }}
                            />
                            <Label 
                              htmlFor={itemKey} 
                              className={`text-sm ${item.required ? 'font-medium' : ''}`}
                            >
                              {item.label}
                              {item.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          </div>
                        );
                      } else if (item.type === 'text' || item.type === 'number') {
                        return (
                          <div key={index} className="space-y-2">
                            <Label 
                              htmlFor={itemKey} 
                              className={`text-sm ${item.required ? 'font-medium' : ''}`}
                            >
                              {item.label}
                              {item.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <Input
                              id={itemKey}
                              type={item.type}
                              value={taskSubmission.responses[itemKey] || ''}
                              onChange={(e) => {
                                setTaskSubmission({
                                  ...taskSubmission,
                                  responses: {
                                    ...taskSubmission.responses,
                                    [itemKey]: item.type === 'number' ? 
                                      parseFloat(e.target.value) : e.target.value
                                  }
                                });
                              }}
                              placeholder={item.placeholder || ''}
                            />
                          </div>
                        );
                      } else if (item.type === 'textarea') {
                        return (
                          <div key={index} className="space-y-2">
                            <Label 
                              htmlFor={itemKey} 
                              className={`text-sm ${item.required ? 'font-medium' : ''}`}
                            >
                              {item.label}
                              {item.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <Textarea
                              id={itemKey}
                              value={taskSubmission.responses[itemKey] || ''}
                              onChange={(e) => {
                                setTaskSubmission({
                                  ...taskSubmission,
                                  responses: {
                                    ...taskSubmission.responses,
                                    [itemKey]: e.target.value
                                  }
                                });
                              }}
                              placeholder={item.placeholder || ''}
                            />
                          </div>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No checklist items available</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={taskSubmission.duration || ''}
                    onChange={(e) => setTaskSubmission({
                      ...taskSubmission, 
                      duration: parseInt(e.target.value)
                    })}
                    placeholder="How long did this task take?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm">Location</Label>
                  <Input
                    id="location"
                    value={taskSubmission.location || ''}
                    onChange={(e) => setTaskSubmission({
                      ...taskSubmission, 
                      location: e.target.value
                    })}
                    placeholder="Where was this task completed?"
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="comments" className="text-sm">Comments</Label>
                  <Textarea
                    id="comments"
                    value={taskSubmission.comments || ''}
                    onChange={(e) => setTaskSubmission({
                      ...taskSubmission, 
                      comments: e.target.value
                    })}
                    placeholder="Any comments or notes about this task completion?"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCompleteTaskDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleTaskCompletionSubmit}
                >
                  Submit Task
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ISMManagement;