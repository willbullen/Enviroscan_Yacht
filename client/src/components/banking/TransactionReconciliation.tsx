import React, { useState } from 'react';
import { Check, Filter, RefreshCw, Search, AlertCircle, FileCheck, Link as LinkIcon, FileInput, Plus, Pencil, X, ArrowUpDown, Download, Eye, Upload, ChevronDown, Building2, Clock, CreditCard, ListChecks, MoreHorizontal, Link2, FileSpreadsheet, Calendar as CalendarIcon, Settings, Loader2 } from 'lucide-react';
import BankingProviders from './BankingProviders';
import type { BankingTransaction } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TransactionReconciliationProps {
  vesselId: number;
}

interface BankAccount {
  id: string;
  name: string;
  currentBalance: number;
  lastSync: string;
  transactionsCount: number;
  provider: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'matched' | 'unmatched' | 'reconciled' | 'excluded';
  matchedExpenseId?: number;
  matchConfidence?: number;
  provider: string;
  category?: string;
  payee?: string;
  reference?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
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

interface TransactionRule {
  id: string;
  name: string;
  priority: number;
  conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  actions: {
    type: string;
    value: string;
  }[];
  appliedTo: 'all' | string;
  status: 'active' | 'inactive';
  autoConfirm: boolean;
}

const TransactionReconciliation: React.FC<TransactionReconciliationProps> = ({ vesselId }) => {
  const { useMockBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [searchValue, setSearchValue] = useState('');
  const [dateFilter, setDateFilter] = useState<{from?: Date; to?: Date}>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched' | 'reconciled' | 'excluded'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [showBankAccountDropdown, setShowBankAccountDropdown] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'for-review' | 'categorized' | 'excluded'>('for-review');
  const [showManageProviders, setShowManageProviders] = useState(false);
  
  // Fetch banking transactions from the API
  const {
    data: bankingTransactions = [],
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery<BankingTransaction[]>({
    queryKey: [`/api/banking/transactions/vessel/${vesselId}`, vesselId],
    enabled: !!vesselId
  });

  // Fetch bank connections from the API
  const {
    data: bankConnections = [],
    isLoading: isLoadingBankConnections,
    error: bankConnectionsError
  } = useQuery<any[]>({
    queryKey: [`/api/banking/connections/vessel/${vesselId}`, vesselId],
    enabled: !!vesselId,
  });
  
  // Transform API transaction data to match our UI component format
  const transformedTransactions: Transaction[] = React.useMemo(() => {
    return bankingTransactions.map((transaction) => ({
      id: transaction.id.toString(),
      date: transaction.transactionDate instanceof Date 
        ? transaction.transactionDate.toISOString() 
        : transaction.createdAt instanceof Date 
          ? transaction.createdAt.toISOString() 
          : new Date().toISOString(),
      description: transaction.description || 'No description',
      amount: parseFloat(transaction.amount),
      type: parseFloat(transaction.amount) >= 0 ? 'credit' : 'debit',
      status: 'unmatched', // Default status until we implement reconciliation
      matchedExpenseId: undefined,
      matchConfidence: undefined,
      provider: 'Bank', // Default provider until we implement provider tracking
      category: transaction.transactionType || 'Uncategorized',
      payee: undefined,
      reference: `${transaction.currency} ${transaction.exchangeRate !== "1" ? `(Rate: ${transaction.exchangeRate})` : ''}`
    }));
  }, [bankingTransactions]);
  
  // Transform bank connections to BankAccount format
  const bankAccounts: BankAccount[] = React.useMemo(() => {
    return bankConnections.map((connection) => ({
      id: connection.id.toString(),
      name: connection.accountName || `Account ${connection.accountIdentifier}`,
      currentBalance: parseFloat(connection.balance || '0'),
      lastSync: connection.lastSyncedAt || new Date().toISOString(),
      // Default to 5 as a placeholder since we can't filter by providerId
      transactionsCount: 5,
      provider: connection.providerName || 'Unknown Provider'
    }));
  }, [bankConnections]);
  
  // Set default selected bank account
  React.useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBankAccount) {
      setSelectedBankAccount(bankAccounts[0]);
    }
  }, [bankAccounts]);
  
  // Mock categories
  const mockCategories: ExpenseCategory[] = [
    { id: 'cat-001', name: 'Fuel' },
    { id: 'cat-002', name: 'Docking Fees' },
    { id: 'cat-003', name: 'Crew Salaries' },
    { id: 'cat-004', name: 'Provisions' },
    { id: 'cat-005', name: 'Maintenance' },
    { id: 'cat-006', name: 'Insurance' },
    { id: 'cat-007', name: 'Charter Income' },
    { id: 'cat-008', name: 'Owner Funding' },
    { id: 'cat-009', name: 'Miscellaneous' }
  ];
  
  // Mock transaction rules
  const mockRules: TransactionRule[] = [
    {
      id: 'rule-001',
      name: 'Payroll Rule',
      priority: 1,
      conditions: [{ field: 'description', operator: 'contains', value: 'Payroll' }],
      actions: [{ type: 'category', value: 'Crew Salaries' }],
      appliedTo: 'all',
      status: 'active',
      autoConfirm: true
    },
    {
      id: 'rule-002',
      name: 'Docking Fees Rule',
      priority: 2,
      conditions: [{ field: 'description', operator: 'contains', value: 'Port' }],
      actions: [{ type: 'category', value: 'Docking Fees' }],
      appliedTo: 'all',
      status: 'active',
      autoConfirm: false
    },
    {
      id: 'rule-003',
      name: 'Fuel Purchases',
      priority: 3,
      conditions: [{ field: 'description', operator: 'contains', value: 'Fuel' }],
      actions: [{ type: 'category', value: 'Fuel' }],
      appliedTo: 'all',
      status: 'active',
      autoConfirm: true
    }
  ];
  
  // Fetch expense data that could match with transactions
  const {
    data: expensesData = [],
    isLoading: isLoadingExpenses,
    error: expensesError
  } = useQuery<any[]>({
    queryKey: [`/api/expenses/vessel/${vesselId}`, vesselId],
    enabled: !!vesselId,
  });
  
  // Transform expenses to match ExpenseMatch format
  const expenseMatches: ExpenseMatch[] = React.useMemo(() => {
    return expensesData.map(expense => ({
      id: expense.id,
      date: expense.expenseDate instanceof Date 
        ? expense.expenseDate.toISOString() 
        : expense.createdAt instanceof Date 
          ? expense.createdAt.toISOString() 
          : new Date().toISOString(),
      description: expense.description || 'No description',
      amount: parseFloat(expense.total),
      category: expense.category || 'Uncategorized',
      vendor: expense.vendorName || 'Unknown Vendor',
      confidence: expense.matchConfidence || 0.85 // Default confidence if not provided
    }));
  }, [expensesData]);
  
  // Filter transactions based on the active view tab
  const getStatusFilteredTransactions = (transactions: Transaction[]) => {
    if (activeView === 'for-review') {
      return transactions.filter(t => t.status === 'unmatched');
    } else if (activeView === 'categorized') {
      return transactions.filter(t => t.status === 'matched' || t.status === 'reconciled');
    } else {
      return transactions.filter(t => t.status === 'excluded');
    }
  };
  
  // Filter transactions based on search, date and status
  const filteredTransactions = getStatusFilteredTransactions(transformedTransactions)
    .filter(transaction => {
      // Search filter
      if (searchValue && !transaction.description.toLowerCase().includes(searchValue.toLowerCase()) && 
          !transaction.payee?.toLowerCase().includes(searchValue.toLowerCase()) &&
          !transaction.reference?.toLowerCase().includes(searchValue.toLowerCase())) {
        return false;
      }
      
      // Date filter
      if (dateFilter.from && new Date(transaction.date) < dateFilter.from) {
        return false;
      }
      if (dateFilter.to) {
        const toDateEnd = new Date(dateFilter.to);
        toDateEnd.setHours(23, 59, 59, 999);
        if (new Date(transaction.date) > toDateEnd) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all' && transaction.status !== statusFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }
      
      // Provider filter
      if (providerFilter !== 'all' && transaction.provider !== providerFilter) {
        return false;
      }
      
      return true;
    });
  
  // Helper to get unique providers for filtering
  const getProviderFilters = () => {
    const providers = new Set<string>();
    transformedTransactions.forEach(t => providers.add(t.provider));
    return Array.from(providers);
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };
  
  // Format amount with currency
  const formatAmount = (amount: number, type: string) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Get appropriate badge color for confidence level
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">High ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Low ({Math.round(confidence * 100)}%)</Badge>;
    }
  };
  
  // Handle transaction selection
  const handleSelectTransaction = (id: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTransactions(newSelection);
  };
  
  // Handle select all transactions
  const handleSelectAllTransactions = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredTransactions.map(t => t.id));
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  };
  
  // Handle match transaction to expense
  const handleMatchTransaction = (expenseId: number) => {
    // In a real app, this would update the transaction in the database
    alert(`Matched transaction to expense ID: ${expenseId}`);
    setShowMatchDialog(false);
  };
  
  // Handle opening match dialog
  const handleOpenMatchDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowMatchDialog(true);
  };
  
  // Handle opening review dialog
  const handleOpenReviewDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReviewDialog(true);
  };
  
  // Handle sync with banking provider
  const handleSyncBankData = () => {
    setIsSyncingData(true);
    // In a real app, this would call an API to sync data
    setTimeout(() => {
      setIsSyncingData(false);
      // Show success toast
      alert('Banking data synced successfully');
    }, 1500);
  };
  
  // Handle refresh transactions
  const handleRefreshTransactions = () => {
    setIsRefreshing(true);
    // In a real app, this would call an API to refresh transactions
    setTimeout(() => {
      setIsRefreshing(false);
      // Show success toast
      alert('Transactions refreshed successfully');
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banking & Reconciliation</h1>
          <p className="text-muted-foreground">
            Connect your bank accounts, manage transactions, and reconcile with expenses.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handleRefreshTransactions}>
            {isRefreshing ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>
      
      {!bankingAPICredentialsSet && !useMockBankingData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Banking API not configured</AlertTitle>
          <AlertDescription>
            To connect to your banking providers, please configure the Banking API credentials in the settings.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-12 gap-6">
        {/* Account selection and summary card */}
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Bank Accounts</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowManageProviders(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Providers
                </Button>
                <Button size="sm" variant="outline" onClick={handleSyncBankData}>
                  {isSyncingData ? <Spinner className="h-4 w-4 mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                  Sync
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="relative">
              <button 
                className="w-full flex items-center justify-between p-3 rounded-md border border-input bg-white hover:bg-gray-50"
                onClick={() => setShowBankAccountDropdown(prev => !prev)}
              >
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedBankAccount?.name || 'Select an account'}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBankAccount && `${formatAmount(selectedBankAccount.currentBalance, 'balance')} • ${selectedBankAccount.provider}`}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${showBankAccountDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showBankAccountDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-white shadow-lg">
                  {bankAccounts.map(account => (
                    <div
                      key={account.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                      onClick={() => {
                        setSelectedBankAccount(account);
                        setShowBankAccountDropdown(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.provider}</p>
                        </div>
                        <p className="font-medium">{formatAmount(account.currentBalance, 'balance')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedBankAccount && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Synced</p>
                    <p className="text-sm font-medium flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {formatDate(selectedBankAccount.lastSync)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                    <p className="text-sm font-medium flex items-center">
                      <ListChecks className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {selectedBankAccount.transactionsCount}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium">Transaction Status</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-md bg-yellow-50 p-1">
                      <p className="font-medium text-yellow-700">For Review</p>
                      <p className="text-yellow-700">
                        {transformedTransactions.filter(t => t.status === 'unmatched').length}
                      </p>
                    </div>
                    <div className="rounded-md bg-green-50 p-1">
                      <p className="font-medium text-green-700">Categorized</p>
                      <p className="text-green-700">
                        {transformedTransactions.filter(t => t.status === 'matched' || t.status === 'reconciled').length}
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-1">
                      <p className="font-medium text-gray-700">Excluded</p>
                      <p className="text-gray-700">
                        {transformedTransactions.filter(t => t.status === 'excluded').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between space-x-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setShowReconcileDialog(true)}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Reconcile
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setShowRuleDialog(true)}>
                    <FileInput className="h-4 w-4 mr-2" />
                    Rules
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tabs and transaction list */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Tabs defaultValue="for-review" onValueChange={(value) => setActiveView(value as any)}>
            <div className="flex items-center justify-between pb-2">
              <TabsList>
                <TabsTrigger value="for-review" className="relative">
                  For Review
                  <Badge className="ml-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                    {transformedTransactions.filter(t => t.status === 'unmatched').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="categorized">
                  Categorized
                  <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                    {transformedTransactions.filter(t => t.status === 'matched' || t.status === 'reconciled').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="excluded">
                  Excluded
                  <Badge className="ml-2 bg-gray-100 text-gray-700 hover:bg-gray-100">
                    {transformedTransactions.filter(t => t.status === 'excluded').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    className="pl-9 w-60" 
                    placeholder="Search transactions" 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filter Transactions</h4>
                      <div className="space-y-2">
                        <Label htmlFor="statusFilter">Status</Label>
                        <Select
                          value={statusFilter}
                          onValueChange={(value) => setStatusFilter(value as any)}
                        >
                          <SelectTrigger id="statusFilter">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="matched">Matched</SelectItem>
                            <SelectItem value="unmatched">Unmatched</SelectItem>
                            <SelectItem value="reconciled">Reconciled</SelectItem>
                            <SelectItem value="excluded">Excluded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="typeFilter">Type</Label>
                        <Select
                          value={typeFilter}
                          onValueChange={(value) => setTypeFilter(value as any)}
                        >
                          <SelectTrigger id="typeFilter">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="debit">Debit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="providerFilter">Provider</Label>
                        <Select
                          value={providerFilter}
                          onValueChange={setProviderFilter}
                        >
                          <SelectTrigger id="providerFilter">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Providers</SelectItem>
                            {getProviderFilters().map(provider => (
                              <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dateRange">Date Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                id="dateRange"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter.from ? (
                                  format(dateFilter.from, "PPP")
                                ) : (
                                  <span>From date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={dateFilter.from}
                                onSelect={(date) => {
                                  setDateFilter(prev => ({ ...prev, from: date || undefined }));
                                  setCalendarOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateFilter.to ? (
                                  format(dateFilter.to, "PPP")
                                ) : (
                                  <span>To date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={dateFilter.to}
                                onSelect={(date) => 
                                  setDateFilter(prev => ({ ...prev, to: date || undefined }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      
                      <div className="flex justify-between pt-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setStatusFilter('all');
                            setTypeFilter('all');
                            setProviderFilter('all');
                            setDateFilter({});
                          }}
                        >
                          Reset filters
                        </Button>
                        <Button variant="default">
                          Apply filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <TabsContent value="for-review" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  {isLoadingTransactions ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner className="h-8 w-8 text-primary" />
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No transactions to review</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedTransactions.size > 0 && selectedTransactions.size === filteredTransactions.length}
                              onCheckedChange={handleSelectAllTransactions}
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map(transaction => (
                          <TableRow 
                            key={transaction.id}
                            className={selectedTransactions.has(transaction.id) ? 'bg-primary/5' : ''}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={selectedTransactions.has(transaction.id)} 
                                onCheckedChange={() => handleSelectTransaction(transaction.id)}
                              />
                            </TableCell>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="max-w-[250px] truncate">
                                      {transaction.description}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{transaction.description}</p>
                                    {transaction.reference && <p className="text-xs text-muted-foreground">{transaction.reference}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatAmount(transaction.amount, transaction.type)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenMatchDialog(transaction)}
                                >
                                  <Link2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenReviewDialog(transaction)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Export
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <X className="h-4 w-4 mr-2" />
                                      Exclude
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                {selectedTransactions.size > 0 && (
                  <CardFooter className="justify-between py-4">
                    <div className="text-sm">
                      {selectedTransactions.size} transactions selected
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTransactions(new Set())}>
                        Clear Selection
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Exclude Selected
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="categorized" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  {isLoadingTransactions ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner className="h-8 w-8 text-primary" />
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No categorized transactions</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedTransactions.size > 0 && selectedTransactions.size === filteredTransactions.length}
                              onCheckedChange={handleSelectAllTransactions}
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map(transaction => (
                          <TableRow 
                            key={transaction.id}
                            className={selectedTransactions.has(transaction.id) ? 'bg-primary/5' : ''}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={selectedTransactions.has(transaction.id)} 
                                onCheckedChange={() => handleSelectTransaction(transaction.id)}
                              />
                            </TableCell>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="max-w-[200px] truncate">
                                      {transaction.description}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{transaction.description}</p>
                                    {transaction.reference && <p className="text-xs text-muted-foreground">{transaction.reference}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.category}</Badge>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatAmount(transaction.amount, transaction.type)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenReviewDialog(transaction)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Export
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Link2 className="h-4 w-4 mr-2" />
                                      Change Match
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="excluded" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  {isLoadingTransactions ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner className="h-8 w-8 text-primary" />
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No excluded transactions</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedTransactions.size > 0 && selectedTransactions.size === filteredTransactions.length}
                              onCheckedChange={handleSelectAllTransactions}
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map(transaction => (
                          <TableRow 
                            key={transaction.id}
                            className={selectedTransactions.has(transaction.id) ? 'bg-primary/5' : ''}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={selectedTransactions.has(transaction.id)} 
                                onCheckedChange={() => handleSelectTransaction(transaction.id)}
                              />
                            </TableCell>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="max-w-[250px] truncate">
                                      {transaction.description}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{transaction.description}</p>
                                    {transaction.reference && <p className="text-xs text-muted-foreground">{transaction.reference}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatAmount(transaction.amount, transaction.type)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenReviewDialog(transaction)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <ArrowUpDown className="h-4 w-4 mr-2" />
                                      Restore
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Match Transaction Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Match Transaction</DialogTitle>
            <DialogDescription>
              Select an expense to match with this transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-5">
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="font-semibold mb-2">Transaction Details</h3>
                  {selectedTransaction && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Date:</span>
                          <span className="text-sm font-medium">{formatDate(selectedTransaction.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount:</span>
                          <span className={`text-sm font-medium ${selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Description:</span>
                          <p className="text-sm">{selectedTransaction.description}</p>
                        </div>
                        {selectedTransaction.reference && (
                          <div>
                            <span className="text-sm text-muted-foreground">Reference:</span>
                            <p className="text-sm">{selectedTransaction.reference}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="font-semibold mb-2">No Match Found?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you cannot find a matching expense, you can create a new expense from this transaction.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setShowMatchDialog(false);
                      setIsCreatingExpense(true);
                      // In a real app, this would navigate to the expense creation form
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Expense
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-7">
              <h3 className="font-semibold mb-2">Available Expense Matches</h3>
              
              {isLoadingExpenses ? (
                <div className="flex justify-center items-center py-12">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              ) : expenseMatches.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <p className="text-muted-foreground">No matching expenses found</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Match</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Conf.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseMatches.map(expense => (
                        <TableRow 
                          key={expense.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleMatchTransaction(expense.id)}
                        >
                          <TableCell>
                            <Button variant="ghost" size="sm">Select</Button>
                          </TableCell>
                          <TableCell>{formatDate(expense.date)}</TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="max-w-[200px] truncate">
                                    {expense.description}
                                    <div className="text-xs text-muted-foreground">{expense.vendor}</div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{expense.description}</p>
                                  <p className="text-xs text-muted-foreground">{expense.vendor}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            {formatAmount(expense.amount, 'debit')}
                          </TableCell>
                          <TableCell>
                            {getConfidenceBadge(expense.confidence)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Transaction Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Review and edit this transaction.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-6 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-date">Date</Label>
                    <div className="flex">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="transaction-date"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formatDate(selectedTransaction.date)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(selectedTransaction.date)}
                            onSelect={() => {}}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction-description">Description</Label>
                    <Input 
                      id="transaction-description"
                      defaultValue={selectedTransaction.description}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction-amount">Amount</Label>
                    <Input 
                      id="transaction-amount"
                      defaultValue={selectedTransaction.amount.toString()}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction-status">Status</Label>
                    <Select defaultValue={selectedTransaction.status}>
                      <SelectTrigger id="transaction-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmatched">Unmatched</SelectItem>
                        <SelectItem value="matched">Matched</SelectItem>
                        <SelectItem value="reconciled">Reconciled</SelectItem>
                        <SelectItem value="excluded">Excluded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction-category">Category</Label>
                    <Select defaultValue={selectedTransaction.category || 'uncategorized'}>
                      <SelectTrigger id="transaction-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                        {mockCategories.map(category => (
                          <SelectItem key={category.id} value={category.name.toLowerCase()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="col-span-12 md:col-span-6 space-y-4">
                <div className="rounded-md border p-4">
                  <h3 className="font-semibold mb-4">Matched Expense Details</h3>
                  {selectedTransaction.matchedExpenseId ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expense ID:</span>
                        <span className="text-sm font-medium">{selectedTransaction.matchedExpenseId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Match Confidence:</span>
                        <span className="text-sm font-medium">
                          {selectedTransaction.matchConfidence ? 
                            `${Math.round(selectedTransaction.matchConfidence * 100)}%` : 
                            'N/A'}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Expense
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No matched expense</p>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => {
                          setShowReviewDialog(false);
                          setShowMatchDialog(true);
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Match to Expense
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="rounded-md border p-4 space-y-4">
                  <h3 className="font-semibold">Additional Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction-ref">Reference</Label>
                    <Input 
                      id="transaction-ref"
                      defaultValue={selectedTransaction.reference || ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transaction-payee">Payee</Label>
                    <Input 
                      id="transaction-payee"
                      defaultValue={selectedTransaction.payee || ''}
                    />
                  </div>
                </div>
                
                <div className="rounded-md border p-4">
                  <h3 className="font-semibold mb-2">Transaction History</h3>
                  <div className="text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(selectedTransaction.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Modified:</span>
                      <span>{formatDate(selectedTransaction.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Synced:</span>
                      <span>{formatDate(selectedTransaction.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Enter details for a new transaction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-date">Date</Label>
              <div className="flex">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="add-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(), "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date()}
                      onSelect={() => {}}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Input 
                id="add-description"
                placeholder="Transaction description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-amount">Amount</Label>
              <Input 
                id="add-amount"
                placeholder="0.00"
                type="number"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-type">Type</Label>
              <Select defaultValue="debit">
                <SelectTrigger id="add-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (Incoming)</SelectItem>
                  <SelectItem value="debit">Debit (Outgoing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-category">Category</Label>
              <Select defaultValue="uncategorized">
                <SelectTrigger id="add-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {mockCategories.map(category => (
                    <SelectItem key={category.id} value={category.name.toLowerCase()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-reference">Reference (Optional)</Label>
              <Input 
                id="add-reference"
                placeholder="Transaction reference"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddDialog(false)}>
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Transaction Rules Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction Rules</DialogTitle>
            <DialogDescription>
              Create and manage rules for automatic transaction categorization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Active Rules</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </div>
            
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Auto</TableHead>
                    <TableHead className="text-right">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRules.map((rule, index) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {rule.appliedTo === 'all' ? 'All Accounts' : rule.appliedTo}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.conditions.map((condition, idx) => (
                          <div key={idx} className="text-sm">
                            {condition.field} {condition.operator} "{condition.value}"
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        {rule.actions.map((action, idx) => (
                          <div key={idx} className="text-sm">
                            Set {action.type} to {action.value}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <Switch checked={rule.autoConfirm} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rule History</h3>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Rules
              </Button>
            </div>
            
            <div className="rounded-md border p-4">
              <p className="text-center text-muted-foreground">
                Rules applied statistics and history will appear here.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reconcile Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reconcile Account</DialogTitle>
            <DialogDescription>
              Compare your bank statement with the recorded transactions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statement-balance">Statement Balance</Label>
                <Input id="statement-balance" placeholder="0.00" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statement-date">Statement Date</Label>
                <div className="flex">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="statement-date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(new Date(), "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date()}
                        onSelect={() => {}}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <h3 className="font-semibold">Account Summary</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedBankAccount?.name}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">Bank Balance</p>
                  <p className="text-lg font-semibold">
                    {selectedBankAccount ? formatAmount(selectedBankAccount.currentBalance, 'balance') : 'N/A'}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">Statement Balance</p>
                  <p className="text-lg font-semibold">€0.00</p>
                </div>
              </div>
              
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">Difference</p>
                <p className="text-lg font-semibold text-red-600">€0.00</p>
                <p className="text-xs text-muted-foreground">0 transactions unreconciled</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reconcile-notes">Notes</Label>
              <Input id="reconcile-notes" placeholder="Add notes about this reconciliation" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReconcileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowReconcileDialog(false)}>
              Complete Reconciliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Banking Providers Dialog */}
      {showManageProviders && (
        <BankingProviders 
          open={showManageProviders} 
          onOpenChange={setShowManageProviders}
          vesselId={vesselId}
        />
      )}
    </div>
  );
};

export default TransactionReconciliation;