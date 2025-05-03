import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CashFlowWidgetProps {
  vesselId: number;
}

const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({ vesselId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/transactions/vessel', vesselId, 'cash-flow'],
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
        <AlertDescription>Failed to load cash flow data</AlertDescription>
      </Alert>
    );
  }

  // Process cash flow data
  const cashFlow = data || [];

  if (cashFlow.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[180px] text-center text-muted-foreground">
        <p>No cash flow data available</p>
        <p className="text-sm">Add transactions to generate cash flow analysis</p>
      </div>
    );
  }

  // Format for the tooltip
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={cashFlow}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            name="Income"
          />
          <Line type="monotone" dataKey="expenses" stroke="#ff7300" name="Expenses" />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#82ca9d"
            strokeWidth={2}
            name="Net Balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashFlowWidget;