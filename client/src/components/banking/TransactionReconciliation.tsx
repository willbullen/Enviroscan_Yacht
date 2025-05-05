import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';
import {
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CreditCard,
  ArrowDownUp,
  Link2,
  Unlink,
  AlertCircle,
  FileCheck,
  DownloadCloud,
  ReceiptText,
  ChevronDown,
  Check,
  X,
  Eye,
  Edit,
  FileSpreadsheet
} from 'lucide-react';

interface TransactionReconciliationProps {
  vesselId: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'matched' | 'unmatched' | 'pending' | 'reconciled';
  provider: 'centtrip' | 'revolut';
  category?: string;
  matchedExpenseId?: number;
  reference?: string;
}

export const TransactionReconciliation: React.FC<TransactionReconciliationProps> = ({ vesselId }) => {
  const { useLiveBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days'>('30days');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'centtrip' | 'revolut'>('all');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mock transactions - in a real app these would come from an API call
  const mockTransactions: Transaction[] = [
    {
      id: 'txn-1',
      date: '2025-05-01',
      description: 'Fuel purchase - Mediterranean Yacht Services',
      amount: 8750.50,
      type: 'debit',
      status: 'matched',
      provider: 'centtrip',
      category: 'Fuel',
      matchedExpenseId: 1234,
      reference: 'INV-20250501'
    },
    {
      id: 'txn-2',
      date: '2025-05-02',
      description: 'Docking fees - Port de Monaco',
      amount: 12500.00,
      type: 'debit',
      status: 'unmatched',
      provider: 'centtrip',
      reference: 'DOCK-5578'
    },
    {
      id: 'txn-3',
      date: '2025-05-03',
      description: 'Crew payroll payment',
      amount: 28750.00,
      type: 'debit',
      status: 'reconciled',
      provider: 'revolut',
      category: 'Crew',
      matchedExpenseId: 1235,
      reference: 'PAYROLL-MAY-W1'
    },
    {
      id: 'txn-4',
      date: '2025-05-03',
      description: 'Maintenance supplies - Marine Tech',
      amount: 3245.75,
      type: 'debit',
      status: 'pending',
      provider: 'revolut',
      reference: 'MT-3456-89'
    },
    {
      id: 'txn-5',
      date: '2025-05-04',
      description: 'Charter payment received',
      amount: 75000.00,
      type: 'credit',
      status: 'unmatched',
      provider: 'centtrip',
      reference: 'CHARTER-0554'
    },
    {
      id: 'txn-6',
      date: '2025-04-29',
      description: 'Insurance premium - Maritime Insurance Ltd',
      amount: 8500.00,
      type: 'debit',
      status: 'matched',
      provider: 'revolut',
      category: 'Insurance',
      matchedExpenseId: 1236,
      reference: 'INS-POL-23445'
    },
    {
      id: 'txn-7',
      date: '2025-04-28',
      description: 'Catering services - Luxury Yacht Provisions',
      amount: 4250.00,
      type: 'debit',
      status: 'unmatched',
      provider: 'centtrip',
      reference: 'LYP-4589'
    },
    {
      id: 'txn-8',
      date: '2025-04-27',
      description: 'Mechanical repairs - Marine Engineers',
      amount: 15750.25,
      type: 'debit',
      status: 'pending',
      provider: 'revolut',
      reference: 'ME-REP-7788'
    }
  ];

  // Filter transactions based on search, tab, date range, and provider
  const filteredTransactions = mockTransactions.filter(transaction => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    const matchesTab = 
      selectedTab === 'all' || 
      (selectedTab === 'unmatched' && transaction.status === 'unmatched') ||
      (selectedTab === 'matched' && transaction.status === 'matched') ||
      (selectedTab === 'reconciled' && transaction.status === 'reconciled') ||
      (selectedTab === 'pending' && transaction.status === 'pending');
    
    // Date filter (simplified for demo)
    const txnDate = new Date(transaction.date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const matchesDateRange = 
      dateRange === 'all' || 
      (dateRange === '7days' && daysDiff <= 7) ||
      (dateRange === '30days' && daysDiff <= 30) ||
      (dateRange === '90days' && daysDiff <= 90);
    
    // Provider filter
    const matchesProvider = 
      selectedProvider === 'all' || 
      transaction.provider === selectedProvider;
    
    return matchesSearch && matchesTab && matchesDateRange && matchesProvider;
  });

  const handleSyncTransactions = () => {
    setIsSyncing(true);
    // Simulate API call
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  const handleExportTransactions = () => {
    // In a real app, this would download a CSV or Excel file
    alert('Exporting transactions...');
  };

  const handleToggleAllTransactions = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleToggleTransaction = (id: string) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(txnId => txnId !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };

  const handleBulkReconcile = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Reset selection after action
      setSelectedTransactions([]);
    }, 1500);
  };

  const formatAmount = (amount: number, type: 'credit' | 'debit') => {
    return `${type === 'credit' ? '+' : '-'}$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getStatusBadgeProps = (status: Transaction['status']) => {
    switch (status) {
      case 'matched':
        return { variant: 'outline' as const, className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'unmatched':
        return { variant: 'outline' as const, className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'reconciled':
        return { variant: 'outline' as const, className: 'bg-green-50 text-green-700 border-green-200' };
      case 'pending':
        return { variant: 'outline' as const, className: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { variant: 'outline' as const };
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'matched':
        return <Link2 className="h-3.5 w-3.5 mr-1" />;
      case 'unmatched':
        return <Unlink className="h-3.5 w-3.5 mr-1" />;
      case 'reconciled':
        return <Check className="h-3.5 w-3.5 mr-1" />;
      case 'pending':
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      default:
        return null;
    }
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction Reconciliation</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportTransactions}
            className="h-9"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={handleSyncTransactions}
            disabled={isSyncing}
            className="h-9"
          >
            {isSyncing ? (
              <>
                <Spinner size="xs" className="mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <DownloadCloud className="h-4 w-4 mr-2" />
                Sync Transactions
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Select
            defaultValue={dateRange}
            onValueChange={(value) => setDateRange(value as any)}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue={selectedProvider}
            onValueChange={(value) => setSelectedProvider(value as any)}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <CreditCard className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              <SelectItem value="centtrip">Centtrip</SelectItem>
              <SelectItem value="revolut">Revolut</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          {selectedTransactions.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedTransactions.length} selected
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkReconcile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="xs" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Reconcile
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="relative">
            All
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockTransactions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unmatched">
            Unmatched
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockTransactions.filter(t => t.status === 'unmatched').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="matched">
            Matched
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockTransactions.filter(t => t.status === 'matched').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reconciled">
            Reconciled
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockTransactions.filter(t => t.status === 'reconciled').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockTransactions.filter(t => t.status === 'pending').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          onCheckedChange={handleToggleAllTransactions}
                          checked={
                            filteredTransactions.length > 0 &&
                            selectedTransactions.length === filteredTransactions.length
                          }
                        />
                      </TableHead>
                      <TableHead className="w-32">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-32 text-right">Amount</TableHead>
                      <TableHead className="w-32">Provider</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-32 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedTransactions.includes(transaction.id)}
                              onCheckedChange={() => handleToggleTransaction(transaction.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.reference && (
                              <div className="text-xs text-muted-foreground">
                                Ref: {transaction.reference}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.type === 'credit' ? 'text-green-600' : ''
                          }`}>
                            {formatAmount(transaction.amount, transaction.type)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.provider === 'centtrip' ? 'Centtrip' : 'Revolut'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge {...getStatusBadgeProps(transaction.status)}>
                              {getStatusIcon(transaction.status)}
                              <span className="capitalize">{transaction.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center space-x-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {transaction.status !== 'reconciled' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Link2 className="h-4 w-4" />
                                </Button>
                              )}
                              {transaction.status === 'matched' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {transaction.status === 'matched' && transaction.matchedExpenseId && (
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ReceiptText className="h-4 w-4" />
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!useLiveBankingData && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Using Test Data</AlertTitle>
          <AlertDescription>
            You're viewing simulated transaction data. To see real transactions, enable live banking data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TransactionReconciliation;