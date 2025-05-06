import React, { useState } from 'react';
import { Check, Filter, RefreshCw, Search, AlertCircle, FileCheck, Link as LinkIcon, FileInput, Plus, Pencil, X, ArrowUpDown, Download, Eye, Upload, ChevronDown, Building2, Clock, CreditCard, ListChecks, MoreHorizontal, Link2, FileSpreadsheet, Calendar as CalendarIcon } from 'lucide-react';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  
  // Mock bank accounts data
  const mockBankAccounts: BankAccount[] = [
    {
      id: 'bank-001',
      name: 'Current Account',
      currentBalance: 87467.84,
      lastSync: '2025-05-05T12:00:00Z',
      transactionsCount: 267,
      provider: 'Allied Irish Banks'
    },
    {
      id: 'bank-002',
      name: 'Expense Account',
      currentBalance: 12500.35,
      lastSync: '2025-05-05T11:30:00Z',
      transactionsCount: 124,
      provider: 'Revolut'
    },
    {
      id: 'bank-003',
      name: 'Payroll Account',
      currentBalance: 45000.00,
      lastSync: '2025-05-04T15:00:00Z',
      transactionsCount: 42,
      provider: 'Centtrip'
    }
  ];
  
  // Set default selected bank account
  React.useEffect(() => {
    if (mockBankAccounts.length > 0 && !selectedBankAccount) {
      setSelectedBankAccount(mockBankAccounts[0]);
    }
  }, []);
  
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
      payee: 'Monaco Yacht Services',
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
      payee: 'Port de Monaco',
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
      payee: 'Crew Payroll',
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
      payee: 'Owner',
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
      payee: 'Maritime Supplies Ltd',
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
      payee: 'Charter Client',
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
      payee: 'Maritime Insurance Co.',
      reference: 'INS-2025-Q2'
    },
    {
      id: 't-008',
      date: '2025-05-05T14:30:00Z',
      description: 'Fuel Top-Up XXXXXXXXX232',
      amount: 8750.00,
      type: 'debit',
      status: 'unmatched',
      provider: 'Centtrip',
      payee: 'Marina Fuel Services',
      reference: 'FUEL-232-2025'
    },
    {
      id: 't-009',
      date: '2025-05-06T09:15:00Z',
      description: 'Crew Uniform Purchase',
      amount: 4250.50,
      type: 'debit',
      status: 'excluded',
      provider: 'Revolut',
      payee: 'Maritime Apparel',
      reference: 'UNI-2025-045'
    },
    {
      id: 't-010',
      date: '2025-05-06T11:00:00Z',
      description: 'MOBI ACCOUNTANT MOBI ACCOUNT',
      amount: 1756.50,
      type: 'debit',
      status: 'unmatched',
      provider: 'Centtrip',
      payee: 'Accounting Services',
      reference: 'ACC-2025-042'
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
    } else if (activeView === 'excluded') {
      return transactions.filter(t => t.status === 'excluded');
    }
    return transactions;
  };
  
  // Apply filters to transactions
  const filteredTransactions = getStatusFilteredTransactions(mockTransactions)
    .filter(transaction => {
      // Text search filter
      const searchMatch = !searchValue || 
        transaction.description.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.provider.toLowerCase().includes(searchValue.toLowerCase()) ||
        transaction.payee?.toLowerCase().includes(searchValue.toLowerCase());
      
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
  
  const handleOpenReviewDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReviewDialog(true);
  };

  const handleOpenAddDialog = () => {
    setShowAddDialog(true);
  };

  const handleOpenReconcileDialog = () => {
    setShowReconcileDialog(true);
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
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
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
      case 'excluded':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
            <X className="h-3.5 w-3.5 mr-1.5" />
            Excluded
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
      {/* Transaction Reconciliation Header Section - Compact Version */}
      <div className="space-y-3">
        {/* Account Selector Dropdown */}
        <div className="relative">
          <Select
            value={selectedBankAccount?.id || ''}
            onValueChange={(value) => {
              const account = mockBankAccounts.find(a => a.id === value);
              if (account) setSelectedBankAccount(account);
            }}
          >
            <SelectTrigger className="w-full bg-white border">
              <SelectValue placeholder="Select account">
                {selectedBankAccount ? (
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-primary" />
                    <div>
                      <span className="font-medium">{selectedBankAccount.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({selectedBankAccount.provider})
                      </span>
                    </div>
                  </div>
                ) : (
                  <span>Select a bank account</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {mockBankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-primary" />
                      <div>
                        <span className="font-medium">{account.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({account.provider})
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium">
                      ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Account Summary and Actions */}
        {selectedBankAccount && (
          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-3 flex items-center bg-white border rounded-md p-2">
              <div className="mr-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="font-semibold">${selectedBankAccount.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            
            <div className="col-span-3 flex items-center bg-white border rounded-md p-2">
              <div className="mr-3">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Transactions</div>
                <div className="font-semibold">
                  {selectedBankAccount.transactionsCount} 
                  <span className="text-xs text-orange-500 ml-1">
                    ({Math.round(selectedBankAccount.transactionsCount * 0.15)} for review)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="col-span-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenReconcileDialog}
                className="w-full"
              >
                <FileCheck className="h-4 w-4 mr-1.5" />
                Reconcile
              </Button>
            </div>
            
            <div className="col-span-2">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Upload
              </Button>
            </div>
            
            <div className="col-span-2 flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshTransactions}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Spinner size="xs" className="mr-1.5" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Refresh
                  </>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {}}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Manage connections
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Go to bank register
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSyncBankingData} disabled={isSyncingData}>
                    <Download className="h-4 w-4 mr-2" />
                    Sync Banking Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Tabs + Action Buttons */}
      <div className="flex justify-between items-center">
        <Tabs value={activeView} className="w-full" onValueChange={(value) => setActiveView(value as any)}>
          <TabsList className="bg-slate-100 p-0 h-9">
            <TabsTrigger 
              value="for-review" 
              className={`rounded-none border-b-2 ${activeView === 'for-review' ? 'border-blue-600' : 'border-transparent'}`}
            >
              For review ({mockTransactions.filter(t => t.status === 'unmatched').length})
            </TabsTrigger>
            <TabsTrigger 
              value="categorized" 
              className={`rounded-none border-b-2 ${activeView === 'categorized' ? 'border-blue-600' : 'border-transparent'}`}
            >
              Categorized
            </TabsTrigger>
            <TabsTrigger 
              value="excluded" 
              className={`rounded-none border-b-2 ${activeView === 'excluded' ? 'border-blue-600' : 'border-transparent'}`}
            >
              Excluded
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleOpenAddDialog}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {}}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Update
          </Button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description, cheque number, or amount..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                size="sm"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateFilter.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter.from ? (
                  dateFilter.to ? (
                    <>
                      {format(dateFilter.from, "LLL dd, y")} - {format(dateFilter.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateFilter.from, "LLL dd, y")
                  )
                ) : (
                  "All dates"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="border-b p-3">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      setDateFilter({ from: yesterday, to: today });
                    }}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const sevenDaysAgo = new Date(today);
                      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                      setDateFilter({ from: sevenDaysAgo, to: today });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date(today);
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      setDateFilter({ from: thirtyDaysAgo, to: today });
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setDateFilter({})}
                  >
                    All time
                  </Button>
                </div>
              </div>
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateFilter.from}
                selected={{ from: dateFilter.from, to: dateFilter.to }}
                onSelect={(range) => setDateFilter(range || {})}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Transaction Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
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
                  <SelectItem value="all">All transactions</SelectItem>
                  <SelectItem value="credit">Money in</SelectItem>
                  <SelectItem value="debit">Money out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                  <SelectItem value="reconciled">Reconciled</SelectItem>
                  <SelectItem value="excluded">Excluded</SelectItem>
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
      
      {/* Selected Transactions Action Bar */}
      {selectedTransactions.size > 0 && (
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
          <span className="text-sm font-medium">
            {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              Batch actions
            </Button>
            <Select>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="categorize">Categorize</SelectItem>
                <SelectItem value="exclude">Exclude</SelectItem>
                <SelectItem value="include">Include</SelectItem>
              </SelectContent>
            </Select>
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
      
      {/* Transactions Table */}
      <div className="rounded-md border overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b">
              <TableHead className="w-[40px] py-2">
                <Checkbox
                  checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                  onCheckedChange={handleSelectAllTransactions}
                  aria-label="Select all transactions"
                />
              </TableHead>
              <TableHead className="py-2 text-xs font-semibold">DATE</TableHead>
              <TableHead className="py-2 text-xs font-semibold">DESCRIPTION</TableHead>
              <TableHead className="py-2 text-xs font-semibold">PAYEE</TableHead>
              <TableHead className="py-2 text-xs font-semibold">CATEGORY OR MATCH</TableHead>
              <TableHead className="py-2 text-xs font-semibold">TAX</TableHead>
              <TableHead className="py-2 text-xs font-semibold text-right">SPENT</TableHead>
              <TableHead className="py-2 text-xs font-semibold text-right">RECEIVED</TableHead>
              <TableHead className="py-2 text-xs font-semibold text-right">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileInput className="h-8 w-8 mb-1" />
                    <p>No transactions found</p>
                    <p className="text-sm">Try adjusting your filters or sync with your banking provider</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <TableRow 
                  key={transaction.id} 
                  className={`hover:bg-slate-50 border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                >
                  <TableCell className="py-2">
                    <Checkbox
                      checked={selectedTransactions.has(transaction.id)}
                      onCheckedChange={() => handleSelectTransaction(transaction.id)}
                      aria-label={`Select transaction ${transaction.description}`}
                    />
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="text-sm">{transaction.description}</div>
                    {transaction.reference && (
                      <div className="text-xs text-muted-foreground">{transaction.reference}</div>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-sm">
                    {transaction.payee || (
                      <span className="text-blue-600 hover:underline cursor-pointer">Add payee</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center space-x-2">
                      {transaction.status === 'matched' || transaction.status === 'reconciled' ? (
                        <Badge variant="outline" className={
                          transaction.status === 'reconciled' 
                            ? "bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5" 
                            : "bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5"
                        }>
                          {transaction.category || 'Uncategorized'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {transaction.type === 'debit' ? 'Uncategorized expense' : 'Uncategorized income'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="text-xs text-gray-500">No VAT</div>
                  </TableCell>
                  <TableCell className="py-2 text-right font-medium text-sm">
                    {transaction.type === 'debit' ? formatAmount(transaction.amount, transaction.type) : ''}
                  </TableCell>
                  <TableCell className="py-2 text-right font-medium text-sm">
                    {transaction.type === 'credit' ? formatAmount(transaction.amount, transaction.type) : ''}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-sm font-semibold h-7 px-2.5"
                      onClick={() => 
                        transaction.status === 'unmatched' 
                          ? handleOpenReviewDialog(transaction) 
                          : handleOpenMatchDialog(transaction)
                      }
                    >
                      {transaction.status === 'unmatched' ? 'Add' : 'Edit'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Add pagination control at the bottom */}
        <div className="p-2 border-t flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing {Math.min(filteredTransactions.length, 10)} of {filteredTransactions.length} transactions
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <span>1</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span>2</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span>3</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span>...</span>
            </Button>
          </div>
        </div>
      </div>
      
      {useMockBankingData && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertTitle>Using Test Data</AlertTitle>
          <AlertDescription>
            You're viewing simulated transaction data. Toggle to live mode in settings to use actual banking data.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Review Transaction Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review your transaction</DialogTitle>
            <DialogDescription>
              Select a transaction to review the category and other info.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-center">
                <span>Step 2 of 5</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Back</Button>
                  <Button size="sm">Next</Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div>
                  <Label>Transaction Type</Label>
                  <Select defaultValue="expense">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                      <SelectItem value="add-new">+ Add new category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Payee</Label>
                  <Select defaultValue={selectedTransaction.payee || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="(Recommended)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={selectedTransaction.payee || ''}>
                        {selectedTransaction.payee || '(Recommended)'}
                      </SelectItem>
                      <SelectItem value="add-new">+ Add new payee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tax</Label>
                  <Select defaultValue="no-vat">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-vat">(Optional)</SelectItem>
                      <SelectItem value="standard">Standard rate (20%)</SelectItem>
                      <SelectItem value="reduced">Reduced rate (5%)</SelectItem>
                      <SelectItem value="zero">Zero rate (0%)</SelectItem>
                      <SelectItem value="exempt">Exempt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <Input placeholder="Start typing to add a tag" />
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Switch id="auto-add" />
                        <Label htmlFor="auto-add" className="ml-2 text-sm cursor-pointer">Auto-add</Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">
                        Automatically confirm transactions this rule applies to
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
                  <Button onClick={() => setShowReviewDialog(false)}>Save</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a transaction</DialogTitle>
            <DialogDescription>
              After you input the details, the transaction will be added to your bank records
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label>Date</Label>
              <div className="flex items-center mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(), "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Input placeholder="Enter transaction description" />
            </div>
            
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            
            <div>
              <Label>Type</Label>
              <Select defaultValue="expense">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {mockCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowAddDialog(false)}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reconcile Dialog */}
      <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reconcile</DialogTitle>
            <DialogDescription>
              Which account do you want to reconcile?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-2 block">Account</Label>
              <Select defaultValue={selectedBankAccount?.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockBankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block mb-2">Add the following information*</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Beginning balance</Label>
                  <Input type="number" placeholder="0.00" defaultValue="0.00" />
                </div>
                <div>
                  <Label className="text-xs">Statement ending balance</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Statement ending date</Label>
              <div className="flex items-center mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Select a date
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <Label className="block mb-2">Enter the service charge or interest earned, if necessary</Label>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-9">
                          <Calendar className="mr-2 h-3 w-3" />
                          Select
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">Service charge</Label>
                    <Input type="number" placeholder="0.00" className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Expense account</Label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Bank Charges" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank-charges">Bank Charges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-9">
                          <Calendar className="mr-2 h-3 w-3" />
                          Select
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-xs">Interest earned</Label>
                    <Input type="number" placeholder="0.00" className="h-9" />
                  </div>
                  <div>
                    <Label className="text-xs">Income account</Label>
                    <Select>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Interest Income" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interest-income">Interest Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button className="w-full" onClick={() => setShowReconcileDialog(false)}>
                Start reconciling
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Match Transaction Dialog */}
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
                    {mockExpenseMatches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                          No suggested matches found. Create a new expense from this transaction.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="outline"
                className="w-full max-w-md"
                onClick={() => {
                  setShowMatchDialog(false);
                  setIsCreatingExpense(true);
                  setShowReviewDialog(true);
                }}
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