import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileSpreadsheet, 
  FileBarChart, 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Wrench, 
  Package 
} from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "maintenance" | "equipment" | "inventory";
}

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const { toast } = useToast();
  
  // Fetch all maintenance tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch all equipment
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ["/api/equipment"],
  });
  
  // Fetch all inventory items
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
  });
  
  const isLoading = tasksLoading || equipmentLoading || inventoryLoading;

  const reportOptions: ReportOption[] = [
    {
      id: "maintenance-summary",
      title: "Maintenance Summary",
      description: "Overview of all maintenance tasks and their status",
      icon: <FileText className="h-8 w-8 text-navy" />,
      type: "maintenance"
    },
    {
      id: "task-completion",
      title: "Task Completion Analysis",
      description: "Analysis of task completion rates and timelines",
      icon: <FileBarChart className="h-8 w-8 text-navy" />,
      type: "maintenance"
    },
    {
      id: "equipment-status",
      title: "Equipment Status Report",
      description: "Current status and condition of all yacht equipment",
      icon: <Wrench className="h-8 w-8 text-navy" />,
      type: "equipment"
    },
    {
      id: "equipment-maintenance",
      title: "Equipment Maintenance History",
      description: "Historical maintenance records per equipment",
      icon: <Calendar className="h-8 w-8 text-navy" />,
      type: "equipment"
    },
    {
      id: "inventory-levels",
      title: "Inventory Levels",
      description: "Current inventory levels and restock recommendations",
      icon: <Package className="h-8 w-8 text-navy" />,
      type: "inventory"
    },
    {
      id: "inventory-usage",
      title: "Inventory Usage Trends",
      description: "Trend analysis of inventory consumption over time",
      icon: <Clock className="h-8 w-8 text-navy" />,
      type: "inventory"
    }
  ];

  // Generate a maintenance summary data for the chart
  const generateTaskStatusData = () => {
    if (!tasks) return [];
    
    const statusCount = {
      due: 0,
      upcoming: 0,
      in_progress: 0,
      completed: 0
    };
    
    tasks.forEach((task: any) => {
      if (statusCount.hasOwnProperty(task.status)) {
        statusCount[task.status as keyof typeof statusCount]++;
      }
    });
    
    return [
      { name: "Due", value: statusCount.due, fill: "#E74C3C" },
      { name: "Upcoming", value: statusCount.upcoming, fill: "#F39C12" },
      { name: "In Progress", value: statusCount.in_progress, fill: "#3282B8" },
      { name: "Completed", value: statusCount.completed, fill: "#2ECC71" }
    ];
  };

  // Generate task completion data for the period
  const generateTaskCompletionData = () => {
    if (!tasks) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (selectedPeriod) {
      case "7days":
        startDate = subDays(now, 7);
        break;
      case "90days":
        startDate = subDays(now, 90);
        break;
      case "6months":
        startDate = subMonths(now, 6);
        break;
      case "1year":
        startDate = subMonths(now, 12);
        break;
      case "30days":
      default:
        startDate = subDays(now, 30);
        break;
    }
    
    // Group by completion date
    const completionByDate: Record<string, { date: string, count: number }> = {};
    
    tasks.forEach((task: any) => {
      if (task.status === 'completed' && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        if (completedDate >= startDate) {
          const dateStr = format(completedDate, 'yyyy-MM-dd');
          
          if (!completionByDate[dateStr]) {
            completionByDate[dateStr] = {
              date: format(completedDate, 'MMM d'),
              count: 0
            };
          }
          
          completionByDate[dateStr].count++;
        }
      }
    });
    
    // Convert to array and sort by date
    return Object.values(completionByDate).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  };

  // Generate equipment status data
  const generateEquipmentStatusData = () => {
    if (!equipment) return [];
    
    const statusCount = {
      operational: 0,
      maintenance_required: 0,
      non_operational: 0
    };
    
    equipment.forEach((item: any) => {
      if (statusCount.hasOwnProperty(item.status)) {
        statusCount[item.status as keyof typeof statusCount]++;
      }
    });
    
    return [
      { name: "Operational", value: statusCount.operational, fill: "#2ECC71" },
      { name: "Maintenance Required", value: statusCount.maintenance_required, fill: "#F39C12" },
      { name: "Non-Operational", value: statusCount.non_operational, fill: "#E74C3C" }
    ];
  };

  // Generate inventory status data
  const generateInventoryStatusData = () => {
    if (!inventory) return [];
    
    const stockLevels = {
      low: 0,
      medium: 0,
      good: 0
    };
    
    inventory.forEach((item: any) => {
      const stockPercentage = (item.quantity / item.minQuantity) * 100;
      
      if (stockPercentage <= 30) {
        stockLevels.low++;
      } else if (stockPercentage <= 80) {
        stockLevels.medium++;
      } else {
        stockLevels.good++;
      }
    });
    
    return [
      { name: "Low Stock", value: stockLevels.low, fill: "#E74C3C" },
      { name: "Medium Stock", value: stockLevels.medium, fill: "#F39C12" },
      { name: "Good Stock", value: stockLevels.good, fill: "#2ECC71" }
    ];
  };

  const handleGenerateReport = (reportId: string) => {
    toast({
      title: "Report Generation Started",
      description: "Your report is being generated and will download shortly.",
    });
    
    // Simulate download delay
    setTimeout(() => {
      toast({
        title: "Report Generated",
        description: "Your report has been downloaded successfully.",
      });
    }, 1500);
  };

  const taskStatusData = generateTaskStatusData();
  const taskCompletionData = generateTaskCompletionData();
  const equipmentStatusData = generateEquipmentStatusData();
  const inventoryStatusData = generateInventoryStatusData();

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <MainLayout title="Reports">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Task Status</CardTitle>
                <CardDescription>Distribution of tasks by current status</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Task Completion Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trend</CardTitle>
                <CardDescription>Number of tasks completed over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={taskCompletionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Tasks Completed" fill="#3282B8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Equipment Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Status</CardTitle>
                <CardDescription>Current status of all equipment</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={equipmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {equipmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Inventory Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Stock levels across inventory items</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {inventoryStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportOptions
              .filter(option => option.type === 'maintenance')
              .map(report => (
                <Card key={report.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      {report.icon}
                      <FileSpreadsheet className="h-5 w-5 text-gray-400" />
                    </div>
                    <CardTitle className="mt-4">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-sm text-gray-500">
                      <p className="mb-1">Report outputs:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>PDF Document</li>
                        <li>Excel Spreadsheet</li>
                        <li>CSV Data File</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleGenerateReport(report.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportOptions
              .filter(option => option.type === 'equipment')
              .map(report => (
                <Card key={report.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      {report.icon}
                      <FileSpreadsheet className="h-5 w-5 text-gray-400" />
                    </div>
                    <CardTitle className="mt-4">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-sm text-gray-500">
                      <p className="mb-1">Report outputs:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>PDF Document</li>
                        <li>Excel Spreadsheet</li>
                        <li>CSV Data File</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleGenerateReport(report.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportOptions
              .filter(option => option.type === 'inventory')
              .map(report => (
                <Card key={report.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      {report.icon}
                      <FileSpreadsheet className="h-5 w-5 text-gray-400" />
                    </div>
                    <CardTitle className="mt-4">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-sm text-gray-500">
                      <p className="mb-1">Report outputs:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>PDF Document</li>
                        <li>Excel Spreadsheet</li>
                        <li>CSV Data File</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleGenerateReport(report.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Reports;
