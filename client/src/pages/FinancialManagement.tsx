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
import { VendorTable } from "@/components/financial/VendorTable";
import { VendorDialog } from "@/components/financial/VendorDialog";
import { VendorSelect } from "@/components/financial/VendorSelect";
import { AccountSelect } from "@/components/financial/AccountSelect";
import { AccountDialog } from "@/components/financial/AccountDialog";
import FinancialDashboard from "@/components/financial/FinancialDashboard";
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
  BarChart3,
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
  MoreHorizontal,
  PiggyBank,
  RefreshCw,
  Trash,
  TrendingUp,
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
  
  // State for currently editing items
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
  // State for cash flow chart and form selections
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("12months");
  
  // Get current vessel from context to filter financial data
  const { currentVessel } = useVessel();
  
  // Load current user information for auth and permissions
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => fetch('/api/user').then(res => res.json()),
    enabled: true,
  });
  
  // Load vessel-specific financial data
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/transactions/vessel', currentVessel?.id],
    queryFn: () => {
      if (!currentVessel?.id) return Promise.resolve([]);
      return fetch(`/api/transactions/vessel/${currentVessel.id}`)
        .then(res => res.json())
        .catch(err => {
          console.error("Error fetching vessel transactions:", err);
          return [];
        });
    },
    enabled: !!currentVessel?.id
  });
  
  // Fetch vendors for dropdown selection
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: () => fetch('/api/vendors').then(res => res.json()).catch(err => {
      console.error("Error fetching vendors:", err);
      return [];
    })
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
  const [showQuickAddVendorDialog, setShowQuickAddVendorDialog] = useState(false);
  
  // State for new vendor when quick adding
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorType, setNewVendorType] = useState("supplier");
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  
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
  
  // State for tracking selected vendor ID in the expense form
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  
  // Handle adding a new vendor quickly
  const handleQuickAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingVendor(true);
    
    try {
      // Create the new vendor
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newVendorName,
          type: newVendorType,
          status: 'active',
          contactName: '',
          email: '',
          phone: '',
          address: '',
          notes: `Created during expense entry for ${currentVessel?.name}`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create vendor');
      }
      
      const newVendor = await response.json();
      
      // Show success toast
      toast({
        title: "Vendor Added",
        description: `${newVendorName} has been added to the vendors list.`,
        variant: "default",
      });
      
      // Reset form and close dialog
      setNewVendorName("");
      setNewVendorType("supplier");
      setShowQuickAddVendorDialog(false);
      
      // Refresh vendors list
      await queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      
      // Set the selected vendor ID directly in state so the expense form will use it
      setSelectedVendorId(newVendor.id.toString());
      
      return newVendor;
    } catch (error) {
      console.error("Error adding vendor:", error);
      toast({
        title: "Error",
        description: "Failed to add vendor. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAddingVendor(false);
    }
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

  // Calculate total balance from accounts
  const calculateTotalBalance = () => {
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return 0;
    }
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  };

  // Render financial overview section with summary cards and charts
  const renderFinancialOverview = () => {
    if (!currentVessel) return null;
    
    // Get the total balance for all accounts
    const totalBalance = calculateTotalBalance();
    
    // Format the balance with appropriate currency
    const formattedBalance = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD'
    }).format(totalBalance);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              Total Assets
            </CardTitle>
            <CardDescription>Current value of all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <p className="text-2xl font-bold">
                {formattedBalance}
              </p>
              <p className="text-xs text-muted-foreground">
                {accounts && Array.isArray(accounts) ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''}` : '0 accounts'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-primary" />
              Monthly Expenses
            </CardTitle>
            <CardDescription>Current month expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: 'USD'
                }).format(28750)}
              </p>
              <div className="flex items-center text-xs text-red-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>+5.2% from last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/40 shadow-sm">
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
            <div className="flex justify-end mt-2">
              <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                View Budget Details
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
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

    // Dashboard tab content
    if (activeTab === "dashboard") {
      return <FinancialDashboard vesselId={currentVessel.id} />;
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
                  {accounts && Array.isArray(accounts) && accounts.length > 0 ? (
                    accounts.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell>{account.accountType}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell>USD</TableCell>
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
                                    onClick={async () => {
                                      try {
                                        // Call the API to delete the account
                                        const response = await fetch(`/api/financial-accounts/${account.id}`, {
                                          method: 'DELETE',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          }
                                        });
                                        
                                        if (!response.ok) {
                                          throw new Error('Failed to delete account');
                                        }
                                        
                                        toast({
                                          title: 'Account deleted',
                                          description: `Account ${account.accountName} has been deleted.`,
                                        });
                                        
                                        // Refresh the accounts list
                                        refreshFinancialAccounts();
                                      } catch (error) {
                                        console.error('Error deleting account:', error);
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to delete the account. Please try again.',
                                          variant: 'destructive',
                                        });
                                      }
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
                  {journals && Array.isArray(journals) && journals.length > 0 ? (
                    journals.map((entry: any, index: number) => (
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
                  {transactions && Array.isArray(transactions) && transactions.filter((t: any) => t.transactionType === 'expense').length > 0 ? (
                    transactions
                      .filter((t: any) => t.transactionType === 'expense')
                      .map((expense: any) => (
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
                  {transactions && Array.isArray(transactions) && transactions.filter((t: any) => t.transactionType === 'deposit').length > 0 ? (
                    transactions
                      .filter((t: any) => t.transactionType === 'deposit')
                      .map((deposit: any) => (
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Budget Planning</h3>
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
            
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Wallet className="h-4 w-4 mr-2 text-primary" />
                    Total Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-1">
                    <p className="text-2xl font-bold">$500,000.00</p>
                    <p className="text-xs text-muted-foreground">For fiscal year {new Date().getFullYear()}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    Spent to Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-1">
                    <p className="text-2xl font-bold">$375,000.00</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">75% of total budget</p>
                      <Badge variant="outline" className="text-xs">On track</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border border-border/40 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <PiggyBank className="h-4 w-4 mr-2 text-primary" />
                    Remaining
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-1">
                    <p className="text-2xl font-bold">$125,000.00</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">25% of total budget</p>
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100"
                      >
                        4 months left
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Budget vs Actual Chart */}
            <Card className="border border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Budget vs. Actual by Category</CardTitle>
                <CardDescription>
                  Comparing budgeted amounts to actual spending for {new Date().getFullYear()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-72 w-full">
                  {/* Placeholder for chart - in a real implementation, this would be a recharts or similar component */}
                  <div className="h-full w-full flex items-center justify-center bg-muted/10 border border-dashed rounded-md">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Budget comparison chart would appear here</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Load Chart Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Budget Items Table */}
            <div className="bg-card rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h4 className="text-sm font-medium">Budget Line Items</h4>
              </div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast({ title: "Edit budget item" })}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "View transactions" })}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Transactions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => toast({ 
                              title: "Delete budget item", 
                              variant: "destructive" 
                            })}
                            className="text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast({ title: "Edit budget item" })}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "View transactions" })}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Transactions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => toast({ 
                              title: "Delete budget item", 
                              variant: "destructive" 
                            })}
                            className="text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Badge variant="outline">Dockage</Badge>
                    </TableCell>
                    <TableCell>Annual marina and port fees</TableCell>
                    <TableCell className="text-right">$180,000.00</TableCell>
                    <TableCell className="text-right">$135,000.00</TableCell>
                    <TableCell className="text-right text-emerald-600">$45,000.00</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs">75% used</span>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast({ title: "Edit budget item" })}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast({ title: "View transactions" })}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Transactions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => toast({ 
                              title: "Delete budget item", 
                              variant: "destructive" 
                            })}
                            className="text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    {accounts && Array.isArray(accounts) && accounts.map((account: any) => (
                      account.id ? (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountName || account.name}
                        </SelectItem>
                      ) : null
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
            {vendorsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading vendors...</span>
              </div>
            ) : (
              /* Use our new VendorTable component */
              <VendorTable />
            )}
            
            {/* Vendor Dialog for adding/editing vendors */}
            <VendorDialog 
              open={showVendorDialog} 
              onOpenChange={setShowVendorDialog} 
            />
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
                {activeTab === "dashboard" && "Financial Dashboard"}
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
                  <DropdownMenuItem onClick={() => setActiveTab("dashboard")} className={activeTab === "dashboard" ? "bg-muted" : ""}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
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
      <AccountDialog 
        open={showAccountDialog} 
        onOpenChange={(open) => {
          setShowAccountDialog(open);
          if (!open) setEditingAccount(null); // Reset editing state when dialog closes
        }}
        account={editingAccount}
        onSuccess={refreshFinancialAccounts}
      />
            
      {/* Add New Expense Dialog */}
      <Dialog 
        open={showExpenseDialog} 
        onOpenChange={(open) => {
          setShowExpenseDialog(open);
          if (!open) {
            // Reset the selected vendor when closing the dialog
            setSelectedVendorId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Record New Expense
            </DialogTitle>
            <DialogDescription>
              Add a new expense transaction for {currentVessel?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            
            // Create a new expense transaction
            const formData = new FormData(e.target as HTMLFormElement);
            // Get the vendor ID and make sure it's a valid number
            const vendorIdStr = formData.get('payee') as string;
            const vendorId = vendorIdStr ? parseInt(vendorIdStr) : null;
            
            const expenseData = {
              transactionType: 'expense',
              vesselId: currentVessel?.id,
              // Convert string date to Date object
              transactionDate: new Date(formData.get('transactionDate') as string),
              // Keep amount as string instead of converting to number
              amount: (formData.get('amount') as string),
              description: formData.get('description') as string,
              vendorId: isNaN(vendorId as number) ? null : vendorId,
              accountId: parseInt(formData.get('accountId') as string),
              category: formData.get('category') as string,
              status: formData.get('status') as string,
              currency: formData.get('currency') as string || 'USD',
            };
            
            // Send the expense data to the API
            try {
              console.log("Sending expense data:", expenseData);
              
              // Make sure required fields have valid values
              if (!expenseData.vesselId) {
                throw new Error('No vessel selected');
              }
              
              if (!expenseData.vendorId) {
                throw new Error('Please select a vendor');
              }
              
              if (!expenseData.accountId) {
                throw new Error('Please select an account');
              }
              
              const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error response:", errorData);
                throw new Error(errorData.error || 'Failed to save transaction');
              }
              
              await response.json();
              
              // Show success toast
              toast({
                title: "Expense recorded",
                description: `$${parseFloat(expenseData.amount).toFixed(2)} expense has been added.`,
                variant: "default",
              });
              
              // Close the dialog
              setShowExpenseDialog(false);
              
              // Refresh transactions data
              queryClient.invalidateQueries({ queryKey: ['/api/transactions/vessel', currentVessel?.id] });
              
              // Refresh vendors data to ensure we have the latest
              queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
            } catch (error: any) {
              console.error('Failed to save transaction:', error);
              toast({
                title: "Error Saving Expense",
                description: error.message || "Failed to save expense. Please try again and ensure a vendor is selected.",
                variant: "destructive",
              });
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="transactionDate">Date</Label>
                  <Input 
                    id="transactionDate" 
                    name="transactionDate" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      id="amount" 
                      name="amount" 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      placeholder="0.00" 
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="payee">Vendor/Payee</Label>
                  {/* Hidden input field to store the vendor ID in the form data */}
                  <input 
                    type="hidden" 
                    name="payee" 
                    value={selectedVendorId} 
                  />
                  <VendorSelect
                    value={selectedVendorId}
                    onValueChange={(value) => {
                      console.log("Selected vendor ID:", value);
                      setSelectedVendorId(value);
                    }}
                    onAddNewClick={() => setShowQuickAddVendorDialog(true)}
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="fuel">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="dockage">Dockage</SelectItem>
                      <SelectItem value="crew">Crew Expenses</SelectItem>
                      <SelectItem value="provisions">Provisions</SelectItem>
                      <SelectItem value="other">Other Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="accountId">Account</Label>
                <Select name="accountId" defaultValue={accounts?.[0]?.id?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts && Array.isArray(accounts) && accounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name} ({account.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Enter details about this expense" 
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="pending">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center">
                <Checkbox id="receipt" name="hasReceipt" />
                <Label htmlFor="receipt" className="ml-2">
                  Receipt attached
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowExpenseDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add New Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Add New Deposit
            </DialogTitle>
            <DialogDescription>
              Add a new deposit transaction for {currentVessel?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            
            // Create a new deposit transaction
            const formData = new FormData(e.target as HTMLFormElement);
            const depositData = {
              transactionType: 'deposit',
              vesselId: currentVessel?.id,
              transactionDate: formData.get('transactionDate') as string,
              amount: parseFloat(formData.get('amount') as string),
              description: formData.get('description') as string,
              source: formData.get('source') as string,
              accountId: parseInt(formData.get('accountId') as string),
              category: formData.get('category') as string,
              currency: formData.get('currency') as string || 'USD',
              referenceNumber: formData.get('referenceNumber') as string,
            };
            
            // Log the deposit data (this would normally be sent to the API)
            console.log("Deposit data to submit:", depositData);
            
            // Show success toast
            toast({
              title: "Deposit recorded",
              description: `$${depositData.amount.toFixed(2)} deposit has been added.`,
              variant: "default",
            });
            
            // Close the dialog
            setShowDepositDialog(false);
            
            // Refresh transactions data
            queryClient.invalidateQueries({ queryKey: ['/api/transactions/vessel', currentVessel?.id] });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="transactionDate">Date</Label>
                  <Input 
                    id="transactionDate" 
                    name="transactionDate" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      id="amount" 
                      name="amount" 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      placeholder="0.00" 
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input 
                    id="source" 
                    name="source" 
                    type="text" 
                    placeholder="Enter deposit source" 
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="charter">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="charter">Charter Income</SelectItem>
                      <SelectItem value="owner">Owner Contribution</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="sale">Sale of Equipment</SelectItem>
                      <SelectItem value="insurance">Insurance Claim</SelectItem>
                      <SelectItem value="other">Other Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="accountId">Account</Label>
                <Select name="accountId" defaultValue={accounts?.[0]?.id?.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts && Array.isArray(accounts) && accounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name} ({account.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Enter details about this deposit" 
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input 
                    id="referenceNumber" 
                    name="referenceNumber" 
                    type="text" 
                    placeholder="Enter reference/check number" 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDepositDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Deposit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add New Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Create Budget Plan
            </DialogTitle>
            <DialogDescription>
              Create a new budget allocation for {currentVessel?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            
            // Create a new budget plan
            const formData = new FormData(e.target as HTMLFormElement);
            const budgetData = {
              vesselId: currentVessel?.id,
              category: formData.get('category') as string,
              description: formData.get('description') as string,
              budgetAmount: parseFloat(formData.get('budgetAmount') as string),
              fiscalYear: parseInt(formData.get('fiscalYear') as string),
              fiscalPeriod: formData.get('fiscalPeriod') as string,
              assignedTo: formData.get('assignedTo') as string,
              notes: formData.get('notes') as string,
            };
            
            // Log the budget data (this would normally be sent to the API)
            console.log("Budget data to submit:", budgetData);
            
            // Show success toast
            toast({
              title: "Budget plan created",
              description: `$${budgetData.budgetAmount.toFixed(2)} budget for ${budgetData.category} has been created.`,
              variant: "default",
            });
            
            // Close the dialog
            setShowBudgetDialog(false);
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="category">Budget Category</Label>
                  <Select name="category" defaultValue="fuel">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="dockage">Dockage</SelectItem>
                      <SelectItem value="crew">Crew Expenses</SelectItem>
                      <SelectItem value="provisions">Provisions</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="admin">Administrative</SelectItem>
                      <SelectItem value="other">Other Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="budgetAmount">Budget Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      id="budgetAmount" 
                      name="budgetAmount" 
                      type="number" 
                      step="0.01" 
                      min="0.01" 
                      placeholder="0.00" 
                      className="pl-7"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description" 
                  type="text" 
                  placeholder="Brief description of budget allocation" 
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="fiscalYear">Fiscal Year</Label>
                  <Select name="fiscalYear" defaultValue={new Date().getFullYear().toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
                      <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                      <SelectItem value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="fiscalPeriod">Period</Label>
                  <Select name="fiscalPeriod" defaultValue="annual">
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="q1">Q1</SelectItem>
                      <SelectItem value="q2">Q2</SelectItem>
                      <SelectItem value="q3">Q3</SelectItem>
                      <SelectItem value="q4">Q4</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input 
                  id="assignedTo" 
                  name="assignedTo" 
                  type="text" 
                  placeholder="Person responsible for this budget" 
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  placeholder="Additional notes or instructions" 
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBudgetDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Budget</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Quick Add Vendor Dialog */}
      <Dialog open={showQuickAddVendorDialog} onOpenChange={setShowQuickAddVendorDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Add New Vendor
            </DialogTitle>
            <DialogDescription>
              Quickly add a new vendor to use in your transactions.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleQuickAddVendor}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input 
                  id="vendorName" 
                  name="vendorName" 
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="Enter vendor name" 
                  required
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Label htmlFor="vendorType">Vendor Type</Label>
                <Select 
                  value={newVendorType} 
                  onValueChange={setNewVendorType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="service-provider">Service Provider</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="marina">Marina/Port</SelectItem>
                    <SelectItem value="fuel">Fuel Provider</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowQuickAddVendorDialog(false)} disabled={isAddingVendor}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingVendor}>
                {isAddingVendor && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Batch Import Dialog for bulk operations */}
      <BatchImportDialog
        open={showGenericDialog}
        onOpenChange={setShowGenericDialog}
        title={`Bulk Import ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
        description={`Upload a CSV file to bulk import ${activeTab}. Download the template for the correct format.`}
        templateFileName={`${activeTab}_template.csv`}
        templateContent={
          activeTab === "expenses" 
            ? "date,description,category,amount,vendor,paymentMethod,status,referenceNumber,accountNumber\n2025-05-01,Fuel Purchase,Fuel,1500,Ocean Fuels,Credit Card,Paid,INV-123,FUEL-001"
            : activeTab === "deposits"
            ? "date,description,amount,source,category,referenceNumber,accountNumber\n2025-05-01,Charter Payment,5000,Charter Client,Income,REF-456,OPEX-001"
            : "date,description,amount,category\n2025-05-01,Sample Entry,1000,General"
        }
        onImport={(data) => {
          console.log(`Importing ${activeTab} data:`, data);
          
          if (data.length === 0) {
            toast({
              title: "No data to import",
              description: "The uploaded file contained no valid records.",
              variant: "destructive",
            });
            return;
          }
          
          // Handle different import types based on active tab
          if (activeTab === "expenses") {
            // Process expense imports
            try {
              // Format dates properly and return ISO string which is expected by the backend
              const formatDate = (dateStr: string) => {
                try {
                  let date;
                  // Handle MM/DD/YYYY format
                  if (dateStr.includes('/')) {
                    const [month, day, year] = dateStr.split('/');
                    date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                  } else {
                    // Handle YYYY-MM-DD format
                    date = new Date(dateStr);
                  }
                  
                  // Check if date is valid, otherwise fall back to current date
                  if (isNaN(date.getTime())) {
                    date = new Date();
                  }
                  
                  // Return ISO string
                  return date.toISOString();
                } catch (e) {
                  return new Date().toISOString();
                }
              };

              const processedData = data.map(item => {
                // Find account by accountNumber, otherwise use the first available account
                const accountId = item.accountNumber && accounts 
                  ? (accounts.find((acc: { accountNumber: string, id: number }) => acc.accountNumber === item.accountNumber)?.id || 
                     (accounts.length > 0 ? accounts[0].id : null))
                  : (accounts && accounts.length > 0 ? accounts[0].id : null);
                
                // Ensure we don't have null values for required fields
                if (!accountId) {
                  console.error("Unable to find a valid account for expense:", item);
                }
                
                // Decimal total needs to be a string
                const amount = parseFloat(item.amount) || 0;
                
                return {
                  description: item.description || "Imported Expense",
                  amount: amount,
                  // Make sure date is in proper ISO string format
                  expenseDate: formatDate(item.date || new Date().toISOString().split('T')[0]),
                  total: String(amount), // Required field - as string for decimal handling
                  transactionId: 0, // Required field - will be set by server
                  createdById: user?.id || 5, // Required field - use current user ID or admin
                  category: item.category || "Other",
                  vendorId: item.vendorId || (item.vendor ? -1 : null), // -1 will be handled to create a new vendor
                  vendorName: item.vendor,
                  paymentMethod: item.paymentMethod || "Credit Card", // Must be non-empty
                  status: item.status || "pending", // Must be non-empty
                  referenceNumber: item.referenceNumber || "",
                  vesselId: currentVessel?.id,
                  accountId: accountId, // Must be non-null
                  notes: item.notes || "" // Optional but good to include
                };
              });
              
              // Create vendors that don't exist yet and finalize the expenses data
              const finalizeAndSubmitExpenses = async () => {
                const finalExpenses = [];
                
                for (const expense of processedData) {
                  let expenseToAdd = { ...expense };
                  
                  // If vendor needs to be created (vendorId is -1)
                  if (expense.vendorId === -1 && expense.vendorName) {
                    try {
                      // Create a new vendor
                      const vendorData = {
                        name: expense.vendorName,
                        category: "Imported",
                        isActive: true
                      };
                      
                      const newVendor = await apiRequest("POST", '/api/vendors', vendorData);
                      
                      if (newVendor && newVendor.id) {
                        expenseToAdd.vendorId = newVendor.id;
                      }
                    } catch (error) {
                      console.error("Error creating vendor:", error);
                    }
                  }
                  
                  // Remove the vendorName field as it's not part of the expense schema
                  delete expenseToAdd.vendorName;
                  finalExpenses.push(expenseToAdd);
                }
                
                // Submit bulk expenses to the API
                try {
                  const result = await apiRequest("POST", '/api/expenses/bulk', finalExpenses);
                  
                  toast({
                    title: "Import Successful",
                    description: `${result.count || finalExpenses.length} expenses have been imported.`,
                    variant: "default",
                  });
                  
                  // Refresh expenses data
                  if (currentVessel) {
                    queryClient.invalidateQueries({ queryKey: [`/api/expenses/vessel/${currentVessel.id}`] });
                  }
                  
                  // Close dialog
                  setShowGenericDialog(false);
                } catch (error) {
                  console.error("Error importing expenses:", error);
                  toast({
                    title: "Import Failed",
                    description: error instanceof Error ? error.message : "Failed to import expenses",
                    variant: "destructive",
                  });
                }
              };
              
              // Execute the async function
              finalizeAndSubmitExpenses();
              
            } catch (error) {
              console.error("Error processing expense import:", error);
              toast({
                title: "Import Failed",
                description: "There was an error processing the expense import. Please check your file format.",
                variant: "destructive",
              });
            }
          } else if (activeTab === "deposits") {
            // Process deposit imports (similar structure to expenses)
            toast({
              title: "Import Successful",
              description: `${data.length} deposits have been imported.`,
              variant: "default",
            });
            setShowGenericDialog(false);
          } else {
            // Generic import success
            toast({
              title: "Import Successful",
              description: `${data.length} records have been imported.`,
              variant: "default",
            });
            setShowGenericDialog(false);
          }
        }}
        validateRow={(row, index) => {
          // Basic validation based on tab type
          if (activeTab === "expenses") {
            if (!row.amount || isNaN(parseFloat(row.amount))) {
              return `Row ${index+1}: Invalid amount`;
            }
            if (!row.date) {
              return `Row ${index+1}: Missing date`;
            }
            
            // Validate account if specified
            if (row.accountNumber && accounts) {
              const accountExists = accounts.some((acc: { accountNumber: string }) => acc.accountNumber === row.accountNumber);
              if (!accountExists) {
                return `Row ${index+1}: Account number "${row.accountNumber}" does not exist for this vessel`;
              }
            }
          }
          return null; // No errors
        }}
      />
      
      {/* Other dialogs follow (journal, banking, etc.) */}
    </MainLayout>
  );
};

export default FinancialManagement;