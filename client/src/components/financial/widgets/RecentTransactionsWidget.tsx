import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from 'date-fns';

interface RecentTransactionsWidgetProps {
  vesselId: number;
}

const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ vesselId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/transactions/vessel', vesselId],
    enabled: !!vesselId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load recent transactions</AlertDescription>
      </Alert>
    );
  }

  // Get the transactions, defaulting to empty array if undefined
  const transactions = data || [];

  // If no transactions are available
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <p>No transactions available</p>
        <p className="text-sm">Add transactions to see them here</p>
      </div>
    );
  }

  // Display the most recent transactions (limit to 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentTransactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{format(new Date(transaction.transactionDate), 'MMM d, yyyy')}</TableCell>
            <TableCell>
              {transaction.description || (transaction.transactionType === 'expense' ? 'Expense' : 'Income')}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {transaction.category || 'uncategorized'}
              </Badge>
            </TableCell>
            <TableCell className={`text-right ${transaction.transactionType === 'deposit' ? 'text-green-600' : ''}`}>
              {transaction.transactionType === 'deposit' ? '+' : ''}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: transaction.currency || 'USD',
              }).format(transaction.amount)}
            </TableCell>
            <TableCell>
              <Badge 
                variant={transaction.status === 'paid' ? 'default' : 'secondary'}
                className={transaction.status === 'paid' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                  : ''}
              >
                {transaction.status || 'pending'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RecentTransactionsWidget;