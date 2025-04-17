import { useVesselQuery } from "@/hooks/useVesselQuery";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isThisMonth, isAfter, addMonths } from "date-fns";

interface MaintenanceTask {
  id: number;
  title: string;
  dueDate: string;
}

const UpcomingMaintenance: React.FC = () => {
  // TEMPORARY FIX: Using alternative API endpoint until the original is fixed
  const { data: tasks, isLoading } = useVesselQuery<MaintenanceTask[]>("/api/tasks-upcoming");

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">Upcoming Maintenance</h2>
        </div>
        <div className="p-4">
          <div className="bg-gray-100 rounded-lg p-3 mb-3 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-3 mb-3 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Group tasks by month
  const tasksByMonth: Record<string, MaintenanceTask[]> = {};
  
  // Handle tasks data safely, ensuring it's an array
  const taskArray = Array.isArray(tasks) ? tasks : [];
  
  if (taskArray.length > 0) {
    taskArray.forEach((task: MaintenanceTask) => {
      const dueDate = new Date(task.dueDate);
      const monthKey = format(dueDate, "MMMM yyyy");
      
      if (!tasksByMonth[monthKey]) {
        tasksByMonth[monthKey] = [];
      }
      
      tasksByMonth[monthKey].push(task);
    });
  }

  // Order months chronologically
  const sortedMonths = Object.keys(tasksByMonth).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg">Upcoming Maintenance</h2>
      </div>

      <div className="p-4">
        {sortedMonths.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No upcoming maintenance tasks scheduled
          </div>
        ) : (
          sortedMonths.slice(0, 2).map((month, index) => {
            const tasks = tasksByMonth[month];
            const monthDate = new Date(month);
            const isCurrentMonth = isThisMonth(monthDate);
            
            return (
              <div 
                key={month} 
                className={`${isCurrentMonth ? 'bg-navy-light bg-opacity-10 border-navy-light' : 'border-gray-200'} p-3 rounded-lg border mb-3`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-medium ${isCurrentMonth ? 'text-navy-dark' : ''}`}>
                      {month}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {tasks.length} scheduled maintenance {tasks.length === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                  <span className={`${isCurrentMonth ? 'bg-white' : 'bg-gray-100'} text-xs font-medium px-2 py-1 rounded border border-gray-200`}>
                    {isCurrentMonth ? 'This Month' : 'Next Month'}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center">
                      <div className={`w-2 h-2 ${isCurrentMonth ? 'bg-yellow-500' : 'bg-gray-400'} rounded-full mr-2`}></div>
                      <span className="text-sm">
                        {format(new Date(task.dueDate), "MMM d")} - {task.title}
                      </span>
                    </div>
                  ))}
                  {tasks.length > 4 && (
                    <div className="flex items-center">
                      <div className={`w-2 h-2 ${isCurrentMonth ? 'bg-yellow-500' : 'bg-gray-400'} rounded-full mr-2`}></div>
                      <span className="text-sm text-gray-500">+{tasks.length - 4} more tasks</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <Button variant="outline" className="w-full mt-2 border-navy text-navy hover:bg-navy-light hover:bg-opacity-10">
          View Maintenance Calendar
        </Button>
      </div>
    </div>
  );
};

export default UpcomingMaintenance;
