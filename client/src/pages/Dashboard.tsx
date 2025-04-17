import { useQueryClient } from "@tanstack/react-query";
import { Clock, Package, CheckCircle, AlertTriangle, ArrowUp, ArrowDown, ChevronDown, CircleEllipsis, TrendingUp, Users, Settings2, LineChart } from "lucide-react";
import { useVesselQuery } from "@/hooks/useVesselQuery";

// Define the dashboard data interface to match the server response
interface DashboardData {
  stats: {
    dueTasks: number;
    upcomingTasks: number;
    completedTasks: number;
    lowStockItems: number;
    predictiveAlerts: number;
    revenue: number;
    completionRate: number;
    totalInventory: number;
  };
  dueTasks: any[];
  upcomingTasks: any[];
  recentActivity: any[];
  equipmentOverview: any[];
  inventoryStatus: any[];
  predictiveAlerts: any[];
}
import MainLayout from "@/components/layout/MainLayout";
import TasksTable from "@/components/dashboard/TasksTable";
import EquipmentOverview from "@/components/dashboard/EquipmentCard";
import InventoryStatus from "@/components/dashboard/InventoryStatus";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import UpcomingMaintenance from "@/components/dashboard/UpcomingMaintenance";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useVessel } from "@/contexts/VesselContext";
import { useEffect } from "react";

/**
 * New statistics card component with modern design
 */
const StatCard = ({ 
  title, 
  value, 
  description, 
  trend, 
  trendValue,
  isPositive = true,
  isLoading = false
}: { 
  title: string, 
  value: string,
  description: string,
  trend?: string,
  trendValue?: string,
  isPositive?: boolean,
  isLoading?: boolean
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-28 mb-2" />
          <Skeleton className="h-4 w-36" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <span className={cn(
              "text-xs font-medium",
              isPositive ? "text-emerald-500" : "text-rose-500"
            )}>
              {isPositive ? <ArrowUp className="inline h-3 w-3 mr-1" /> : <ArrowDown className="inline h-3 w-3 mr-1" />}
              {trendValue}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { currentVessel, vesselChanged, resetVesselChanged } = useVessel();
  
  // Use our custom vessel-specific query hook
  const { data: dashboardData, isLoading } = useVesselQuery<DashboardData>("/api/dashboard");
  
  // When vessel changes, invalidate all queries to reload data for the new vessel
  useEffect(() => {
    if (vesselChanged) {
      console.log(`Vessel changed to ${currentVessel.name} (ID: ${currentVessel.id}). Reloading data...`);
      
      // Invalidate all queries to force refetching with new vessel context
      queryClient.invalidateQueries();
      
      // Reset the vessel changed flag
      resetVesselChanged();
    }
  }, [vesselChanged, currentVessel, queryClient, resetVesselChanged]);

  return (
    <MainLayout title="Dashboard">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={`$${dashboardData?.stats.revenue || "180,250"}`}
          description="Trending up this month"
          trend="from last month"
          trendValue="+12.5%"
          isPositive={true}
          isLoading={isLoading}
        />
        <StatCard
          title="Active Accounts"
          value={dashboardData?.stats.upcomingTasks.toString() || "1,234"}
          description="Strong user retention"
          trend="engagement rate"
          trendValue="+20%"
          isPositive={true}
          isLoading={isLoading}
        />
        <StatCard
          title="Inventory Items"
          value={dashboardData?.stats.totalInventory?.toString() || "45,678"}
          description="Acquisition needs attention"
          trend="conversion rate"
          trendValue="-2.5%"
          isPositive={false}
          isLoading={isLoading}
        />
        <StatCard
          title="Maintenance Performance"
          value={`${dashboardData?.stats.completionRate || "94.5"}%`}
          description="Meets growth projections"
          trend="yearly target"
          trendValue="+4.3%"
          isPositive={true}
          isLoading={isLoading}
        />
      </div>

      {/* Analytics Overview Card */}
      <div className="mb-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Maintenance Analytics</CardTitle>
                <CardDescription>Total for the last 3 months</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Tabs defaultValue="3m">
                  <TabsList className="grid w-fit grid-cols-3">
                    <TabsTrigger value="3m">Last 3 months</TabsTrigger>
                    <TabsTrigger value="30d">Last 30 days</TabsTrigger>
                    <TabsTrigger value="7d">Last 7 days</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Chart content would go here */}
            <div className="relative h-[250px] w-full bg-gradient-to-t from-background to-background/5 rounded-lg overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-[200px]">
                {/* This is a placeholder for a chart - in production, you would use a real chart library */}
                <div className="w-full h-full flex items-end">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const height = 30 + Math.random() * 140;
                    return (
                      <div 
                        key={i} 
                        className="flex-1 mx-px transition-all duration-500"
                        style={{ height: `${height}px` }}
                      >
                        <div 
                          className={cn(
                            "w-full h-full rounded-t",
                            i % 2 === 0 ? "bg-primary/60" : "bg-blue-500/20"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tasks and Equipment Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Tasks</CardTitle>
                  <CardDescription>Maintenance due in the next 30 days</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <CircleEllipsis className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View all</DropdownMenuItem>
                    <DropdownMenuItem>Filter tasks</DropdownMenuItem>
                    <DropdownMenuItem>Export data</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <Tabs defaultValue="all" className="px-5">
                <TabsList className="w-full justify-start mb-4">
                  <TabsTrigger value="all" className="flex-1">All Tasks</TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
                  <TabsTrigger value="due" className="flex-1">Due Today</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="px-0 m-0">
                  <TasksTable />
                </TabsContent>
                <TabsContent value="upcoming" className="px-0 m-0">
                  <UpcomingMaintenance />
                </TabsContent>
                <TabsContent value="due" className="px-0 m-0">
                  <TasksTable filter="due" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Equipment Status</CardTitle>
                  <CardDescription>Overview of all yacht equipment</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EquipmentOverview />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity Feed</CardTitle>
                  <CardDescription>Recent activities</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>Items requiring attention</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <InventoryStatus />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
