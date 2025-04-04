import { useQuery } from "@tanstack/react-query";
import { Clock, Package, CheckCircle, AlertTriangle } from "lucide-react";
// Using the HUD MainLayout which has the theme support
// import MainLayout from "@/components/layout/MainLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import TasksTable from "@/components/dashboard/TasksTable";
import EquipmentOverview from "@/components/dashboard/EquipmentCard";
import InventoryStatus from "@/components/dashboard/InventoryStatus";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import UpcomingMaintenance from "@/components/dashboard/UpcomingMaintenance";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </>
        ) : (
          <>
            <StatsCard
              title="Tasks Due Today"
              value={dashboardData?.stats.dueTasks || 0}
              icon={<AlertTriangle className="h-6 w-6 text-red-800" />}
              trend={
                dashboardData?.stats.dueTasks > 8
                  ? { value: "↑ 8% from last week", positive: false }
                  : { value: "↓ 12% from last week", positive: true }
              }
              color="red"
            />
            <StatsCard
              title="Upcoming Tasks"
              value={dashboardData?.stats.upcomingTasks || 0}
              icon={<Clock className="h-6 w-6 text-yellow-800" />}
              info="Next 30 days"
              color="yellow"
            />
            <StatsCard
              title="Inventory Items Low"
              value={dashboardData?.stats.lowStockItems || 0}
              icon={<Package className="h-6 w-6 text-blue-800" />}
              info="Restock required"
              color="blue"
            />
            <StatsCard
              title="Completed Tasks"
              value={dashboardData?.stats.completedTasks || 0}
              icon={<CheckCircle className="h-6 w-6 text-green-800" />}
              info="Last 30 days"
              color="green"
            />
          </>
        )}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Maintenance Tasks Column */}
        <div className="lg:col-span-8">
          <TasksTable />
          <EquipmentOverview />
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-4">
          <InventoryStatus />
          <ActivityFeed />
          <UpcomingMaintenance />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
