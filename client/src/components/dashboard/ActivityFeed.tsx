import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Plus, AlertTriangle, Settings } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: number;
  activityType: string;
  description: string;
  timestamp: string;
  userId: number | null;
  relatedEntityType: string;
  relatedEntityId: number;
}

const activityIcons = {
  task_completed: {
    icon: <Check className="h-5 w-5 text-green-600" />,
    bgColor: "bg-green-100"
  },
  task_created: {
    icon: <Plus className="h-5 w-5 text-blue-600" />,
    bgColor: "bg-blue-100"
  },
  inventory_alert: {
    icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    bgColor: "bg-yellow-100"
  },
  maintenance_updated: {
    icon: <Settings className="h-5 w-5 text-gray-600" />,
    bgColor: "bg-gray-100"
  }
};

const ActivityFeed: React.FC = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activity"],
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    
    // If it's today, return the time
    if (date.toDateString() === new Date().toDateString()) {
      return `Today at ${format(date, "h:mm a")}`;
    }
    
    // If it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    }
    
    // Otherwise return the date
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-lg">Recent Activity</h2>
      </div>

      <div className="p-4">
        <div className="flow-root">
          <ul className="-mb-8">
            {isLoading ? (
              // Loading skeletons
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <li key={i}>
                    <div className="relative pb-8">
                      {i < 3 && (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        ></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <div className="mt-2">
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
            ) : activities && activities.length > 0 ? (
              activities.slice(0, 4).map((activity: ActivityLog, index: number) => {
                const isLast = index === activities.slice(0, 4).length - 1;
                const activityType = activity.activityType as keyof typeof activityIcons;
                const iconConfig = activityIcons[activityType] || {
                  icon: <Settings className="h-5 w-5 text-gray-600" />,
                  bgColor: "bg-gray-100"
                };

                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        ></span>
                      )}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className={`h-10 w-10 rounded-full ${iconConfig.bgColor} flex items-center justify-center ring-8 ring-white`}>
                            {iconConfig.icon}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {activity.description}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>
                          {activity.relatedEntityType && (
                            <div className="mt-2 text-sm text-gray-700">
                              <p>
                                {activity.activityType === "task_completed" && "All requirements complete and documented."}
                                {activity.activityType === "task_created" && "New maintenance task added to the schedule."}
                                {activity.activityType === "inventory_alert" && "Stock level below reorder point. Action required."}
                                {activity.activityType === "maintenance_updated" && "Maintenance schedule updated with new information."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="py-6 text-center text-gray-500">
                No recent activity
              </li>
            )}
          </ul>
        </div>
        <div className="mt-4 text-center">
          <button className="text-sm text-navy-dark hover:underline">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
