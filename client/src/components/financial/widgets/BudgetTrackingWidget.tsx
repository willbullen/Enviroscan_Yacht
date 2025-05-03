import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BudgetTrackingWidgetProps {
  vesselId: number;
}

const BudgetTrackingWidget: React.FC<BudgetTrackingWidgetProps> = ({ vesselId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/budgets/vessel', vesselId],
    enabled: !!vesselId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load budget data</AlertDescription>
      </Alert>
    );
  }

  // Process budget data
  const budgets = data || [];

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] text-center text-muted-foreground">
        <p>No budget data available</p>
        <p className="text-sm">Create budgets to track spending against targets</p>
      </div>
    );
  }

  // Format budget data for display
  const chartData = budgets.map(budget => {
    const actual = budget.actualAmount || 0;
    const budgeted = budget.budgetedAmount || 0;
    const remaining = Math.max(0, budgeted - actual);
    const percentUsed = (actual / budgeted) * 100;
    
    return {
      name: budget.category,
      actual,
      budgeted,
      remaining,
      percentUsed: percentUsed.toFixed(0)
    };
  });

  return (
    <div className="space-y-4">
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="actual" fill="#FF8042" name="Actual Spending" />
            <Bar dataKey="budgeted" fill="#0088FE" name="Budget Target" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3 mt-4">
        {chartData.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">
                ${item.actual.toFixed(2)} of ${item.budgeted.toFixed(2)} ({item.percentUsed}%)
              </span>
            </div>
            <Progress value={parseFloat(item.percentUsed)} max={100} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetTrackingWidget;