import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Eye, 
  Edit, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Task {
  id: number;
  title: string;
  priority: string;
  equipmentId: number | null;
  dueDate: string;
  status: string;
  assignedToId: number | null;
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

const priorityBadgeClasses = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const statusBadgeClasses = {
  due: "bg-red-100 text-red-800",
  upcoming: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
};

const TasksTable: React.FC = () => {
  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 4;

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ["/api/equipment"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const isLoading = tasksLoading || equipmentLoading || usersLoading;

  // Filter tasks based on the current filter
  const filteredTasks = !tasks
    ? []
    : currentFilter === "all"
    ? tasks
    : tasks.filter((task: Task) => task.status === currentFilter);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + tasksPerPage);

  const getEquipmentInfo = (equipmentId: number | null) => {
    if (!equipmentId || !equipment) return "N/A";
    const equipmentItem = equipment.find((e: Equipment) => e.id === equipmentId);
    return equipmentItem ? `${equipmentItem.model}` : "N/A";
  };

  const getAssigneeInfo = (assignedToId: number | null) => {
    if (!assignedToId || !users) return { name: "Unassigned", avatar: null };
    const user = users.find((u: User) => u.id === assignedToId);
    return user
      ? { name: user.fullName, avatar: user.avatarUrl }
      : { name: "Unknown", avatar: null };
  };

  const formatDueDate = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDay = dueDate.setHours(0, 0, 0, 0);
    
    if (dueDay === today.getTime()) {
      return "Today";
    }
    
    return format(dueDate, "MMM d, yyyy");
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Maintenance Tasks</h2>
        <div className="flex items-center space-x-2">
          <Button size="sm" className="bg-navy text-white hover:bg-navy-dark">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Task
          </Button>
          <Button size="sm" variant="ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </Button>
        </div>
      </div>

      <div className="px-4 pt-2 flex items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentFilter("all")}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded hover:bg-gray-100",
              currentFilter === "all" && "border-b-2 border-navy-dark"
            )}
          >
            All
          </button>
          <button
            onClick={() => setCurrentFilter("due")}
            className={cn(
              "px-3 py-1 text-xs font-medium text-gray-600 rounded hover:bg-gray-100",
              currentFilter === "due" && "border-b-2 border-navy-dark"
            )}
          >
            Due Today
          </button>
          <button
            onClick={() => setCurrentFilter("upcoming")}
            className={cn(
              "px-3 py-1 text-xs font-medium text-gray-600 rounded hover:bg-gray-100",
              currentFilter === "upcoming" && "border-b-2 border-navy-dark"
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setCurrentFilter("completed")}
            className={cn(
              "px-3 py-1 text-xs font-medium text-gray-600 rounded hover:bg-gray-100",
              currentFilter === "completed" && "border-b-2 border-navy-dark"
            )}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs border-b border-gray-200">
                <th className="py-3 px-2 font-semibold text-gray-500">Priority</th>
                <th className="py-3 px-2 font-semibold text-gray-500">Task</th>
                <th className="py-3 px-2 font-semibold text-gray-500">Equipment</th>
                <th className="py-3 px-2 font-semibold text-gray-500">Due Date</th>
                <th className="py-3 px-2 font-semibold text-gray-500">Status</th>
                <th className="py-3 px-2 font-semibold text-gray-500">Assigned To</th>
                <th className="py-3 px-2 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <Skeleton className="h-6 w-14" />
                      </td>
                      <td className="py-3 px-2">
                        <Skeleton className="h-5 w-40" />
                      </td>
                      <td className="py-3 px-2">
                        <Skeleton className="h-5 w-32" />
                      </td>
                      <td className="py-3 px-2">
                        <Skeleton className="h-5 w-20" />
                      </td>
                      <td className="py-3 px-2">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="py-3 px-2">
                        <Skeleton className="h-5 w-36" />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          <Skeleton className="h-5 w-5" />
                          <Skeleton className="h-5 w-5" />
                        </div>
                      </td>
                    </tr>
                  ))
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No tasks found
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task: Task) => {
                  const assignee = getAssigneeInfo(task.assignedToId);
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            priorityBadgeClasses[task.priority as keyof typeof priorityBadgeClasses]
                          )}
                        >
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium">{task.title}</td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {getEquipmentInfo(task.equipmentId)}
                      </td>
                      <td className={cn(
                        "py-3 px-2 text-sm font-medium",
                        task.status === 'due' ? "text-red-600" : 
                        task.status === 'upcoming' ? "text-yellow-600" : 
                        "text-gray-600"
                      )}>
                        {formatDueDate(task.dueDate)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            statusBadgeClasses[task.status as keyof typeof statusBadgeClasses]
                          )}
                        >
                          {task.status.charAt(0).toUpperCase() + 
                           task.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div className="flex items-center">
                          {assignee.avatar ? (
                            <img
                              src={assignee.avatar}
                              alt="User Avatar"
                              className="h-5 w-5 rounded-full mr-1"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300 mr-1" />
                          )}
                          {assignee.name}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex space-x-2">
                          <button className="text-navy-dark hover:text-navy">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-navy-dark hover:text-navy">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {isLoading
              ? "Loading tasks..."
              : `Showing ${paginatedTasks.length} of ${filteredTasks.length} tasks`}
          </p>
          {totalPages > 1 && (
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Previous</span>
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-navy-dark text-white" : ""}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksTable;
