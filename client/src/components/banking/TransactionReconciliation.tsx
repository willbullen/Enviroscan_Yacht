import React, { useState } from 'react';
import { Check, Filter, RefreshCw, Search, AlertCircle, FileCheck, Link as LinkIcon, FileInput, Plus, Pencil, X, ArrowUpDown, Download, Eye, Upload, ChevronDown, Building2, Clock, CreditCard, ListChecks, MoreHorizontal, Link2, FileSpreadsheet, Calendar as CalendarIcon, Settings } from 'lucide-react';
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
      date: transaction.transactionDate || transaction.createdAt,
      description: transaction.description || 'No description',
      amount: parseFloat(transaction.amount),
      type: parseFloat(transaction.amount) >= 0 ? 'credit' : 'debit',
      status: 'unmatched', // Default status until we implement reconciliation
      matchedExpenseId: null,
      matchConfidence: null,
      provider: 'Bank', // Default provider until we implement provider tracking
      category: transaction.transactionType || 'Uncategorized',
      payee: null,
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
      transactionsCount: bankingTransactions.filter(t => String(t.providerId) === String(connection.providerId)).length,
      provider: connection.providerName || 'Unknown Provider'
    }));
  }, [bankConnections, bankingTransactions]);
  
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
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Transactions list and filters card */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Banking Transactions</CardTitle>
              <div className="flex gap-2 items-center">
                <div className="flex items-center space-x-2">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {dateFilter.from ? (
                          dateFilter.to ? (
                            <>
                              {format(dateFilter.from, "LLL dd, y")} - {format(dateFilter.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateFilter.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateFilter.from}
                        selected={{ from: dateFilter.from, to: dateFilter.to }}
                        onSelect={(range) => {
                          setDateFilter({ from: range?.from, to: range?.to });
                          setCalendarOpen(false);
                        }}
                        numberOfMonths={2}
                      />
                      <div className="flex items-center justify-end gap-2 p-3 border-t">
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
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Transaction Filters</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <div className="p-2">
                        <p className="mb-2 text-sm font-medium">Status</p>
                        <Select
                          value={statusFilter}
                          onValueChange={(value) => setStatusFilter(value as any)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by status" />
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
                      
                      <div className="p-2">
                        <p className="mb-2 text-sm font-medium">Type</p>
                        <Select
                          value={typeFilter}
                          onValueChange={(value) => setTypeFilter(value as any)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="credit">Credits</SelectItem>
                            <SelectItem value="debit">Debits</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="p-2">
                        <p className="mb-2 text-sm font-medium">Provider</p>
                        <Select
                          value={providerFilter}
                          onValueChange={(value) => setProviderFilter(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by provider" />
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
                          }}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <div className="relative w-48 md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                      className="pl-8"
                    />
                    {searchValue && (
                      <X
                        className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer"
                        onClick={() => setSearchValue('')}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Tabs defaultValue="for-review" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger 
                  value="for-review" 
                  onClick={() => setActiveView('for-review')}
                  className="flex items-center justify-center gap-1.5"
                >
                  <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">{transformedTransactions.filter(t => t.status === 'unmatched').length}</Badge>
                  For Review
                </TabsTrigger>
                <TabsTrigger 
                  value="categorized" 
                  onClick={() => setActiveView('categorized')}
                  className="flex items-center justify-center gap-1.5"
                >
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">{transformedTransactions.filter(t => t.status === 'matched' || t.status === 'reconciled').length}</Badge>
                  Categorized
                </TabsTrigger>
                <TabsTrigger 
                  value="excluded" 
                  onClick={() => setActiveView('excluded')}
                  className="flex items-center justify-center gap-1.5"
                >
                  <Badge variant="outline" className="bg-gray-50 border-gray-200">{transformedTransactions.filter(t => t.status === 'excluded').length}</Badge>
                  Excluded
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="for-review" className="pt-2">
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={filteredTransactions.length > 0 && 
                                  filteredTransactions.every(t => selectedTransactions.has(t.id))}
                                onCheckedChange={handleSelectAllTransactions}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1.5">
                                Date
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1.5">
                                Amount
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4">
                                <p className="text-muted-foreground">No transactions match the current filters</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredTransactions.map((transaction, index) => (
                              <TableRow key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedTransactions.has(transaction.id)}
                                    onCheckedChange={() => handleSelectTransaction(transaction.id)}
                                    aria-label={`Select transaction ${transaction.id}`}
                                  />
                                </TableCell>
                                <TableCell>{formatDate(transaction.date)}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{transaction.description}</span>
                                    {transaction.payee && <span className="text-xs text-muted-foreground">{transaction.payee}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className={transaction.type === 'credit' ? 'text-green-600 font-medium' : ''}>
                                  {formatAmount(transaction.amount, transaction.type)}
                                </TableCell>
                                <TableCell>
                                  {transaction.status === 'matched' && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Matched</Badge>
                                  )}
                                  {transaction.status === 'unmatched' && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Unmatched</Badge>
                                  )}
                                  {transaction.status === 'reconciled' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Reconciled</Badge>
                                  )}
                                  {transaction.status === 'excluded' && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Excluded</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{transaction.provider}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {transaction.status === 'unmatched' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" onClick={() => handleOpenMatchDialog(transaction)}>
                                              <Link2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Match to expense</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    
                                    {transaction.status === 'matched' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" onClick={() => handleOpenReviewDialog(transaction)}>
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Review match</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => alert(`Edit ${transaction.id}`)}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => alert(`Download ${transaction.id}`)}>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => alert(`Exclude ${transaction.id}`)}>
                                          <X className="h-4 w-4 mr-2" />
                                          Exclude Transaction
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="categorized" className="pt-2">
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={filteredTransactions.length > 0 && 
                                  filteredTransactions.every(t => selectedTransactions.has(t.id))}
                                onCheckedChange={handleSelectAllTransactions}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1.5">
                                Date
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1.5">
                                Amount
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4">
                                <p className="text-muted-foreground">No categorized transactions match the current filters</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredTransactions.map((transaction, index) => (
                              <TableRow key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedTransactions.has(transaction.id)}
                                    onCheckedChange={() => handleSelectTransaction(transaction.id)}
                                    aria-label={`Select transaction ${transaction.id}`}
                                  />
                                </TableCell>
                                <TableCell>{formatDate(transaction.date)}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{transaction.description}</span>
                                    {transaction.reference && <span className="text-xs text-muted-foreground">{transaction.reference}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className={transaction.type === 'credit' ? 'text-green-600 font-medium' : ''}>
                                  {formatAmount(transaction.amount, transaction.type)}
                                </TableCell>
                                <TableCell>{transaction.category}</TableCell>
                                <TableCell>
                                  {transaction.status === 'matched' && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Matched</Badge>
                                  )}
                                  {transaction.status === 'reconciled' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Reconciled</Badge>
                                  )}
                                  {transaction.matchConfidence && (
                                    <div className="mt-1">
                                      {getConfidenceBadge(transaction.matchConfidence)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="outline" size="icon" onClick={() => handleOpenReviewDialog(transaction)}>
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Review match</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => alert('Mark as reconciled')}>
                                          <Check className="h-4 w-4 mr-2" />
                                          Mark Reconciled
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => alert('Unmatch transaction')}>
                                          <Link2 className="h-4 w-4 mr-2 text-red-500" />
                                          Unmatch
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => alert(`Exclude ${transaction.id}`)}>
                                          <X className="h-4 w-4 mr-2" />
                                          Exclude Transaction
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="excluded" className="pt-2">
                <Card>
                  <CardContent className="p-0">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-10">
                              <Checkbox
                                checked={filteredTransactions.length > 0 && 
                                  filteredTransactions.every(t => selectedTransactions.has(t.id))}
                                onCheckedChange={handleSelectAllTransactions}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1.5">
                                Date
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>
                              <div className="flex items-center gap-1.5">
                                Amount
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                <p className="text-muted-foreground">No excluded transactions match the current filters</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredTransactions.map((transaction, index) => (
                              <TableRow key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedTransactions.has(transaction.id)}
                                    onCheckedChange={() => handleSelectTransaction(transaction.id)}
                                    aria-label={`Select transaction ${transaction.id}`}
                                  />
                                </TableCell>
                                <TableCell>{formatDate(transaction.date)}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={transaction.description}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{transaction.description}</span>
                                    {transaction.reference && <span className="text-xs text-muted-foreground">{transaction.reference}</span>}
                                  </div>
                                </TableCell>
                                <TableCell className={transaction.type === 'credit' ? 'text-green-600 font-medium' : ''}>
                                  {formatAmount(transaction.amount, transaction.type)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{transaction.provider}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="outline" size="sm" onClick={() => alert('Restore transaction')}>
                                    Restore
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
      
      {/* Transaction Match Dialog */}
      {selectedTransaction && (
        <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Match Transaction</DialogTitle>
              <DialogDescription>
                Match this transaction to an existing expense or create a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <div className="mb-4 p-3 rounded-md bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(selectedTransaction.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className={`font-medium ${selectedTransaction.type === 'credit' ? 'text-green-600' : ''}`}>
                      {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedTransaction.description}</p>
                </div>
                {selectedTransaction.payee && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-muted-foreground">Payee</p>
                    <p className="font-medium">{selectedTransaction.payee}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-base font-semibold mb-2">Suggested Matches</h3>
                {mockExpenseMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matching expenses found.</p>
                ) : (
                  <div className="space-y-2">
                    {mockExpenseMatches.map(expense => (
                      <div 
                        key={expense.id} 
                        className="p-3 border rounded-md cursor-pointer hover:border-primary hover:bg-muted/20"
                        onClick={() => handleMatchTransaction(expense.id)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium">{expense.description}</p>
                          {getConfidenceBadge(expense.confidence)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <p>{formatDate(expense.date)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p>{formatAmount(expense.amount, 'debit')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Category</p>
                            <p>{expense.category}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  setIsCreatingExpense(true);
                  // In a real app this would open a form to create a new expense
                  setTimeout(() => {
                    setIsCreatingExpense(false);
                    setShowMatchDialog(false);
                    alert('New expense created and matched');
                  }, 1000);
                }}
              >
                {isCreatingExpense ? <Spinner className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                Create New Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Banking Providers Dialog */}
      <Dialog open={showManageProviders} onOpenChange={setShowManageProviders}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <BankingProviders
            vesselId={vesselId}
            onClose={() => setShowManageProviders(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Review Match Dialog */}
      {selectedTransaction && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Review Match</DialogTitle>
              <DialogDescription>
                Review the matched transaction and expense details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-3 rounded-md bg-muted/50 relative">
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Transaction</Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 mt-4">Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(selectedTransaction.date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className={`font-medium ${selectedTransaction.type === 'credit' ? 'text-green-600' : ''}`}>
                        {formatAmount(selectedTransaction.amount, selectedTransaction.type)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedTransaction.description}</p>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-medium">{selectedTransaction.reference || '—'}</p>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Provider</p>
                    <p className="font-medium">{selectedTransaction.provider}</p>
                  </div>
                </div>
                
                <div className="p-3 rounded-md bg-muted/50 relative">
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Expense</Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-2 mt-4">Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">May 2, 2025</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount</p>
                      <p className="font-medium">€8,750.50</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Description</p>
                    <p className="font-medium">Port de Monaco - Berth Fees May 2025</p>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Vendor</p>
                    <p className="font-medium">Port de Monaco</p>
                  </div>
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">Docking</p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-md bg-green-50 p-3 border border-green-100 text-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-2">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Match Confidence: 92%</p>
                    <p className="text-green-700 mt-0.5">
                      This transaction appears to match the expense based on date, amount, and description similarities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setShowReviewDialog(false);
                alert('Match removed');
              }}>
                <X className="mr-2 h-4 w-4" />
                Remove Match
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => {
                  setShowReviewDialog(false);
                  alert('Match confirmed');
                }}>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Match
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TransactionReconciliation;