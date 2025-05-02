import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
// Importing all required dropdown components
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MainLayout from "@/components/layout/MainLayout";
import ViewToggle, { ViewMode } from "@/components/ui/view-toggle";
import BatchImportDialog from "@/components/BatchImportDialog";
import CashFlowTrendsChart from "@/components/financial/CashFlowTrendsChart";
import { useVessel } from "@/contexts/VesselContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card as TremorCard,
  Text,
  Metric,
  CategoryBar,
  DonutChart,
  BarChart,
  ProgressBar,
  LineChart,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Grid,
  Col
} from "@tremor/react";
import {
  PieChart,
  Pie,
  ResponsiveContainer, 
  Cell, 
  Legend,
  Tooltip as RechartsTooltip,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { 
  AlertCircle,
  Banknote,
  CheckCircle,
  DollarSign, 
  Wallet, 
  CreditCard, 
  FileText, 
  BarChart4, 
  Calendar, 
  Plus, 
  Building, 
  ChevronDown,
  Receipt, 
  Users, 
  Ship,
  Pencil,
  ListTree,
  FileUp,
  Trash,
  Euro,
  Calculator,
  ChevronRight,
  Download,
  Upload,
  X,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const FinancialManagement: React.FC = () => {
  // State for view toggle (Card/Grid vs Table view)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARDS);
  const [activeTab, setActiveTab] = useState("accounts");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Dialog states for adding new items
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  
  // State for currently editing item
  const [editingAccount, setEditingAccount] = useState<any>(null);
  
  // State for cash flow chart
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("12months");
  
  // Get current vessel from context to filter financial data
  const { currentVessel } = useVessel();
  
  // Load vessel-specific financial data
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions', currentVessel?.id],
    enabled: !!currentVessel?.id
  });
  
  // Load journal entries - fetch transactions of type 'journal'
  const { data: journals, isLoading: journalsLoading } = useQuery({
    queryKey: ['/api/transactions', 'journal', currentVessel?.id],
    queryFn: () => {
      if (!currentVessel?.id) return Promise.resolve([]);
      return fetch(`/api/transactions/vessel/${currentVessel.id}?type=journal`)
        .then(res => res.json())
        .catch(err => {
          console.error("Error fetching journal entries:", err);
          return [];
        });
    },
    enabled: !!currentVessel?.id
  });
  
  // Load vessel accounts - need vessel ID parameter in URL
  const { 
    data: accounts, 
    isLoading: accountsLoading,
    refetch: refetchAccounts 
  } = useQuery({
    queryKey: ['/api/financial-accounts/vessel', currentVessel?.id],
    queryFn: () => currentVessel?.id ? fetch(`/api/financial-accounts/vessel/${currentVessel.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!currentVessel?.id
  });

  // Additional states and dialogs
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showBankingDialog, setShowBankingDialog] = useState(false);
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showGenericDialog, setShowGenericDialog] = useState(false);
  
  // Helper function to ensure UI updates after account changes
  const refreshFinancialAccounts = async () => {
    // Force a refresh of the accounts list
    await refetchAccounts();
  };
  
  // Handle dialog opening for different actions based on the active tab
  const handleAddNew = () => {
    switch(activeTab) {
      case "accounts":
        setEditingAccount(null);
        setShowAccountDialog(true);
        break;
      case "expenses":
        setShowExpenseDialog(true);
        break;
      case "budgets":
        setShowBudgetDialog(true);
        break;
      case "deposits":
        setShowDepositDialog(true);
        break;
      case "banking":
        setShowBankingDialog(true);
        break;
      case "payroll":
        setShowPayrollDialog(true);
        break;
      case "vendors":
        setShowVendorDialog(true);
        break;
      case "categories":
        setShowCategoryDialog(true);
        break;
      case "ledger":
        setShowJournalDialog(true);
        break;
      case "reports":
        // Show report generation options dialog
        setShowGenericDialog(true);
        break;
      default:
        toast({
          title: "Feature Not Available",
          description: "This action is not yet implemented for this tab.",
          variant: "default"
        });
    }
  };

  // Handle bulk import button rendering based on active tab
  const renderBulkImportButton = (tab: string) => {
    // Only show for relevant tabs
    if (!["accounts", "expenses", "deposits", "banking", "payroll"].includes(tab)) {
      return null;
    }
    
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowGenericDialog(true)}
        className="bg-background text-foreground border-border hover:bg-muted/20"
      >
        <FileUp className="h-4 w-4 mr-2" /> Bulk Import
      </Button>
    );
  };

  // Render vessel selector for filtering financial data
  const renderVesselSelector = () => {
    return (
      <div className="flex flex-col">
        <Select
          value={currentVessel?.id?.toString()}
          disabled={!currentVessel}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              currentVessel 
                ? `${currentVessel.name}`
                : "Select a vessel"
            } />
          </SelectTrigger>
          <SelectContent>
            {/* Note: Vessel selection is handled by the VesselContext */}
            {currentVessel && (
              <SelectItem value={currentVessel.id.toString()}>
                {currentVessel.name}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  };

  // Handle form submission for account creation/editing
  const accountForm = useForm({
    defaultValues: {
      name: '',
      accountNumber: '',
      type: 'asset',
      subtype: 'cash',
      description: '',
      initialBalance: 0,
      currency: 'USD',
      isActive: true
    },
    // Resolver would go here
  });

  // Form submission handlers (placeholders)
  const onAccountSubmit = async (data: any) => {
    console.log("Submitting account data:", data);
    // Actual form submission would go here
    setShowAccountDialog(false);
  };

  const onExpenseSubmit = async (data: any) => {
    console.log("Submitting expense data:", data);
    setShowExpenseDialog(false);
  };

  const onBudgetSubmit = async (data: any) => {
    console.log("Submitting budget data:", data);
    setShowBudgetDialog(false);
  };

  const onCategorySubmit = async (data: any) => {
    console.log("New category data:", data);
    setShowCategoryDialog(false);
    // Here you would call a mutation to create the category
  };

  // Render financial overview section with summary cards and charts
  const renderFinancialOverview = () => {
    if (!currentVessel) return null;
    
    // This would display summary cards and charts
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Total Assets
            </CardTitle>
            <CardDescription>Current value of all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {/* This would be calculated from account data */}
              $450,250.00
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-primary" />
              Monthly Expenses
            </CardTitle>
            <CardDescription>Current month expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {/* This would be calculated from expense data */}
              $28,750.00
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart4 className="h-4 w-4 mr-2 text-primary" />
              Budget Status
            </CardTitle>
            <CardDescription>Current year budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">75% of annual budget used</span>
                <span className="text-sm font-medium">$375,000 / $500,000</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render the appropriate content based on active tab
  const renderTabContent = () => {
    // If no vessel is selected, show a prompt
    if (!currentVessel) {
      return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-muted/10 rounded-lg border border-dashed border-muted">
          <Ship className="h-12 w-12 text-muted" />
          <h3 className="text-lg font-medium">No Vessel Selected</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Please select a vessel from the navigation bar to view and manage financial data
          </p>
        </div>
      );
    }

    // Loading state
    if (accountsLoading && activeTab === "accounts") {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading financial accounts...</p>
          </div>
        </div>
      );
    }

    // Render content based on active tab
    switch (activeTab) {
      case "accounts":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Financial Accounts</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <FileUp className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts && accounts.length > 0 ? (
                    accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{`${account.type} - ${account.subtype}`}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell>{account.currency}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: account.currency || 'USD'
                          }).format(account.balance || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setEditingAccount(account);
                                setShowAccountDialog(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this account? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => {
                                      // Here you would call the API to delete the account
                                      toast({
                                        title: 'Account deleted',
                                        description: `Account ${account.name} has been deleted.`,
                                      });
                                      // Refresh the accounts list
                                      refreshFinancialAccounts();
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                          <DollarSign className="h-8 w-8 text-muted" />
                          <p>No accounts found for this vessel</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowAccountDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" /> 
                            Create your first account
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "ledger":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">General Ledger</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journals && journals.length > 0 ? (
                    journals.map((entry, index) => (
                      <TableRow key={entry.id || index}>
                        <TableCell>{format(new Date(entry.date || new Date()), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{entry.reference || '-'}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.account?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          {entry.type === 'debit' && new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD'
                          }).format(entry.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.type === 'credit' && new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD'
                          }).format(entry.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD'
                          }).format(entry.runningBalance || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                          <Calculator className="h-8 w-8 text-muted" />
                          <p>No ledger entries found</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowJournalDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" /> 
                            Create your first journal entry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "expenses":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Expense Transactions</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="dockage">Dockage</SelectItem>
                    <SelectItem value="crew">Crew Expenses</SelectItem>
                    <SelectItem value="provisions">Provisions</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions && transactions.filter(t => t.transactionType === 'expense').length > 0 ? (
                    transactions
                      .filter(t => t.transactionType === 'expense')
                      .map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.transactionDate || new Date()), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{expense.payee || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category || 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{expense.account?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: expense.currency || 'USD'
                            }).format(expense.amount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={expense.status === 'paid' ? 'default' : 'secondary'}
                              className={expense.status === 'paid' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                            >
                              {expense.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                          <CreditCard className="h-8 w-8 text-muted" />
                          <p>No expense transactions found</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowExpenseDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" /> 
                            Record a new expense
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "deposits":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Deposit Transactions</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="charter">Charter Income</SelectItem>
                    <SelectItem value="owner">Owner Transfer</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="other">Other Income</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions && transactions.filter(t => t.transactionType === 'deposit').length > 0 ? (
                    transactions
                      .filter(t => t.transactionType === 'deposit')
                      .map((deposit) => (
                        <TableRow key={deposit.id}>
                          <TableCell>{format(new Date(deposit.transactionDate || new Date()), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{deposit.payee || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{deposit.category || 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell>{deposit.description}</TableCell>
                          <TableCell>{deposit.account?.name || '-'}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-600">
                            {new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: deposit.currency || 'USD'
                            }).format(deposit.amount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={deposit.status === 'completed' ? 'default' : 'secondary'}
                              className={deposit.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                            >
                              {deposit.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                          <Banknote className="h-8 w-8 text-muted" />
                          <p>No deposit transactions found</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowDepositDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" /> 
                            Record a new deposit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "budgets":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Budget Plans</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="current">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Year</SelectItem>
                    <SelectItem value="previous">Previous Year</SelectItem>
                    <SelectItem value="quarter1">Q1 {new Date().getFullYear()}</SelectItem>
                    <SelectItem value="quarter2">Q2 {new Date().getFullYear()}</SelectItem>
                    <SelectItem value="quarter3">Q3 {new Date().getFullYear()}</SelectItem>
                    <SelectItem value="quarter4">Q4 {new Date().getFullYear()}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Budgeted</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Sample budget data - this would come from API */}
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">Fuel</Badge>
                    </TableCell>
                    <TableCell>Annual fuel budget</TableCell>
                    <TableCell className="text-right">$75,000.00</TableCell>
                    <TableCell className="text-right">$62,450.00</TableCell>
                    <TableCell className="text-right text-emerald-600">$12,550.00</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs">83% used</span>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '83%' }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">Maintenance</Badge>
                    </TableCell>
                    <TableCell>Annual maintenance budget</TableCell>
                    <TableCell className="text-right">$120,000.00</TableCell>
                    <TableCell className="text-right">$145,320.00</TableCell>
                    <TableCell className="text-right text-red-600">-$25,320.00</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs text-red-600">121% used</span>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "banking":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Banking Transactions</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts && accounts.map(account => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Sample banking data - replace with actual API data */}
                  <TableRow>
                    <TableCell>May 01, 2025</TableCell>
                    <TableCell>Transfer</TableCell>
                    <TableCell>Operating Account</TableCell>
                    <TableCell>Wire transfer to Palma chandlery</TableCell>
                    <TableCell>TX-20250501-001</TableCell>
                    <TableCell className="text-right text-red-600">-$3,250.00</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Cleared</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>April 28, 2025</TableCell>
                    <TableCell>Deposit</TableCell>
                    <TableCell>Operating Account</TableCell>
                    <TableCell>Owner funds for Q2</TableCell>
                    <TableCell>DEP-20250428-001</TableCell>
                    <TableCell className="text-right text-emerald-600">$50,000.00</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Cleared</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "payroll":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Crew Payroll</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="current">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pay Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Month</SelectItem>
                    <SelectItem value="previous">Previous Month</SelectItem>
                    <SelectItem value="q1">Q1 {new Date().getFullYear()}</SelectItem>
                    <SelectItem value="q2">Q2 {new Date().getFullYear()}</SelectItem>
                    <SelectItem value="q3">Q3 {new Date().getFullYear()}</SelectItem>
                    <SelectItem value="q4">Q4 {new Date().getFullYear()}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crew Member</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Bonuses</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Sample payroll data - replace with actual API data */}
                  <TableRow>
                    <TableCell>James Harrington</TableCell>
                    <TableCell>Captain</TableCell>
                    <TableCell>May 2025</TableCell>
                    <TableCell className="text-right">$12,500.00</TableCell>
                    <TableCell className="text-right">$1,500.00</TableCell>
                    <TableCell className="text-right font-medium">$14,000.00</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maria Sanchez</TableCell>
                    <TableCell>Chief Stewardess</TableCell>
                    <TableCell>May 2025</TableCell>
                    <TableCell className="text-right">$8,500.00</TableCell>
                    <TableCell className="text-right">$750.00</TableCell>
                    <TableCell className="text-right font-medium">$9,250.00</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "vendors":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Vendor Directory</h3>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Search vendors..." 
                  className="w-[250px]" 
                />
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Transaction</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Sample vendor data - replace with actual API data */}
                  <TableRow>
                    <TableCell className="font-medium">Monaco Marine</TableCell>
                    <TableCell>
                      <Badge variant="outline">Maintenance</Badge>
                    </TableCell>
                    <TableCell>contact@monacomarine.com</TableCell>
                    <TableCell>Monaco</TableCell>
                    <TableCell>April 15, 2025</TableCell>
                    <TableCell className="text-right">$42,750.00</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Palma Chandlery</TableCell>
                    <TableCell>
                      <Badge variant="outline">Supplies</Badge>
                    </TableCell>
                    <TableCell>orders@palmachandlery.com</TableCell>
                    <TableCell>Palma de Mallorca</TableCell>
                    <TableCell>May 01, 2025</TableCell>
                    <TableCell className="text-right">$15,320.00</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        );
      
      case "categories":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Financial Categories</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expense Categories</SelectItem>
                    <SelectItem value="income">Income Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expense Categories</CardTitle>
                  <CardDescription>Categories for organizing expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Sample expense categories - replace with API data */}
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Fuel</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Maintenance</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Dockage</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Crew</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Provisions</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Income Categories</CardTitle>
                  <CardDescription>Categories for organizing income</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Sample income categories - replace with API data */}
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Banknote className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Charter Income</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center">
                        <Banknote className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Owner Transfer</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <Banknote className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Refunds</span>
                      </div>
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case "reports":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Financial Reports</h3>
              <div className="flex items-center gap-2">
                <Select defaultValue="current">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Year</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="previous">Previous Year</SelectItem>
                    <SelectItem value="quarter">Current Quarter</SelectItem>
                    <SelectItem value="month">Current Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-base">
                    <span>Income Statement</span>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Revenue, expenses, and profit</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Generate Report</Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-base">
                    <span>Cash Flow Statement</span>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Cash inflows and outflows</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Generate Report</Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-base">
                    <span>Balance Sheet</span>
                    <BarChart4 className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Assets, liabilities, and equity</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Generate Report</Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-base">
                    <span>Budget Variance</span>
                    <BarChart4 className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Budget vs. actual comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Generate Report</Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-base">
                    <span>Expense Analysis</span>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Expense breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Generate Report</Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-base">
                    <span>Custom Report</span>
                    <FileUp className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Build a custom financial report</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Create Custom Report</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Select a financial management module from the dropdown menu</p>
          </div>
        );
    }
  };

  return (
    <MainLayout title="Financial Management">
      <div className="w-full p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-primary">
                {activeTab === "accounts" && "Chart of Accounts"}
                {activeTab === "deposits" && "Deposits Management"}
                {activeTab === "banking" && "Banking & Reconciliation"}
                {activeTab === "payroll" && "Payroll Management"}
                {activeTab === "budgets" && "Budget Planning"}
                {activeTab === "expenses" && "Expense Tracking"}
                {activeTab === "vendors" && "Vendor Management"}
                {activeTab === "categories" && "Financial Categories"}
                {activeTab === "ledger" && "General Ledger"}
                {activeTab === "reports" && "Financial Reports"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {currentVessel ? `Managing financial data for ${currentVessel.name}` : "Select a vessel from the navigation bar to manage financial data"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
              
              {/* Module Navigation Dropdown Menu - using shadcn DropdownMenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-40 h-9 bg-background text-foreground border-primary/30 hover:bg-primary/10 hover:text-primary">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    <span className="font-medium">Module</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Financial Modules</DropdownMenuLabel>
                  
                  {/* Accounts & Assets Group */}
                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          <span>Accounts & Assets</span>
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="min-w-[220px]">
                        <DropdownMenuItem onClick={() => setActiveTab("accounts")} className={activeTab === "accounts" ? "bg-muted" : ""}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>Chart of Accounts</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("ledger")} className={activeTab === "ledger" ? "bg-muted" : ""}>
                          <Calculator className="h-4 w-4 mr-2" />
                          <span>General Ledger</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Transactions Group */}
                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span className="flex items-center">
                          <Receipt className="w-4 h-4 mr-2" />
                          <span>Transactions</span>
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="min-w-[220px]">
                        <DropdownMenuItem onClick={() => setActiveTab("deposits")} className={activeTab === "deposits" ? "bg-muted" : ""}>
                          <Banknote className="h-4 w-4 mr-2" />
                          <span>Deposits</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("expenses")} className={activeTab === "expenses" ? "bg-muted" : ""}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span>Expenses</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("banking")} className={activeTab === "banking" ? "bg-muted" : ""}>
                          <Building className="h-4 w-4 mr-2" />
                          <span>Banking</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Planning Group */}
                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Planning</span>
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="min-w-[220px]">
                        <DropdownMenuItem onClick={() => setActiveTab("budgets")} className={activeTab === "budgets" ? "bg-muted" : ""}>
                          <Wallet className="h-4 w-4 mr-2" />
                          <span>Budgets</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("payroll")} className={activeTab === "payroll" ? "bg-muted" : ""}>
                          <Users className="h-4 w-4 mr-2" />
                          <span>Payroll</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Organization Group */}
                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span className="flex items-center">
                          <ListTree className="w-4 h-4 mr-2" />
                          <span>Organization</span>
                        </span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="min-w-[220px]">
                        <DropdownMenuItem onClick={() => setActiveTab("categories")} className={activeTab === "categories" ? "bg-muted" : ""}>
                          <ListTree className="h-4 w-4 mr-2" />
                          <span>Categories</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTab("vendors")} className={activeTab === "vendors" ? "bg-muted" : ""}>
                          <Building className="h-4 w-4 mr-2" />
                          <span>Vendors</span>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Direct Access Items */}
                  <DropdownMenuItem onClick={() => setActiveTab("reports")} className={activeTab === "reports" ? "bg-muted" : ""}>
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Reports</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {currentVessel && activeTab !== "reports" && renderBulkImportButton(activeTab)}
              
              {currentVessel && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddNew}
                  className="bg-background text-foreground border-primary/30 hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" /> 
                  {activeTab === "accounts" && "New Account"}
                  {activeTab === "deposits" && "New Deposit"}
                  {activeTab === "banking" && "New Banking Record"}
                  {activeTab === "payroll" && "New Payroll Entry"}
                  {activeTab === "budgets" && "New Budget"}
                  {activeTab === "expenses" && "New Expense"}
                  {activeTab === "vendors" && "New Vendor"}
                  {activeTab === "categories" && "New Category"}
                  {activeTab === "ledger" && "New Entry"}
                  {activeTab === "reports" && "Generate Report"}
                </Button>
              )}
            </div>
          </div>
          
          {/* Financial overview section */}
          {currentVessel && renderFinancialOverview()}
          
          {/* Tab Content */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {/* Account Dialog (Add/Edit) */}
      <Dialog open={showAccountDialog} onOpenChange={(open) => {
        setShowAccountDialog(open);
        if (!open) setEditingAccount(null); // Reset editing state when dialog closes
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount 
                ? `Update financial account for ${currentVessel?.name}.`
                : `Create a new financial account for ${currentVessel?.name}.`
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
              {/* Form fields for account creation/editing */}
              {/* Other dialogs will follow this pattern */}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
            
      {/* Add New Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense transaction for {currentVessel?.name}.
            </DialogDescription>
          </DialogHeader>
          {/* Expense form content */}
        </DialogContent>
      </Dialog>
      
      {/* Other dialogs follow (journal, banking, etc.) */}
    </MainLayout>
  );
};

export default FinancialManagement;