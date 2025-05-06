import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { useVessel } from '@/contexts/VesselContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CircleCheck, Search, AlertCircle, ArrowLeftRight, Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

type Transaction = {
  id: number;
  transactionDate: string;
  description: string;
  amount: string;
  category: string;
  status: string;
};

type Expense = {
  id: number;
  date: string;
  description: string;
  amount: string;
  category: string;
  receiptUrl?: string;
};

type Reconciliation = {
  id: number;
  transactionId: number;
  expenseId: number;
  reconciliationStatus: string;
  reconciliationMethod: string;
  reconciliationNotes?: string;
  createdBy: number;
  transaction?: Transaction;
  expense?: Expense;
};

const TransactionReconciliation = () => {
  const { currentVessel } = useVessel();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('unmatched');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  // Get unmatched transactions for the current vessel
  const { data: reconciliationData, isLoading: isLoadingReconciliation } = useQuery({
    queryKey: ['/api/banking/transactions/reconciliation', currentVessel?.id],
    queryFn: async () => {
      if (!currentVessel) return { transactions: [], reconciliations: [], totalCount: 0, unmatchedCount: 0, matchedCount: 0 };
      return apiRequest('GET', `/api/banking/transactions/reconciliation/${currentVessel.id}`);
    },
    enabled: !!currentVessel,
  });
  
  // Get all expenses for the current vessel for matching
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['/api/expenses/vessel', currentVessel?.id],
    queryFn: async () => {
      if (!currentVessel) return [];
      return apiRequest('GET', `/api/expenses/vessel/${currentVessel.id}`);
    },
    enabled: !!currentVessel,
  });
  
  // Get all reconciliations for the current vessel
  const { data: existingReconciliations, isLoading: isLoadingExistingReconciliations } = useQuery({
    queryKey: ['/api/banking/reconciliation/vessel', currentVessel?.id],
    queryFn: async () => {
      if (!currentVessel) return [];
      return apiRequest('GET', `/api/banking/reconciliation/vessel/${currentVessel.id}`);
    },
    enabled: !!currentVessel,
  });
  
  // Create a reconciliation
  const createReconciliationMutation = useMutation({
    mutationFn: async (data: { transactionId: number; expenseId: number; notes?: string }) => {
      return apiRequest('POST', '/api/banking/reconciliation', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transaction successfully matched with expense',
      });
      setIsMatchDialogOpen(false);
      setSelectedTransaction(null);
      setSelectedExpense(null);
      setReconciliationNotes('');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/banking/transactions/reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banking/reconciliation/vessel'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to match transaction with expense',
        variant: 'destructive',
      });
    },
  });
  
  // Delete a reconciliation
  const deleteReconciliationMutation = useMutation({
    mutationFn: async (reconciliationId: number) => {
      return apiRequest('DELETE', `/api/banking/reconciliation/${reconciliationId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Reconciliation successfully removed',
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/banking/transactions/reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/banking/reconciliation/vessel'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to remove reconciliation',
        variant: 'destructive',
      });
    },
  });
  
  useEffect(() => {
    if (expenses && selectedTransaction && expenseSearchTerm) {
      // Filter expenses based on search term and amount
      const searchLower = expenseSearchTerm.toLowerCase();
      const filtered = expenses.filter((expense) => {
        const descriptionMatch = expense.description?.toLowerCase().includes(searchLower);
        const categoryMatch = expense.category?.toLowerCase().includes(searchLower);
        
        // Optional: Show expenses with similar amounts first (within 10%)
        const transactionAmount = parseFloat(selectedTransaction.amount);
        const expenseAmount = parseFloat(expense.amount);
        const amountDiff = Math.abs(transactionAmount - expenseAmount);
        const amountSimilar = amountDiff / Math.max(Math.abs(transactionAmount), Math.abs(expenseAmount)) < 0.1;
        
        return (descriptionMatch || categoryMatch) || amountSimilar;
      });
      
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses([]);
    }
  }, [expenses, selectedTransaction, expenseSearchTerm]);
  
  const handleReconcile = () => {
    if (!selectedTransaction || !selectedExpense) {
      toast({
        title: 'Error',
        description: 'Please select both a transaction and an expense to match',
        variant: 'destructive',
      });
      return;
    }
    
    createReconciliationMutation.mutate({
      transactionId: selectedTransaction.id,
      expenseId: selectedExpense.id,
      notes: reconciliationNotes || undefined,
    });
  };
  
  const handleDeleteReconciliation = (reconciliation: Reconciliation) => {
    if (confirm(`Are you sure you want to remove the match between transaction "${reconciliation.transaction?.description}" and expense "${reconciliation.expense?.description}"?`)) {
      deleteReconciliationMutation.mutate(reconciliation.id);
    }
  };
  
  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsMatchDialogOpen(true);
  };
  
  const handleSelectExpense = (expense: Expense) => {
    setSelectedExpense(expense);
  };
  
  if (!currentVessel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Reconciliation</CardTitle>
          <CardDescription>Match banking transactions with expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Please select a vessel to view transaction reconciliation</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const isLoading = isLoadingReconciliation || isLoadingExpenses || isLoadingExistingReconciliations;
  const unmatchedTransactions = reconciliationData?.transactions || [];
  const matchedReconciliations = existingReconciliations || [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Reconciliation</CardTitle>
        <CardDescription>Match banking transactions with expenses for {currentVessel.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="unmatched" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="unmatched" className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Unmatched <Badge variant="outline" className="ml-2">{unmatchedTransactions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="matched" className="flex items-center">
              <CircleCheck className="mr-2 h-4 w-4" />
              Matched <Badge variant="outline" className="ml-2">{matchedReconciliations.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="unmatched">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : unmatchedTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CircleCheck className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium">All transactions are matched!</h3>
                <p className="text-muted-foreground">There are no unmatched transactions for this vessel.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unmatchedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{transaction.category || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === 'settled' ? 'outline' : 'secondary'}>
                            {transaction.status || 'Processing'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectTransaction(transaction)}
                            className="flex items-center"
                          >
                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                            Match
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="matched">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Loading reconciliations...</p>
              </div>
            ) : matchedReconciliations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium">No matched transactions yet</h3>
                <p className="text-muted-foreground">Start matching transactions with expenses to see them here.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Transaction Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expense Description</TableHead>
                      <TableHead>Match Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchedReconciliations.map((reconciliation) => (
                      <TableRow key={reconciliation.id}>
                        <TableCell>{formatDate(reconciliation.transaction?.transactionDate)}</TableCell>
                        <TableCell>{reconciliation.transaction?.description}</TableCell>
                        <TableCell>{formatCurrency(reconciliation.transaction?.amount)}</TableCell>
                        <TableCell>{reconciliation.expense?.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {reconciliation.reconciliationMethod === 'auto' ? 'Automatic' : 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReconciliation(reconciliation)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Match Dialog */}
        <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Match Transaction with Expense</DialogTitle>
              <DialogDescription>
                Select an expense to match with this transaction.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Transaction Details</h3>
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p>{formatDate(selectedTransaction.transactionDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">{formatCurrency(selectedTransaction.amount)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{selectedTransaction.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p>{selectedTransaction.category || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant="outline">{selectedTransaction.status || 'Processing'}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="mb-4">
              <div className="flex items-center mb-4">
                <h3 className="font-medium mr-auto">Select an Expense</h3>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search expenses..."
                    value={expenseSearchTerm}
                    onChange={(e) => setExpenseSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Select</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingExpenses ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">Loading expenses...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenses.length === 0 && expenseSearchTerm ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">No expenses matching "{expenseSearchTerm}"</p>
                        </TableCell>
                      </TableRow>
                    ) : (expenses?.length === 0 || (filteredExpenses.length === 0 && !expenseSearchTerm)) ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">No expenses found for this vessel</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (filteredExpenses.length > 0 ? filteredExpenses : expenses).map((expense) => (
                        <TableRow 
                          key={expense.id} 
                          className={selectedExpense?.id === expense.id ? 'bg-primary/5' : undefined}
                          onClick={() => handleSelectExpense(expense)}
                        >
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>{expense.category || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={selectedExpense?.id === expense.id ? 'default' : 'outline'} 
                              size="sm"
                              onClick={() => handleSelectExpense(expense)}
                            >
                              {selectedExpense?.id === expense.id ? 'Selected' : 'Select'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {selectedExpense && (
              <div className="mb-4">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this reconciliation..."
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleReconcile} 
                disabled={!selectedTransaction || !selectedExpense || createReconciliationMutation.isPending}
              >
                {createReconciliationMutation.isPending ? 'Matching...' : 'Match Transaction & Expense'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TransactionReconciliation;