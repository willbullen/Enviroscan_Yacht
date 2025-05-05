import React, { useState } from 'react';
import { Check, Filter, RefreshCw, Search, AlertCircle, FileCheck, Link, FileInput, Plus, Pencil, X, ArrowUpDown, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';

interface TransactionReconciliationProps {
  vesselId: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'matched' | 'unmatched' | 'reconciled';
  matchedExpenseId?: number;
  matchConfidence?: number;
  provider: string;
  category?: string;
  reference?: string;
}

interface ExpenseMatch {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  vendor: string;
  confidence: number;
}

const TransactionReconciliation: React.FC<TransactionReconciliationProps> = ({ vesselId }) => {
  const { useMockBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [searchValue, setSearchValue] = useState('');
  const [dateFilter, setDateFilter] = useState<{from?: Date; to?: Date}>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched' | 'reconciled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Mock transaction data - in a real app this would come from an API call
  const mockTransactions: Transaction[] = [
    {
      id: 't-001',
      date: '2025-05-01T10:30:00Z',
      description: 'Fuel Purchase - Monaco Yacht Services',
      amount: 12500.00,
      type: 'debit',
      status: 'matched',
      matchedExpenseId: 1001,
      matchConfidence: 0.95,
      provider: 'Centtrip',
      category: 'Fuel',
      reference: 'INV-2025-001'
    },
    {
      id: 't-002',
      date: '2025-05-02T14:15:00Z',
      description: 'Port de Monaco - Docking Fees',
      amount: 8750.50,
      type: 'debit',
      status: 'unmatched',
      provider: 'Centtrip',
      reference: 'DOC-2025-042'
    },
    {
      id: 't-003',
      date: '2025-05-03T09:00:00Z',
      description: 'Crew Payroll Payment',
      amount: 45000.00,
      type: 'debit',
      status: 'reconciled',
      matchedExpenseId: 1002,
      provider: 'Revolut',
      category: 'Crew Salaries',
      reference: 'PAY-2025-MAY'
    },
    {
      id: 't-004',
      date: '2025-05-03T11:30:00Z',
      description: 'Owner Transfer - Monthly Budget',
      amount: 150000.00,
      type: 'credit',
      status: 'reconciled',
      matchedExpenseId: 1003,
      provider: 'Revolut',
      category: 'Owner Funding',
      reference: 'TRF-MAY2025'
    },
    {
      id: 't-005',
      date: '2025-05-04T08:45:00Z',
      description: 'Provisions - Maritime Supplies Ltd',
      amount: 3250.75,
      type: 'debit',
      status: 'unmatched',
      provider: 'Centtrip',
      reference: 'PO-2025-118'
    },
    {
      id: 't-006',
      date: '2025-05-04T15:20:00Z',
      description: 'Charter Revenue - Weekly Charter',
      amount: 85000.00,
      type: 'credit',
      status: 'matched',
      matchedExpenseId: 1004,
      matchConfidence: 0.98,
      provider: 'Centtrip',
      category: 'Charter Income',
      reference: 'CHR-2025-042'
    },
    {
      id: 't-007',
      date: '2025-05-05T10:10:00Z',
      description: 'Insurance Premium Payment',
      amount: 12850.00,
      type: 'debit',
      status: 'unmatched',
      provider: 'Revolut',
      reference: 'INS-2025-Q2'
    }
  ];
  
  // Mock expense matches for the selected transaction
  const mockExpenseMatches: ExpenseMatch[] = [
    {
      id: 2001,
      date: '2025-05-02T14:00:00Z',
      description: 'Port de Monaco - Berth Fees May 2025',
      amount: 8750.50,
      category: 'Docking',
      vendor: 'Port de Monaco',
      confidence: 0.92
    },
    {
      id: 2002,
      date: '2025-05-02T15:30:00Z',
      description: 'Monaco Harbor - Monthly Docking',
      amount: 8740.00,
      category: 'Docking',
      vendor: 'Monaco Harbor',
      confidence: 0.84
    },
    {
      id: 2003,
      date: '2025-05-01T11:00:00Z',
      description: 'Port Authority Fees - Monaco',
      amount: 8800.00,
      category: 'Port Fees',
      vendor: 'Port Authority',
      confidence: 0.76
    }
  ];
  
  // Apply filters to transactions
  const filteredTransactions = mockTransactions
    .filter(transaction => {
      // Text search filter
      const searchMatch = !searchValue || 
        transaction.description.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.provider.toLowerCase().includes(searchValue.toLowerCase());
      
      // Date range filter
      const dateMatch = (!dateFilter.from || new Date(transaction.date) >= dateFilter.from) &&
                     (!dateFilter.to || new Date(transaction.date) <= dateFilter.to);
      
      // Status filter
      const statusMatch = statusFilter === 'all' || transaction.status === statusFilter;
      
      // Type filter
      const typeMatch = typeFilter === 'all' || transaction.type === typeFilter;
      
      // Provider filter
      const providerMatch = providerFilter === 'all' || transaction.provider === providerFilter;
      
      return searchMatch && dateMatch && statusMatch && typeMatch && providerMatch;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRefreshTransactions = () => {
    setIsRefreshing(true);
    
    // Simulate API call to refresh data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };
  
  const handleSyncBankingData = () => {
    setIsSyncingData(true);
    
    // Simulate API call to sync banking data
    setTimeout(() => {
      setIsSyncingData(false);
    }, 2000);
  };
  
  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    
    setSelectedTransactions(newSelected);
  };
  
  const handleSelectAllTransactions = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredTransactions.map(t => t.id));
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  };
  
  const handleOpenMatchDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowMatchDialog(true);
  };
  
  const handleMatchTransaction = (expenseId: number) => {
    // In a real app, this would call an API to match the transaction to the expense
    setShowMatchDialog(false);
    
    // For demonstration, we'll just show a simulated success UI update
    setTimeout(() => {
      setSelectedTransaction(null);
    }, 500);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };
  
  const formatAmount = (amount: number, type: 'credit' | 'debit') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: type === 'debit' ? 'never' : 'never'
    }).format(amount);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Link className="h-3.5 w-3.5 mr-1.5" />
            Matched
          </Badge>
        );
      case 'reconciled':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <FileCheck className="h-3.5 w-3.5 mr-1.5" />
            Reconciled
          </Badge>
        );
      case 'unmatched':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Unmatched
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const getTypeLabel = (type: 'credit' | 'debit', amount: number) => {
    return type === 'credit' 
      ? <span className="text-green-600">+{formatAmount(amount, type)}</span>
      : <span className="text-red-600">-{formatAmount(amount, type)}</span>;
  };
  
  const getProviderFilters = () => {
    const providers = Array.from(new Set(mockTransactions.map(t => t.provider)));
    return providers;
  };
  
  const getConfidenceBadge = (confidence: number) => {
    let colorClass = 'bg-red-50 text-red-700 border-red-200';
    
    if (confidence >= 0.9) {
      colorClass = 'bg-green-50 text-green-700 border-green-200';
    } else if (confidence >= 0.7) {
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (confidence >= 0.5) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }
    
    return (
      <Badge variant="outline" className={colorClass}>
        {Math.round(confidence * 100)}% Match
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search transactions..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-md"
            // Removed prefix prop since it's not supported
          />
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateFilter.from ? (
                  dateFilter.to ? (
                    <>
                      {format(dateFilter.from, "MMM d, yyyy")} - {format(dateFilter.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateFilter.from, "MMM d, yyyy")
                  )
                ) : (
                  "Date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={{
                  from: dateFilter.from,
                  to: dateFilter.to
                }}
                onSelect={(range) => {
                  setDateFilter(range || {});
                  if (range?.to) {
                    setCalendarOpen(false);
                  }
                }}
              />
              <div className="flex items-center justify-between p-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setDateFilter({});
                    setCalendarOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setCalendarOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Transaction Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <Label className="text-xs">Status</Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => setStatusFilter(value as any)}
                >
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="unmatched">Unmatched</SelectItem>
                    <SelectItem value="reconciled">Reconciled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-2">
                <Label className="text-xs">Type</Label>
                <Select 
                  value={typeFilter} 
                  onValueChange={(value) => setTypeFilter(value as any)}
                >
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credits</SelectItem>
                    <SelectItem value="debit">Debits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-2">
                <Label className="text-xs">Provider</Label>
                <Select
                  value={providerFilter}
                  onValueChange={(value) => setProviderFilter(value)}
                >
                  <SelectTrigger className="mt-1 h-8">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {getProviderFilters().map(provider => (
                      <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setProviderFilter('all');
                    setDateFilter({});
                    setSearchValue('');
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            disabled={isRefreshing || !useLiveBankingData}
            onClick={handleRefreshTransactions}
          >
            {isRefreshing ? (
              <>
                <Spinner size="xs" className="mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button 
            disabled={isSyncingData || !useLiveBankingData}
            onClick={handleSyncBankingData}
          >
            {isSyncingData ? (
              <>
                <Spinner size="xs" className="mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Sync Banking Data
              </>
            )}
          </Button>
        </div>
      </div>
      
      {selectedTransactions.size > 0 && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Mark as Reconciled
            </Button>
            <Button variant="outline" size="sm">
              Export Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTransactions(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                  onCheckedChange={handleSelectAllTransactions}
                  aria-label="Select all transactions"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileInput className="h-8 w-8 mb-1" />
                    <p>No transactions found</p>
                    <p className="text-sm">Try adjusting your filters or sync with your banking provider</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTransactions.has(transaction.id)}
                      onCheckedChange={() => handleSelectTransaction(transaction.id)}
                      aria-label={`Select transaction ${transaction.description}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatDate(transaction.date)}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(transaction.date)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    {transaction.category && (
                      <div className="text-xs text-muted-foreground">{transaction.category}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.reference || '-'}
                  </TableCell>
                  <TableCell>
                    {transaction.provider}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {getTypeLabel(transaction.type, transaction.amount)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.status === 'unmatched' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenMatchDialog(transaction)}
                      >
                        <Link className="h-4 w-4 mr-1.5" />
                        Match
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenMatchDialog(transaction)}>
                            <Link className="h-4 w-4 mr-2" />
                            Change Match
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Mark Reconciled
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!useLiveBankingData && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertTitle>Using Test Data</AlertTitle>
          <AlertDescription>
            You're viewing simulated transaction data. Toggle to live mode in settings to use actual banking data.
          </AlertDescription>
        </Alert>
      )}
      
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Match Transaction</DialogTitle>
            <DialogDescription>
              Select an expense to match with this transaction or create a new expense
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTransaction && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Transaction Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Description</div>
                    <div>{selectedTransaction.description}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Amount</div>
                    <div className={selectedTransaction.type === 'credit' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {selectedTransaction.type === 'credit' ? '+' : '-'}{formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Date</div>
                    <div>{formatDate(selectedTransaction.date)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Reference</div>
                    <div>{selectedTransaction.reference || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Provider</div>
                    <div>{selectedTransaction.provider}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground mb-1">Type</div>
                    <div className="capitalize">{selectedTransaction.type}</div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-3">Suggested Matches</h4>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExpenseMatches.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.vendor}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(expense.amount, 'debit')}
                        </TableCell>
                        <TableCell>
                          {getConfidenceBadge(expense.confidence)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm"
                            onClick={() => handleMatchTransaction(expense.id)}
                          >
                            <Check className="h-4 w-4 mr-1.5" />
                            Match
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline"
                className="w-full max-w-md"
                onClick={() => setIsCreatingExpense(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Expense from Transaction
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionReconciliation;