import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ExpenseByCategoryWidgetProps {
  vesselId: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EFF', '#FF6B6B', '#4CAF50', '#9C27B0'];

const ExpenseByCategoryWidget: React.FC<ExpenseByCategoryWidgetProps> = ({ vesselId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/expenses/vessel', vesselId, 'stats'],
    queryFn: () => {
      if (!vesselId) return Promise.resolve({});
      return fetch(`/api/expenses/vessel/${vesselId}/stats`)
        .then(res => res.json())
        .catch(err => {
          console.error("Error fetching expense stats:", err);
          return {};
        });
    },
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
        <AlertDescription>Failed to load expense categories data</AlertDescription>
      </Alert>
    );
  }

  // Process the data for the pie chart
  const expenses = data?.expenses || [];
  const processedData = Object.entries(
    expenses.reduce((acc: Record<string, number>, expense: any) => {
      const category = expense.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + parseFloat(expense.total || '0');
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // If no data is available
  if (processedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] text-center text-muted-foreground">
        <p>No expense data available</p>
        <p className="text-sm">Add expenses to see category breakdown</p>
      </div>
    );
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseByCategoryWidget;