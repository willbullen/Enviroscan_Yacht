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

  // This function would render the appropriate content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "accounts":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Financial Accounts</h3>
            <div className="bg-card rounded-lg shadow-sm border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account #</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* This would map over the accounts data */}
                  <TableRow>
                    <TableCell className="font-medium">Operating Account</TableCell>
                    <TableCell>Asset - Cash</TableCell>
                    <TableCell>1001</TableCell>
                    <TableCell className="text-right">$125,000.00</TableCell>
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
                    <TableCell className="font-medium">Maintenance Fund</TableCell>
                    <TableCell>Asset - Cash</TableCell>
                    <TableCell>1002</TableCell>
                    <TableCell className="text-right">$75,000.00</TableCell>
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
      
      case "ledger":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">General Ledger</h3>
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <p>Ledger entries would be displayed here</p>
            </div>
          </div>
        );
      
      // Add other tab content renderers as needed
      default:
        return (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Select a financial management option from the sidebar</p>
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