import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, TrendingDown, Wallet, DollarSign } from "lucide-react";

interface FinancialSummaryWidgetProps {
  vesselId: number;
}

const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({ vesselId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/expenses/vessel', vesselId, 'summary'],
    queryFn: () => {
      if (!vesselId) return Promise.resolve({});
      return fetch(`/api/expenses/vessel/${vesselId}/summary`)
        .then(res => res.json())
        .catch(err => {
          console.error("Error fetching financial summary:", err);
          return {};
        });
    },
    enabled: !!vesselId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load financial summary</AlertDescription>
      </Alert>
    );
  }

  // Get summary data
  const summary = data || {
    totalExpenses: 0,
    totalIncome: 0,
    netBalance: 0,
    availableFunds: 0,
    lastMonthExpenses: 0,
    lastMonthIncome: 0
  };

  // Format numbers for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate month-over-month change for expenses
  const expenseChange = summary.lastMonthExpenses 
    ? ((summary.totalExpenses - summary.lastMonthExpenses) / summary.lastMonthExpenses) * 100 
    : 0;
  
  // Calculate month-over-month change for income
  const incomeChange = summary.lastMonthIncome 
    ? ((summary.totalIncome - summary.lastMonthIncome) / summary.lastMonthIncome) * 100 
    : 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <h4 className="text-2xl font-bold">{formatCurrency(summary.totalIncome)}</h4>
            </div>
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-xs">
            <span className={incomeChange >= 0 ? "text-green-600" : "text-red-600"}>
              {incomeChange >= 0 ? "+" : ""}{incomeChange.toFixed(1)}% 
            </span>
            <span className="text-muted-foreground"> from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <h4 className="text-2xl font-bold">{formatCurrency(summary.totalExpenses)}</h4>
            </div>
            <div className="rounded-full bg-red-100 p-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-xs">
            <span className={expenseChange <= 0 ? "text-green-600" : "text-red-600"}>
              {expenseChange >= 0 ? "+" : ""}{expenseChange.toFixed(1)}%
            </span>
            <span className="text-muted-foreground"> from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
              <h4 className="text-2xl font-bold">{formatCurrency(summary.netBalance)}</h4>
            </div>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-xs">
            <span className={summary.netBalance >= 0 ? "text-green-600" : "text-red-600"}>
              {summary.netBalance >= 0 ? "Positive" : "Negative"} balance
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available Funds</p>
              <h4 className="text-2xl font-bold">{formatCurrency(summary.availableFunds)}</h4>
            </div>
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-xs">
            <span className="text-muted-foreground">
              Across {summary.accountCount || 0} active accounts
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummaryWidget;