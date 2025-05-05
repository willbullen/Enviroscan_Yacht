import React, { useState } from "react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, RefreshCw, ExternalLink, Search, FileCheck, Upload, Filter } from "lucide-react";
import { format } from "date-fns";

// Types
interface Transaction {
  id: number;
  vesselId: number;
  accountId: number;
  amount: number;
  currency: string;
  description: string;
  transactionDate: string;
  category?: string;
  status: "pending" | "reconciled" | "unmatched";
  expenseId?: number;
  bankReference?: string;
  provider?: string;
  merchant?: string;
}

interface Expense {
  id: number;
  vesselId: number;
  accountId: number;
  amount: number;
  currency: string;
  description: string;
  purchaseDate: string;
  category: string;
  vendor: string;
  receipt?: string;
  status: "pending" | "matched" | "unmatched";
  transactionId?: number;
}

const TransactionReconciliation: React.FC = () => {
  const { settings } = useSystemSettings();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("unreconciled");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);

  // Fetch transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/transactions', selectedVessel],
    enabled: !!selectedVessel,
  });

  // Fetch expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['/api/expenses', selectedVessel],
    enabled: !!selectedVessel,
  });

  // Fetch vessels for dropdown
  const { data: vessels = [], isLoading: isLoadingVessels } = useQuery({
    queryKey: ['/api/vessels'],
  });

  // Filter transactions based on search and reconciliation status
  const filteredTransactions = (transactions as Transaction[])
    .filter(t => {
      if (searchQuery) {
        return (
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.amount.toString().includes(searchQuery) ||
          (t.merchant && t.merchant.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return true;
    })
    .filter(t => {
      if (activeTab === "unreconciled") {
        return t.status !== "reconciled";
      } else if (activeTab === "reconciled") {
        return t.status === "reconciled";
      }
      return true;
    });

  // Format amount with currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Handle transaction reconciliation
  const reconcileTransaction = async (transaction: Transaction, expense: Expense) => {
    if (settings.useMockBankingData) {
      // Simulate reconciliation in demo mode
      toast({
        title: "Transaction Reconciled",
        description: "Transaction was successfully matched with the expense (demo mode)",
      });
      setIsMatchDialogOpen(false);
      return;
    }
    
    try {
      // In a real app, this would reconcile the transaction with the expense
      const response = await fetch(`/api/transactions/${transaction.id}/reconcile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expenseId: expense.id }),
      });

      if (response.ok) {
        toast({
          title: "Transaction Reconciled",
          description: "Transaction was successfully matched with the expense",
        });
        setIsMatchDialogOpen(false);
        // Refetch data to update the UI
      } else {
        const errorData = await response.json();
        toast({
          title: "Reconciliation Failed",
          description: errorData.message || "Failed to reconcile transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during reconciliation",
        variant: "destructive",
      });
    }
  };

  // Open match dialog
  const openMatchDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsMatchDialogOpen(true);
  };

  // Generate mock data if using demo mode
  const demoTransactions: Transaction[] = settings.useMockBankingData ? [
    {
      id: 1,
      vesselId: 1,
      accountId: 1,
      amount: -1250.00,
      currency: "USD",
      description: "MTU Engine Parts Purchase",
      transactionDate: "2025-04-28",
      category: "Maintenance",
      status: "unmatched",
      bankReference: "CENT-123456789",
      provider: "Centtrip",
      merchant: "MTU Supplies Ltd."
    },
    {
      id: 2,
      vesselId: 1,
      accountId: 1,
      amount: -350.50,
      currency: "EUR",
      description: "Vessel Cleaning Supplies",
      transactionDate: "2025-04-29",
      category: "Supplies",
      status: "reconciled",
      expenseId: 2,
      bankReference: "CENT-987654321",
      provider: "Centtrip",
      merchant: "Marine Cleaning Co."
    },
    {
      id: 3,
      vesselId: 1,
      accountId: 2,
      amount: -2750.00,
      currency: "GBP",
      description: "Crew Uniform Order",
      transactionDate: "2025-05-01",
      category: "Crew",
      status: "unmatched",
      bankReference: "REV-567891234",
      provider: "Revolut",
      merchant: "Yacht Uniforms Inc."
    }
  ] : (transactions as Transaction[]);

  const demoExpenses: Expense[] = settings.useMockBankingData ? [
    {
      id: 1,
      vesselId: 1,
      accountId: 1,
      amount: 1250.00,
      currency: "USD",
      description: "MTU Engine Parts",
      purchaseDate: "2025-04-28",
      category: "Maintenance",
      vendor: "MTU Supplies Ltd.",
      receipt: "/uploads/receipts/mtu-parts.jpg",
      status: "unmatched"
    },
    {
      id: 2,
      vesselId: 1,
      accountId: 1,
      amount: 350.50,
      currency: "EUR",
      description: "Cleaning Supplies",
      purchaseDate: "2025-04-29",
      category: "Supplies",
      vendor: "Marine Cleaning Co.",
      receipt: "/uploads/receipts/cleaning-supplies.jpg",
      status: "matched",
      transactionId: 2
    },
    {
      id: 3,
      vesselId: 1,
      accountId: 2,
      amount: 2750.00,
      currency: "GBP",
      description: "Crew Uniforms",
      purchaseDate: "2025-05-01",
      category: "Crew",
      vendor: "Yacht Uniforms Inc.",
      status: "unmatched"
    }
  ] : (expenses as Expense[]);

  // Find potential matches for a transaction
  const findPotentialMatches = (transaction: Transaction): Expense[] => {
    return demoExpenses.filter(expense => 
      expense.status !== "matched" && 
      Math.abs(expense.amount) === Math.abs(transaction.amount) &&
      expense.currency === transaction.currency
    );
  };

  // Check if we should use demo or real data
  const displayTransactions = settings.useMockBankingData ? demoTransactions : filteredTransactions;

  const isLoading = isLoadingTransactions || isLoadingExpenses || isLoadingVessels;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h3 className="text-lg font-medium">Transaction Reconciliation</h3>
        
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            <Filter className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" /> Sync Transactions
          </Button>
        </div>
      </div>

      {settings.useMockBankingData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileCheck className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode Active:</strong> Using simulated transaction and expense data. To use real banking data, disable demo mode in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="unreconciled">
                Unreconciled Transactions
              </TabsTrigger>
              <TabsTrigger value="reconciled">
                Reconciled Transactions
              </TabsTrigger>
              <TabsTrigger value="all">
                All Transactions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.merchant || 'Unknown'}</TableCell>
                        <TableCell className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatAmount(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'reconciled' ? 'default' : 'outline'}>
                            {transaction.status === 'reconciled' ? 'Reconciled' : 'Unmatched'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {transaction.status !== 'reconciled' && (
                              <Button size="sm" variant="outline" onClick={() => openMatchDialog(transaction)}>
                                Match
                              </Button>
                            )}
                            {transaction.status === 'reconciled' && (
                              <Button size="sm" variant="outline" disabled>
                                <CheckCircle className="mr-1 h-4 w-4" /> Matched
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {displayTransactions.length} transactions
          </div>
        </CardFooter>
      </Card>

      {/* Match Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Match Transaction</DialogTitle>
            <DialogDescription>
              Select an expense to match with this transaction. Only expenses with the same amount and currency are shown.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="text-sm font-medium">Transaction Details</div>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/50">
                  <div>
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <div className="font-medium">{formatDate(selectedTransaction.transactionDate)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <div className="font-medium">{formatAmount(selectedTransaction.amount, selectedTransaction.currency)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <div className="font-medium">{selectedTransaction.description}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Merchant:</span>
                    <div className="font-medium">{selectedTransaction.merchant || 'Unknown'}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <div className="text-sm font-medium">Potential Matches</div>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {findPotentialMatches(selectedTransaction).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No matching expenses found
                          </TableCell>
                        </TableRow>
                      ) : (
                        findPotentialMatches(selectedTransaction).map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{formatDate(expense.purchaseDate)}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{expense.vendor}</TableCell>
                            <TableCell>{formatAmount(expense.amount, expense.currency)}</TableCell>
                            <TableCell>
                              {expense.receipt ? (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={expense.receipt} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              ) : 'No receipt'}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" onClick={() => reconcileTransaction(selectedTransaction, expense)}>
                                Match
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="text-sm text-center text-muted-foreground">
                {findPotentialMatches(selectedTransaction).length === 0 && (
                  <div className="flex flex-col items-center">
                    <p className="mb-2">No matching expenses found. You can:</p>
                    <div className="flex space-x-4">
                      <Button variant="outline" disabled>
                        <Upload className="mr-2 h-4 w-4" /> Upload New Expense
                      </Button>
                      <Button variant="outline" disabled>
                        <Search className="mr-2 h-4 w-4" /> Find Similar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionReconciliation;