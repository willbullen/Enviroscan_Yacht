import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useVesselQuery } from "@/hooks/useVesselQuery";
import { useVessel } from "@/contexts/VesselContext";
import { 
  PlusCircle, 
  FilterX, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MoreHorizontal
} from "lucide-react";
import { format, isToday, isPast, isFuture, addMonths } from "date-fns";
import MainLayout from "@/components/layout/MainLayout";
import TaskForm from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import ViewToggle, { ViewMode } from "@/components/ui/view-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Task {
  id: number;
  title: string;
  description: string;
  equipmentId: number | null;
  priority: string;
  status: string;
  dueDate: string;
  assignedToId: number | null;
  completedById: number | null;
  completedAt: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  createdById: number;
}

interface Equipment {
  id: number;
  name: string;
  model: string;
}

interface User {
  id: number;
  fullName: string;
  avatarUrl: string | null;
}

const priorityClasses = {
  high: "bg-red-100 text-red-800 hover:bg-red-200",
  medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  low: "bg-green-100 text-green-800 hover:bg-green-200",
};

const statusClasses = {
  due: "bg-red-100 text-red-800 border-red-200",
  upcoming: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
};

const statusIcons = {
  due: <AlertTriangle className="h-4 w-4 mr-1" />,
  upcoming: <Clock className="h-4 w-4 mr-1" />,
  completed: <CheckCircle2 className="h-4 w-4 mr-1" />,
  in_progress: <Calendar className="h-4 w-4 mr-1" />,
};

const Tasks = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARDS);
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const { currentVessel, vesselChanged, resetVesselChanged } = useVessel();
  
  // Use vessel-specific query hooks
  const { data: tasks, isLoading: tasksLoading } = useVesselQuery<Task[]>("/api/tasks");
  
  // Fetch equipment for task form - vessel specific
  const { data: equipment } = useVesselQuery<Equipment[]>("/api/equipment");
  
  // Fetch users for task assignment
  const { data: users } = useVesselQuery<User[]>("/api/users");
  
  // When vessel changes, invalidate all queries to reload data for the new vessel
  useEffect(() => {
    if (vesselChanged) {
      console.log(`Tasks page: Vessel changed to ${currentVessel.name} (ID: ${currentVessel.id}). Reloading data...`);
      
      // Invalidate all queries to force refetching with new vessel context
      queryClient.invalidateQueries();
      
      // Reset the vessel changed flag
      resetVesselChanged();
    }
  }, [vesselChanged, currentVessel, queryClient, resetVesselChanged]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Partial<Task> & { id: number }) => {
      const { id, ...taskData } = updatedTask;
      const vesselId = currentVessel.id;
      // Use proper apiRequest with correct parameters
      await apiRequest(`/api/tasks/${id}?vesselId=${vesselId}`, { 
        method: "PATCH", 
        data: taskData 
      });
    },
    onSuccess: () => {
      // Invalidate the vessel-specific queries
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", currentVessel.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", currentVessel.id] });
      toast({
        title: "Task updated",
        description: "The task has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Filter tasks based on selectedTab and selectedPriority
  const filteredTasks = !tasks
    ? []
    : tasks.filter((task) => {
        // Filter by status
        if (selectedTab !== "all" && task.status !== selectedTab) {
          return false;
        }
        
        // Filter by priority
        if (selectedPriority && task.priority !== selectedPriority) {
          return false;
        }
        
        return true;
      });

  const handleCompleteTask = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      status: "completed",
      completedById: 1, // Assuming current user is id: 1
      completedAt: new Date().toISOString(),
    });
  };

  const handleStartTask = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      status: "in_progress",
    });
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskFormOpen(true);
  };

  const clearFilters = () => {
    setSelectedPriority(null);
  };

  const getEquipmentInfo = (equipmentId: number | null) => {
    if (!equipmentId || !equipment) return "N/A";
    const equipmentItem = equipment.find((e) => e.id === equipmentId);
    return equipmentItem ? equipmentItem.name : "N/A";
  };

  const getAssigneeInfo = (assignedToId: number | null) => {
    if (!assignedToId || !users) return { name: "Unassigned", avatar: null };
    const user = users.find((u) => u.id === assignedToId);
    return user
      ? { name: user.fullName, avatar: user.avatarUrl }
      : { name: "Unknown", avatar: null };
  };

  const formatDueDate = (dateString: string) => {
    const dueDate = new Date(dateString);
    
    if (isToday(dueDate)) {
      return "Today";
    }
    
    return format(dueDate, "MMM d, yyyy");
  };

  const getDueDateClass = (dateString: string, status: string) => {
    if (status === "completed") return "text-gray-600";
    
    const dueDate = new Date(dateString);
    if (isPast(dueDate)) return "text-red-600 font-medium";
    if (isFuture(dueDate) && dueDate < addMonths(new Date(), 1)) return "text-yellow-600 font-medium";
    return "text-gray-600";
  };

  return (
    <MainLayout title="Maintenance Tasks">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight"></h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {selectedPriority && <Badge className="ml-2">{selectedPriority}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSelectedPriority("high")}>
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPriority("medium")}>
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedPriority("low")}>
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Low Priority
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {(selectedPriority) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}

          <Dialog open={taskFormOpen} onOpenChange={setTaskFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{selectedTask ? "Edit Task" : "Create New Task"}</DialogTitle>
                <DialogDescription>
                  {selectedTask
                    ? "Update the details of this maintenance task."
                    : "Enter the details of the new maintenance task."}
                </DialogDescription>
              </DialogHeader>
              <TaskForm
                task={selectedTask as any} /* Type casting to resolve differing Task interfaces */
                onClose={() => {
                  setTaskFormOpen(false);
                  setSelectedTask(null);
                }}
                equipment={equipment || []}
                users={users || []}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="due">Due</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"} found
            </div>
            <ViewToggle 
              viewMode={viewMode} 
              onChange={setViewMode} 
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          {tasksLoading ? (
            viewMode === ViewMode.CARDS ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[260px] w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Skeleton className="h-[450px] w-full rounded-xl" />
              </div>
            )
          ) : filteredTasks.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-medium text-gray-500">No tasks found</h3>
              <p className="text-gray-400 mt-1">Try changing your filters or create a new task</p>
            </div>
          ) : viewMode === ViewMode.CARDS ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const assignee = getAssigneeInfo(task.assignedToId);
                
                return (
                  <Card key={task.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge className={priorityClasses[task.priority as keyof typeof priorityClasses]}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </Badge>
                        <div className="flex items-center">
                          {statusIcons[task.status as keyof typeof statusIcons]}
                          <span className="text-sm">{task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}</span>
                        </div>
                      </div>
                      <CardTitle className="mt-2">{task.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {task.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Equipment:</span>
                          <span className="font-medium">{getEquipmentInfo(task.equipmentId)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Due Date:</span>
                          <span className={getDueDateClass(task.dueDate, task.status)}>
                            {formatDueDate(task.dueDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Est. Duration:</span>
                          <span>{task.estimatedDuration ? `${task.estimatedDuration} min` : "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Assigned to:</span>
                          <div className="flex items-center">
                            <Avatar className="h-5 w-5 mr-1">
                              <AvatarImage src={assignee.avatar || undefined} />
                              <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{assignee.name}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <Button variant="outline" size="sm" onClick={() => handleEditTask(task)}>
                        Edit
                      </Button>
                      {task.status === "due" || task.status === "upcoming" ? (
                        <Button size="sm" onClick={() => handleStartTask(task)}>
                          Start Task
                        </Button>
                      ) : task.status === "in_progress" ? (
                        <Button size="sm" variant="default" onClick={() => handleCompleteTask(task)}>
                          Mark Complete
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Completed
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const assignee = getAssigneeInfo(task.assignedToId);
                    
                    return (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {statusIcons[task.status as keyof typeof statusIcons]}
                            <span>{task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityClasses[task.priority as keyof typeof priorityClasses]}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getEquipmentInfo(task.equipmentId)}</TableCell>
                        <TableCell className={getDueDateClass(task.dueDate, task.status)}>
                          {formatDueDate(task.dueDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-5 w-5 mr-1">
                              <AvatarImage src={assignee.avatar || undefined} />
                              <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{assignee.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                  Edit
                                </DropdownMenuItem>
                                {task.status === "due" || task.status === "upcoming" ? (
                                  <DropdownMenuItem onClick={() => handleStartTask(task)}>
                                    Start Task
                                  </DropdownMenuItem>
                                ) : task.status === "in_progress" ? (
                                  <DropdownMenuItem onClick={() => handleCompleteTask(task)}>
                                    Mark Complete
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="due" className="mt-0">
          {/* Dynamic content based on viewMode will be filtered by the selectedTab state */}
        </TabsContent>

        <TabsContent value="in_progress" className="mt-0">
          {/* Dynamic content based on viewMode will be filtered by the selectedTab state */}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-0">
          {/* Dynamic content based on viewMode will be filtered by the selectedTab state */}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {/* Dynamic content based on viewMode will be filtered by the selectedTab state */}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Tasks;
