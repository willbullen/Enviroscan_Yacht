import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import TaskForm from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  equipmentId: number | null;
  dueDate: string;
  priority: string;
  status: string;
}

interface Equipment {
  id: number;
  name: string;
  model: string;
}

interface User {
  id: number;
  fullName: string;
}

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [view, setView] = useState<"all" | "upcoming" | "completed">("all");

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch equipment for task form
  const { data: equipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Fetch users for task assignment
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get days in month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Get previous month
  const prevMonth = () => {
    setCurrentMonth(prevMonthDate => {
      const newDate = new Date(prevMonthDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Get next month
  const nextMonth = () => {
    setCurrentMonth(prevMonthDate => {
      const newDate = new Date(prevMonthDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Filter tasks for the selected day
  const getTasksForDay = (day: Date) => {
    if (!tasks) return [];
    
    // Filter tasks by status if view is set
    let filteredTasks = tasks;
    if (view === "upcoming") {
      filteredTasks = tasks.filter(task => ["due", "upcoming", "in_progress"].includes(task.status));
    } else if (view === "completed") {
      filteredTasks = tasks.filter(task => task.status === "completed");
    }
    
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, day);
    });
  };

  // Count tasks for each day to show indicators
  const getTaskCountForDay = (day: Date) => {
    if (!tasks) return 0;
    
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, day);
    }).length;
  };

  // Get the priority color for the task
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  // Get the status color for the task
  const getStatusColor = (status: string) => {
    switch (status) {
      case "due":
        return "bg-red-100 text-red-800";
      case "upcoming":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Reset selected date when month changes
  useEffect(() => {
    setSelectedDate(null);
  }, [currentMonth]);

  return (
    <MainLayout title="Maintenance Calendar">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Calendar</h1>
        <div className="flex gap-2">
          <Select value={view} onValueChange={(value) => setView(value as "all" | "upcoming" | "completed")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="upcoming">Upcoming Tasks</SelectItem>
              <SelectItem value="completed">Completed Tasks</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={taskFormOpen} onOpenChange={setTaskFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Enter the details of the new maintenance task.
                </DialogDescription>
              </DialogHeader>
              <TaskForm
                task={null}
                initialDate={selectedDate}
                onClose={() => setTaskFormOpen(false)}
                equipment={equipment || []}
                users={users || []}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-sm font-medium text-center py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-24 p-1 bg-gray-50" />
          ))}
          
          {daysInMonth.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const taskCount = getTaskCountForDay(day);
            
            return (
              <div 
                key={day.toString()}
                className={cn(
                  "h-24 p-1 border border-gray-200 overflow-hidden",
                  !isSameMonth(day, currentMonth) && "bg-gray-50 text-gray-400",
                  isToday(day) && "bg-blue-50",
                  isSelected && "ring-2 ring-navy"
                )}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "inline-block rounded-full w-6 h-6 text-center leading-6 text-sm",
                    isToday(day) && "bg-navy text-white"
                  )}>
                    {format(day, "d")}
                  </span>
                  {taskCount > 0 && (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] h-5"
                    >
                      {taskCount} task{taskCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-24px)]">
                  {getTasksForDay(day).slice(0, 2).map((task) => (
                    <div 
                      key={task.id}
                      className={cn(
                        "text-xs truncate px-1 py-0.5 rounded",
                        getStatusColor(task.status)
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {getTasksForDay(day).length > 2 && (
                    <div className="text-xs text-gray-500 pl-1">
                      +{getTasksForDay(day).length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {Array.from({ length: (7 - endOfMonth(currentMonth).getDay() - 1) % 7 }).map((_, index) => (
            <div key={`empty-end-${index}`} className="h-24 p-1 bg-gray-50" />
          ))}
        </div>
      </div>

      {/* Selected Day Tasks */}
      {selectedDate && (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Tasks for {format(selectedDate, "MMMM d, yyyy")}
            </h2>
            <Button 
              size="sm"
              onClick={() => {
                setTaskFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
          </div>

          <div className="divide-y">
            {getTasksForDay(selectedDate).length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                No tasks scheduled for this day
              </div>
            ) : (
              getTasksForDay(selectedDate).map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        {equipment?.find(e => e.id === task.equipmentId)?.name || "No equipment"}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Calendar;
