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
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showBankingDialog, setShowBankingDialog] = useState(false);
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showGenericDialog, setShowGenericDialog] = useState(false);
  
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
  
  // Helper function to ensure UI updates after account changes
  const refreshFinancialAccounts = async () => {
    // Force a refresh of the accounts list
    await refetchAccounts();
  };
  
  // Load vessel expenses - need vessel ID parameter in URL
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/expenses/vessel', currentVessel?.id],
    queryFn: () => currentVessel?.id ? fetch(`/api/expenses/vessel/${currentVessel.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!currentVessel?.id
  });
  
  // Load vessel budgets - need vessel ID parameter in URL
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['/api/budgets/vessel', currentVessel?.id],
    queryFn: () => currentVessel?.id ? fetch(`/api/budgets/vessel/${currentVessel.id}`).then(res => res.json()) : Promise.resolve([]),
    enabled: !!currentVessel?.id
  });
  
  // Load budget allocations for the first budget if it exists
  const { data: budgetAllocations, isLoading: budgetAllocationsLoading } = useQuery({
    queryKey: ['/api/budget-allocations', budgets && Array.isArray(budgets) && budgets.length > 0 ? budgets[0]?.id : null],
    queryFn: () => {
      if (budgets && Array.isArray(budgets) && budgets.length > 0 && budgets[0]?.id) {
        return fetch(`/api/budget-allocations/budget/${budgets[0].id}`).then(res => res.json());
      }
      return Promise.resolve([]);
    },
    enabled: !!currentVessel?.id && !!budgets && Array.isArray(budgets) && budgets.length > 0 && !!budgets[0]?.id
  });
  
  // Data processing functions for budget visualization
  const getUniqueCategories = (expenseData: any[] | null) => {
    if (!expenseData || !Array.isArray(expenseData) || expenseData.length === 0) {
      return ['No Data'];
    }
    
    // Extract unique categories and sort by frequency
    const categories = expenseData
      .map(expense => expense.category || 'Uncategorized')
      .reduce((acc: Record<string, number>, category) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
    
    // Return the top categories sorted by frequency
    return Object.keys(categories)
      .sort((a, b) => categories[b] - categories[a]);
  };
  
  const getMonthlySpendingData = (expenseData: any[] | null) => {
    if (!expenseData || !Array.isArray(expenseData) || expenseData.length === 0) {
      return [{ month: 'No Data', value: 0 }];
    }
    
    // Group expenses by month and category
    const monthlyData: Record<string, Record<string, number>> = {};
    const allCategories = getUniqueCategories(expenseData);
    
    // Process each expense
    expenseData.forEach(expense => {
      if (!expense.date) return;
      
      const date = new Date(expense.date);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const category = expense.category || 'Uncategorized';
      const amount = Number(expense.amount) || 0;
      
      // Initialize month if not exists
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {};
        // Initialize all categories with 0
        allCategories.forEach(cat => {
          monthlyData[monthYear][cat] = 0;
        });
      }
      
      // Add expense amount to category
      monthlyData[monthYear][category] = (monthlyData[monthYear][category] || 0) + amount;
    });
    
    // Sort months chronologically and convert to array format
    return Object.keys(monthlyData)
      .sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .map(month => {
        return {
          month,
          ...monthlyData[month]
        };
      });
  };
  
  // Function to process transaction data for the cash flow chart
  const getCashFlowData = (transactionData: any[] | null, accountId: string | null, timeRangeMonths: number = 12) => {
    if (!transactionData || !Array.isArray(transactionData) || transactionData.length === 0) {
      return {
        chartData: Array.from({ length: timeRangeMonths }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (timeRangeMonths - 1) + i);
          return {
            month: date.toLocaleString('en-US', { month: 'short' }),
            moneyIn: 0,
            moneyOut: 0
          };
        }),
        totalBalance: 0
      };
    }
    
    // Filter transactions by account if accountId is provided
    const filteredTransactions = accountId 
      ? transactionData.filter(t => t.accountId?.toString() === accountId)
      : transactionData;
    
    // Get date range for chart
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - (timeRangeMonths - 1));
    
    // Initialize data structure for all months in range
    const monthsData: Record<string, { moneyIn: number, moneyOut: number }> = {};
    
    // Initialize all months
    for (let i = 0; i < timeRangeMonths; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthsData[monthYear] = { moneyIn: 0, moneyOut: 0 };
    }
    
    // Process transactions
    let totalIn = 0;
    let totalOut = 0;
    
    filteredTransactions.forEach(transaction => {
      if (!transaction.transactionDate) return;
      
      const date = new Date(transaction.transactionDate);
      
      // Skip transactions outside our time range
      if (date < startDate || date > endDate) return;
      
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const amount = Number(transaction.amount) || 0;
      
      // Categorize transaction as money in or out
      if (transaction.transactionType === 'deposit' || transaction.transactionType === 'income') {
        monthsData[monthYear].moneyIn += amount;
        totalIn += amount;
      } else if (transaction.transactionType === 'expense' || transaction.transactionType === 'withdrawal') {
        monthsData[monthYear].moneyOut += amount;
        totalOut += amount;
      }
    });
    
    // Convert to array and sort chronologically
    const chartData = Object.keys(monthsData)
      .sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .map(month => ({
        month,
        moneyIn: monthsData[month].moneyIn,
        moneyOut: monthsData[month].moneyOut
      }));
    
    return {
      chartData,
      totalBalance: totalIn - totalOut
    };
  };

  const getMonthlyBudgetComparisonData = (budgetData: any[] | null, expenseData: any[] | null) => {
    if (!budgetData || !Array.isArray(budgetData) || budgetData.length === 0 ||
        !expenseData || !Array.isArray(expenseData) || expenseData.length === 0) {
      return [{ month: 'No Data', Budget: 0, Actual: 0 }];
    }
    
    // Calculate total budget
    const totalBudget = budgetData.reduce((sum, budget) => 
      sum + (Number(budget.totalAmount) || Number(budget.amount) || 0), 0);
      
    // Monthly budget (assumed to be evenly distributed for simplicity)
    const monthCount = 12; // Default to annual budget
    const monthlyBudget = totalBudget / monthCount;
    
    // Group expenses by month
    const monthlyExpenses: Record<string, number> = {};
    
    // Process each expense
    expenseData.forEach(expense => {
      if (!expense.date) return;
      
      const date = new Date(expense.date);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const amount = Number(expense.amount) || 0;
      
      // Initialize or add to month
      monthlyExpenses[monthYear] = (monthlyExpenses[monthYear] || 0) + amount;
    });
    
    // Sort months chronologically and convert to array format
    return Object.keys(monthlyExpenses)
      .sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .map(month => {
        return {
          month,
          Budget: monthlyBudget,
          Actual: monthlyExpenses[month]
        };
      });
  };
  
  const getCategoryBreakdownData = (expenseData: any[] | null) => {
    if (!expenseData || !Array.isArray(expenseData) || expenseData.length === 0) {
      return [{ category: 'No Data', budgeted: 0, spent: 0 }];
    }
    
    // Group expenses by category
    const categoryExpenses: Record<string, number> = {};
    const categories = getUniqueCategories(expenseData);
    
    // Calculate total spent per category
    expenseData.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      const amount = Number(expense.amount) || 0;
      
      categoryExpenses[category] = (categoryExpenses[category] || 0) + amount;
    });
    
    // Find corresponding budget amounts from budgets data
    const categoryBudgets: Record<string, number> = {};
    
    // Use the budgets data directly if available, otherwise use placeholder
    if (budgets && Array.isArray(budgets) && budgets.length > 0) {
      budgets.forEach(budget => {
        const category = budget.category || 'Uncategorized';
        const amount = Number(budget.totalAmount) || Number(budget.amount) || 0;
        
        categoryBudgets[category] = (categoryBudgets[category] || 0) + amount;
      });
    }
    
    // Create data array with all categories
    return categories.map(category => ({
      category,
      budgeted: categoryBudgets[category] || 0,
      spent: categoryExpenses[category] || 0
    }));
  };

  // Helper function for a simple vessel selector
  const renderVesselSelector = () => {
    if (!currentVessel) {
      return (
        <div className="p-4 text-center bg-amber-100 rounded-md mb-4">
          <p>Please select a vessel from the navigation dropdown to view financial data.</p>
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-muted/30 rounded-md mb-4 flex items-center gap-2">
        <Ship className="h-5 w-5 text-primary" />
        <span>
          Viewing financial data for: <strong>{currentVessel.name}</strong>
        </span>
      </div>
    );
  };
  
  // Function to render financial overview cards
  const renderFinancialOverview = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className="bg-background border-primary/20 border cursor-pointer hover:bg-muted/20 hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab("accounts")}
                tabIndex={0}
                role="button"
                aria-label="View income details"
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab("accounts")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">€0.00</div>
                  <p className="text-xs text-muted-foreground">For selected vessel</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view detailed income breakdown</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className="bg-background border-primary/20 border cursor-pointer hover:bg-muted/20 hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab("expenses")}
                tabIndex={0}
                role="button"
                aria-label="View expense details"
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab("expenses")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">€0.00</div>
                  <p className="text-xs text-muted-foreground">For selected vessel</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view detailed expense breakdown</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className="bg-background border-primary/20 border cursor-pointer hover:bg-muted/20 hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab("budgets")}
                tabIndex={0}
                role="button"
                aria-label="View budget utilization details"
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab("budgets")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Budget Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">0%</div>
                  <p className="text-xs text-muted-foreground">Of current budget</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view detailed budget information</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className="bg-background border-primary/20 border cursor-pointer hover:bg-muted/20 hover:border-primary/50 transition-colors"
                onClick={() => setActiveTab("banking")}
                tabIndex={0}
                role="button"
                aria-label="View open invoices"
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab("banking")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Open Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <p className="text-xs text-muted-foreground">Awaiting payment</p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view invoice details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };
  
  // Template CSV data for each section
  const templateData = {
    accounts: "accountName,accountNumber,balance,type,vesselId,description\nOperating Account,AC12345,10000.00,asset,1,Main operating account\nFuel Fund,AC67890,5000.00,liability,1,Reserved for fuel expenses",
    journals: "date,reference,description,debit,credit,account,vesselId\n2025-01-01,JE001,Monthly crew payment,5000.00,0.00,Crew Expenses,1\n2025-01-01,JE001,Monthly crew payment,0.00,5000.00,Operating Account,1",
    banking: "accountName,bankName,accountNumber,routingNumber,balance,currency,vesselId\nMain Account,Maritime Bank,123456789,987654321,50000.00,EUR,1\nReserve Account,Marine Trust,987654321,123456789,100000.00,EUR,1",
    payroll: "employeeName,position,salary,paymentDate,bankAccount,vesselId,taxCode\nJohn Smith,Captain,8000.00,2025-01-15,GB123456789,1,TAX123\nJane Doe,Chief Engineer,7500.00,2025-01-15,GB987654321,1,TAX456",
    budgets: "name,amount,startDate,endDate,category,vesselId,notes\nQ1 Operating Budget,75000.00,2025-01-01,2025-03-31,Operations,1,First quarter operating expenses\nAnnual Maintenance Budget,120000.00,2025-01-01,2025-12-31,Maintenance,1,Annual maintenance reserve",
    expenses: "date,amount,category,description,paymentMethod,vesselId,reference\n2025-01-05,1500.00,Fuel,Diesel refill,bank_transfer,1,INV12345\n2025-01-10,350.00,Provisions,Crew food supplies,credit_card,1,REC67890",
    vendors: "name,contactPerson,email,phone,address,vesselId,category\nMarine Supplies Ltd,John Brown,jbrown@marinesupplies.com,+44123456789,123 Harbor Road London UK,1,Supplies\nEngineering Services Inc,Sarah Johnson,sjohnson@engservices.com,+15559876543,456 Dockside Blvd Miami USA,1,Maintenance",
    categories: "name,code,description,parentCategoryId,level,vesselId,isActive\nFuel Expenses,FUE,All fuel related expenses,null,1,1,true\nDiesel,DSL,Diesel fuel costs,1,2,1,true\nGasoline,GSL,Gasoline costs,1,2,1,true\nMaintenance,MNT,Maintenance and repairs,null,1,1,true\nParts,PRT,Replacement parts,2,2,1,true\nLabor,LBR,Labor costs for maintenance,2,2,1,true"
  };

  // Function to create a bulk import button for a specific section
  const renderBulkImportButton = (section: string) => {
    const template = templateData[section as keyof typeof templateData] || "";
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 mr-2 bg-background text-foreground border-primary/30 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          >
            <FileUp className="h-4 w-4" /> Import {sectionName}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import {sectionName} Data</DialogTitle>
            <DialogDescription>
              Upload your {section} data as a CSV file. Make sure to follow the template format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Use our template to ensure your data is formatted correctly.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => {
                  const blob = new Blob([template], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${section}_import_template.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Drag and drop your CSV file here</h3>
                <p className="text-sm text-muted-foreground">or</p>
                <Button variant="secondary">Select file</Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button">Cancel</Button>
            <Button type="button" disabled>Import Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Function to render tab content based on active tab
  // Define which tabs have basic implementations
  const implementedTabs = ['accounts', 'journals', 'reports'];
  
  const renderTabContent = () => {
    if (!currentVessel) {
      return (
        <div className="p-8 text-center border rounded-md bg-muted/10">
          <p className="text-muted-foreground">Please select a vessel to view financial data.</p>
        </div>
      );
    }
    
    const isLoading = transactionsLoading || accountsLoading || expensesLoading || budgetsLoading || budgetAllocationsLoading;
    
    if (isLoading) {
      return (
        <div className="p-8 text-center border rounded-md">
          <p className="text-muted-foreground">Loading financial data for {currentVessel.name}...</p>
        </div>
      );
    }
    
    // Log the active tab to troubleshoot tab switching
    console.log(`Rendering content for tab: ${activeTab}`);
    
    switch (activeTab) {
      case "accounts":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Chart of Accounts</CardTitle>
                  <CardDescription>Financial accounts for {currentVessel.name}</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowAccountDialog(true)}
                        aria-label="Add a new financial account"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                      >
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Account
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new financial account</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {(!accounts || !Array.isArray(accounts) || accounts.length === 0) ? (
                  <div className="border rounded-md p-4 text-center">
                    <p className="text-muted-foreground">No accounts found for this vessel.</p>
                    <div className="flex flex-col items-center gap-2 mt-4">
                      <p className="text-sm text-muted-foreground">Add your first account to get started</p>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowAccountDialog(true)}
                        aria-label="Add a new financial account"
                        className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                      >
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Account
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-muted/50">
                          <TableHead className="font-medium">Account Number</TableHead>
                          <TableHead className="font-medium">Name</TableHead>
                          <TableHead className="font-medium">Type</TableHead>
                          <TableHead className="font-medium text-right">Balance</TableHead>
                          <TableHead className="font-medium text-center">Status</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.map((account) => (
                          <TableRow key={account.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono">{account.accountNumber}</TableCell>
                            <TableCell className="font-medium">{account.accountName}</TableCell>
                            <TableCell>{account.accountType}</TableCell>
                            <TableCell className="text-right">
                              €{parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={account.isActive ? "default" : "secondary"} className="px-2 py-0.5 text-xs">
                                {account.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => {
                                          // Set the account to edit and populate form values
                                          setEditingAccount(account);
                                          accountForm.reset({
                                            name: account.accountName,
                                            accountNumber: account.accountNumber,
                                            balance: account.balance.toString(),
                                            type: account.accountType,
                                            description: account.description || ""
                                          });
                                          // Open the dialog
                                          setShowAccountDialog(true);
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit account</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Cash Flow Trend Chart */}
            {accounts && Array.isArray(accounts) && accounts.length > 0 && (
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Cash Flow Trends</CardTitle>
                    <CardDescription>
                      Track money in and out of your accounts
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedAccountId || "all"} 
                      onValueChange={(value) => setSelectedAccountId(value === "all" ? null : value)}
                      aria-label="Select account to view"
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All accounts</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.accountName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={timeRange} 
                      onValueChange={(value) => setTimeRange(value)}
                      aria-label="Select time range"
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="12 months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3months">3 months</SelectItem>
                        <SelectItem value="6months">6 months</SelectItem>
                        <SelectItem value="12months">12 months</SelectItem>
                        <SelectItem value="ytd">Year to date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                      <span>Loading chart data...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">Account Balance</h4>
                          <div className="flex items-baseline mt-1">
                            <span className="text-2xl font-bold">
                              €{getCashFlowData(transactions, selectedAccountId, timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12).totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {selectedAccountId ? `for ${accounts.find((a) => a.id.toString() === selectedAccountId)?.accountName || 'selected account'}` : 'for all accounts'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                            <span className="text-sm text-muted-foreground">Money In</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div>
                            <span className="text-sm text-muted-foreground">Money Out</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-[300px] mt-4">
                        <LineChart
                          className="h-full"
                          data={getCashFlowData(transactions, selectedAccountId, timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12).chartData}
                          index="month"
                          categories={["moneyIn", "moneyOut"]}
                          colors={["emerald", "rose"]}
                          valueFormatter={(number) => `€${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          showLegend={false}
                          yAxisWidth={60}
                          showAnimation={true}
                          curveType="natural"
                          connectNulls={true}
                          showGridLines={true}
                          showTooltip={true}
                          aria-label="Line chart showing cash flow trends"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        This visualization shows actual cash flow trends over time, including deposits, withdrawals, income, and expenses.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case "deposits":
        return (
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Deposits</CardTitle>
                  <CardDescription>Account deposits for {currentVessel.name}</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowDepositDialog(true)}
                        aria-label="Create a new deposit"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                      >
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Deposit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new deposit transaction</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {journalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                    <span>Loading deposits...</span>
                  </div>
                ) : !journals || !Array.isArray(journals) || journals.length === 0 ? (
                  <div className="border rounded-md p-4 text-center">
                    <p className="text-muted-foreground">No deposits found for this vessel.</p>
                    <p className="text-sm text-muted-foreground mt-2">Deposits will appear here once added.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-muted/50">
                          <TableHead className="font-medium">Date</TableHead>
                          <TableHead className="font-medium">Reference</TableHead>
                          <TableHead className="font-medium">Description</TableHead>
                          <TableHead className="font-medium text-right">Debit (€)</TableHead>
                          <TableHead className="font-medium text-right">Credit (€)</TableHead>
                          <TableHead className="font-medium">Account</TableHead>
                          <TableHead className="font-medium text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {journals.map((journal: any) => {
                          // Find the account name from the accounts list
                          const accountName = accounts?.find((a: any) => a.id === Number(journal.accountId))?.accountName || 'Unknown Account';
                          
                          return (
                            <TableRow key={journal.id} className="hover:bg-muted/50">
                              <TableCell>
                                {journal.transactionDate ? format(new Date(journal.transactionDate), 'yyyy-MM-dd') : 'N/A'}
                              </TableCell>
                              <TableCell>{journal.reference || journal.id}</TableCell>
                              <TableCell className="max-w-xs truncate">{journal.description}</TableCell>
                              <TableCell className="text-right">
                                {journal.isDebit ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(journal.amount || 0) : '0.00'}
                              </TableCell>
                              <TableCell className="text-right">
                                {!journal.isDebit ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(journal.amount || 0) : '0.00'}
                              </TableCell>
                              <TableCell>{accountName}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={journal.status === 'posted' ? 'default' : 'secondary'} className="px-2 py-0.5 text-xs">
                                  {journal.status || 'Draft'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
        
      case "banking":
        return (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Banking</CardTitle>
                <CardDescription>Bank accounts for {currentVessel.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No banking information found for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Banking information will appear here once added.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "payroll":
        return (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payroll Management</CardTitle>
                <CardDescription>Crew payroll for {currentVessel.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No payroll information found for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Payroll information will appear here once added.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "expenses":
        return (
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Expense Tracking</CardTitle>
                  <CardDescription>Expenses for {currentVessel.name}</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowExpenseDialog(true)}
                        aria-label="Record a new expense"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                      >
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Expense
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Record a new expense transaction</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No expenses found for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Expenses will appear here once added.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "budgets":
        // If we don't have budget or expense data yet, show loading state
        if (budgetsLoading || expensesLoading) {
          return (
            <div className="p-8 text-center border rounded-md">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading budget data for {currentVessel.name}...</p>
            </div>
          );
        }
        
        // Check if real budget data is available
        const hasBudgetData = budgets && Array.isArray(budgets) && budgets.length > 0;
        
        // If no budget data, show empty state with proper guidance
        if (!hasBudgetData) {
          return (
            <div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Budget Management</CardTitle>
                    <CardDescription>No budgets configured for {currentVessel.name}</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setShowBudgetDialog(true)}
                          aria-label="Create a new budget"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                        >
                          <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Budget
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create a new financial budget</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-8 text-center">
                    <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Budget Data Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Create budgets to track and manage spending for different categories.
                    </p>
                    <Button 
                      onClick={() => setShowBudgetDialog(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create Your First Budget
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        
        // Prepare consistent budget data for visualization from real API data
        const displayData = (budgets as any[]).map(budget => {
          // Find related expenses for this budget category if expenses data exists
          const categoryExpenses = expenses && Array.isArray(expenses)
            ? expenses
              .filter((expense: any) => expense?.category === budget?.category)
              .reduce((total: number, expense: any) => total + (Number(expense?.amount) || 0), 0)
            : 0;
          
          // Calculate remaining amount
          const budgetAmount = Number(budget.totalAmount) || Number(budget.amount) || 0;
          const spent = categoryExpenses;
          const remaining = budgetAmount - spent;
          
          return {
            id: budget.id,
            name: budget.name || budget.category || "Unnamed Budget",
            budget: budgetAmount,
            spent: spent,
            remaining: remaining,
            percentUsed: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
            periodStart: budget.startDate,
            periodEnd: budget.endDate,
            category: budget.category || "Uncategorized",
            notes: budget.notes,
            currency: budget.currency || "EUR",
            status: budget.status || "active"
          };
        });

        // Chart data transformation
        const chartData = displayData.map(item => ({
          id: item.id,
          name: item.name,
          Budget: item.budget,
          Spent: item.spent,
          Remaining: item.remaining,
          percentUsed: item.budget > 0 ? Math.round((item.spent / item.budget) * 100) : 0,
          category: item.category,
          periodStart: item.periodStart,
          periodEnd: item.periodEnd
        }));

        // Pie chart data for budget allocation
        const pieData = displayData.map(item => ({
          name: item.name,
          value: item.budget,
          category: item.category
        }));

        // Spending by category chart data
        const spendingData = displayData.map(item => ({
          name: item.name,
          value: item.spent,
          category: item.category
        }));

        // Colors for consistent visual representation
        const COLORS = [
          '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', 
          '#8b5cf6', '#22c55e', '#06b6d4', '#f43f5e'
        ];

        return (
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Budget Management</CardTitle>
                  <CardDescription>Budgets for {currentVessel.name}</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowBudgetDialog(true)}
                        aria-label="Create a new budget"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                      >
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Budget
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create a new financial budget</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                {displayData.length === 0 ? (
                  <div className="border rounded-md p-4 text-center">
                    <p className="text-muted-foreground">No budgets found for this vessel.</p>
                    <p className="text-sm text-muted-foreground mt-2">Budgets will appear here once added.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall budget summary */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Budget Overview</h3>
                      <Grid numItemsLg={2} numItemsMd={2} numItemsSm={1} className="gap-6">
                        <Col>
                          <TremorCard className="mx-auto">
                            <Text>Budget Allocation by Category</Text>
                            <DonutChart
                              className="mt-4 h-40"
                              data={pieData}
                              category="value"
                              index="name"
                              colors={["blue", "cyan", "amber", "emerald", "violet", "indigo", "rose"]}
                              showAnimation={true}
                              valueFormatter={(number) => `€${new Intl.NumberFormat('en-US').format(number)}`}
                              showTooltip={true}
                              showLabel={true}
                              aria-label="Pie chart showing budget allocation by category"
                            />
                            <div className="mt-2">
                              <p className="text-xs text-center text-muted-foreground">
                                Click on segments to focus on specific categories
                              </p>
                            </div>
                          </TremorCard>
                        </Col>
                        <Col>
                          <TremorCard className="mx-auto">
                            <Text>Spending by Category</Text>
                            <DonutChart
                              className="mt-4 h-40"
                              data={spendingData}
                              category="value"
                              index="name"
                              colors={["blue", "cyan", "amber", "emerald", "violet", "indigo", "rose"]}
                              showAnimation={true}
                              valueFormatter={(number) => `€${new Intl.NumberFormat('en-US').format(number)}`}
                              showTooltip={true}
                              showLabel={true}
                              aria-label="Pie chart showing spending by category"
                            />
                            <div className="mt-2">
                              <p className="text-xs text-center text-muted-foreground">
                                Hover over segments to see detailed spending information
                              </p>
                            </div>
                          </TremorCard>
                        </Col>
                      </Grid>
                    </div>

                    {/* Budget vs Actual Spending Comparison */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Budget vs. Actual Spending</h3>
                      <TremorCard>
                        <TabGroup>
                          <TabList className="mb-4">
                            <Tab>Bar Chart</Tab>
                            <Tab>Table View</Tab>
                            <Tab>Interactive View</Tab>
                          </TabList>
                          <TabPanels>
                            <TabPanel>
                              <BarChart
                                className="h-80 mt-4"
                                data={chartData}
                                index="name"
                                categories={["Budget", "Spent"]}
                                colors={["blue", "amber"]}
                                valueFormatter={(number) => `€${new Intl.NumberFormat('en-US').format(number)}`}
                                yAxisWidth={60}
                                showLegend={true}
                                showAnimation={true}
                                showGridLines={true}
                                showTooltip={true}
                                startEndOnly={false}
                                aria-label="Bar chart comparing budgeted amounts to actual spending by category"
                              />
                              <p className="text-xs text-center text-muted-foreground mt-3">
                                Interactive budget comparison chart. Hover over bars to see exact values.
                              </p>
                            </TabPanel>
                            <TabPanel>
                              <Table className="mt-2">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Budget</TableHead>
                                    <TableHead className="text-right">Spent</TableHead>
                                    <TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">% Used</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {chartData.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{item.name}</TableCell>
                                      <TableCell className="text-right">€{item.Budget.toLocaleString()}</TableCell>
                                      <TableCell className="text-right">€{item.Spent.toLocaleString()}</TableCell>
                                      <TableCell className="text-right">€{item.Remaining.toLocaleString()}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end">
                                          <span className={`mr-2 ${item.percentUsed >= 90 ? 'text-red-500' : item.percentUsed >= 70 ? 'text-amber-500' : 'text-green-500'}`}>
                                            {item.percentUsed}%
                                          </span>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TabPanel>
                            <TabPanel>
                              <div className="space-y-6">
                                {chartData.map((item, index) => (
                                  <div key={index} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                      <div>
                                        <h4 className="font-bold">{item.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Period: {new Date(item.periodStart).toLocaleDateString()} to {new Date(item.periodEnd).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 mt-2 md:mt-0">
                                        <Badge 
                                          className={`px-2 py-1 ${
                                            item.percentUsed >= 90 ? 'bg-red-500' : 
                                            item.percentUsed >= 70 ? 'bg-amber-500' : 
                                            'bg-green-500'
                                          }`}
                                          aria-label={`Budget utilization: ${item.percentUsed}%`}
                                        >
                                          {item.percentUsed}% Used
                                        </Badge>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          aria-label={`View details for ${item.name} budget`}
                                          className="text-xs"
                                        >
                                          Details
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                      <div className="rounded-md p-2 bg-muted/20 text-center">
                                        <p className="text-xs text-muted-foreground">Total Budget</p>
                                        <p className="text-lg font-bold text-primary">€{item.Budget.toLocaleString()}</p>
                                      </div>
                                      <div className="rounded-md p-2 bg-muted/20 text-center">
                                        <p className="text-xs text-muted-foreground">Spent</p>
                                        <p className="text-lg font-bold text-amber-500">€{item.Spent.toLocaleString()}</p>
                                      </div>
                                      <div className="rounded-md p-2 bg-muted/20 text-center">
                                        <p className="text-xs text-muted-foreground">Remaining</p>
                                        <p className="text-lg font-bold text-emerald-500">€{item.Remaining.toLocaleString()}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="h-3 w-full bg-muted rounded overflow-hidden">
                                        <div 
                                          className={`h-full ${
                                            item.percentUsed >= 90 ? 'bg-red-500' : 
                                            item.percentUsed >= 70 ? 'bg-amber-500' : 
                                            'bg-emerald-500'
                                          }`} 
                                          style={{ width: `${item.percentUsed}%` }}
                                          role="progressbar"
                                          aria-valuenow={item.percentUsed}
                                          aria-valuemin={0}
                                          aria-valuemax={100}
                                        ></div>
                                      </div>
                                      <div className="flex justify-between text-xs mt-1">
                                        <span>€0</span>
                                        <span>€{item.Budget.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TabPanel>
                          </TabPanels>
                        </TabGroup>
                      </TremorCard>
                    </div>
                    
                    {/* Monthly spending trend visualization */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">Monthly Spending Trends</h3>
                      <TremorCard>
                        <TabGroup>
                          <TabList className="mb-4">
                            <Tab>Line Chart</Tab>
                            <Tab>Bar Chart</Tab>
                            <Tab>Interactive View</Tab>
                          </TabList>
                          <TabPanels>
                            <TabPanel>
                              <Text>Spending by Month & Category (Real-time Data)</Text>
                              {(!expenses || !Array.isArray(expenses) || expenses.length === 0) ? (
                                <div className="h-80 flex items-center justify-center flex-col p-6 border border-dashed rounded-md mt-4">
                                  <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                  <p className="text-muted-foreground text-center">No expense data available for this period</p>
                                  <p className="text-sm text-muted-foreground text-center mt-2">
                                    Add expenses to see spending trends over time
                                  </p>
                                </div>
                              ) : (
                                <LineChart
                                  className="h-80 mt-6"
                                  data={getMonthlySpendingData(expenses)}
                                  index="month"
                                  categories={getUniqueCategories(expenses).slice(0, 6)}
                                  colors={["blue", "emerald", "amber", "rose", "violet", "indigo"]}
                                  valueFormatter={(number) => `€${new Intl.NumberFormat('en-US').format(number)}`}
                                  showLegend={true}
                                  yAxisWidth={60}
                                  showAnimation={true}
                                  curveType="natural"
                                  connectNulls={true}
                                  showGridLines={true}
                                  showTooltip={true}
                                  aria-label="Line chart showing monthly expense trends by category"
                                />
                              )}
                              <p className="text-xs text-center text-muted-foreground mt-4">
                                This visualization shows actual spending trends for major budget categories over time
                              </p>
                            </TabPanel>
                            <TabPanel>
                              <Text>Budget vs. Actual by Month</Text>
                              {(!expenses || !Array.isArray(expenses) || expenses.length === 0 || 
                                !budgets || !Array.isArray(budgets) || budgets.length === 0) ? (
                                <div className="h-80 flex items-center justify-center flex-col p-6 border border-dashed rounded-md mt-4">
                                  <BarChart4 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                  <p className="text-muted-foreground text-center">No expense or budget data available for comparison</p>
                                  <p className="text-sm text-muted-foreground text-center mt-2">
                                    Add expenses and budgets to compare spending against allocations
                                  </p>
                                </div>
                              ) : (
                                <BarChart
                                  className="h-80 mt-6"
                                  data={getMonthlyBudgetComparisonData(budgets, expenses)}
                                  index="month"
                                  categories={["Budget", "Actual"]}
                                  colors={["blue", "amber"]}
                                  valueFormatter={(number) => `€${new Intl.NumberFormat('en-US').format(number)}`}
                                  showLegend={true}
                                  yAxisWidth={60}
                                  showAnimation={true}
                                  showGridLines={true}
                                  showTooltip={true}
                                  startEndOnly={false}
                                  aria-label="Bar chart comparing budgeted amounts to actual spending by month"
                                />
                              )}
                              <p className="text-xs text-center text-muted-foreground mt-4">
                                Compare monthly spending against allocated budgets
                              </p>
                            </TabPanel>
                            <TabPanel>
                              <Text>Category Breakdown Over Time</Text>
                              {(!expenses || !Array.isArray(expenses) || expenses.length === 0) ? (
                                <div className="h-80 flex items-center justify-center flex-col p-6 border border-dashed rounded-md mt-4">
                                  <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                  <p className="text-muted-foreground text-center">No expense data to display</p>
                                  <p className="text-sm text-muted-foreground text-center mt-2">
                                    Add expenses to generate detailed category breakdown
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-4">
                                  <ResponsiveContainer width="100%" height={400}>
                                    <RechartsBarChart
                                      data={getCategoryBreakdownData(expenses)}
                                      margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 60,
                                      }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis 
                                        dataKey="category" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        height={70}
                                        tick={{ fontSize: 12 }}
                                      />
                                      <YAxis 
                                        tickFormatter={(value) => `€${value}`}
                                        tick={{ fontSize: 12 }}
                                      />
                                      <RechartsTooltip 
                                        formatter={(value) => [`€${value.toLocaleString()}`, 'Amount']}
                                        labelFormatter={(label) => `Category: ${label}`}
                                      />
                                      <Legend />
                                      <Bar 
                                        dataKey="budgeted" 
                                        name="Budget Allocated" 
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                      />
                                      <Bar 
                                        dataKey="spent" 
                                        name="Actual Spending" 
                                        fill="#f59e0b"
                                        radius={[4, 4, 0, 0]}
                                      />
                                    </RechartsBarChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                              <p className="text-xs text-center text-muted-foreground mt-4">
                                This visualization compares budget allocation against actual spending by category
                              </p>
                            </TabPanel>
                          </TabPanels>
                        </TabGroup>
                      </TremorCard>
                    </div>

                    {/* Budget utilization progress - enhanced interactive version */}
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                        <h3 className="text-lg font-medium mb-2 md:mb-0">Budget Utilization Progress</h3>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-sm px-2 py-1 bg-muted/30 rounded-md cursor-help">
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground text-xs">What do colors mean?</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-4">
                                <h4 className="font-medium mb-2">Budget Status Indicators</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span>Good (under 70% used)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <span>Warning (70-90% used)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span>Critical (over 90% used)</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8"
                            onClick={() => setShowBudgetDialog(true)}
                            aria-label="Create new budget"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            New Budget
                          </Button>
                        </div>
                      </div>
                      
                      {/* No data state */}
                      {(!chartData || chartData.length === 0) && (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                          <Wallet className="h-12 w-12 text-muted-foreground/40 mb-4" />
                          <h4 className="text-lg font-medium mb-2">No Budget Data Available</h4>
                          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                            Create budgets to track spending against allocations and visualize your financial data.
                            Well-organized budgets help maintain financial clarity across vessel operations.
                          </p>
                          <Button
                            onClick={() => setShowBudgetDialog(true)}
                            className="text-sm"
                            aria-label="Create your first budget"
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Create Your First Budget
                          </Button>
                        </div>
                      )}
                      
                      {/* Budget data visualization */}
                      <div className="space-y-6">
                        {chartData && chartData.map((item, index) => (
                          <div 
                            key={index} 
                            className="mb-6 bg-card p-5 rounded-lg border border-muted shadow-sm hover:border-primary/40 transition-colors"
                            tabIndex={0}
                            role="region"
                            aria-label={`Budget for ${item.name} in the ${item.category} category`}
                          >
                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-3">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="font-medium flex items-center cursor-help">
                                      <h4 className="text-base font-semibold">{item.name}</h4>
                                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {item.category}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" align="start">
                                    <div className="space-y-1 text-sm">
                                      <p className="font-medium">{item.name} Budget Details</p>
                                      <p>Period: {new Date(item.periodStart).toLocaleDateString()} to {new Date(item.periodEnd).toLocaleDateString()}</p>
                                      <p>Category: {item.category}</p>
                                      {/* Only show description if it exists */}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <div className="flex items-center gap-3">
                                <div 
                                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                                    item.percentUsed >= 90 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                    item.percentUsed >= 70 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                  }`}
                                  role="status"
                                  aria-label={`Budget is ${item.percentUsed}% utilized`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    {item.percentUsed >= 90 ? (
                                      <AlertCircle className="h-3.5 w-3.5" />
                                    ) : item.percentUsed >= 70 ? (
                                      <AlertCircle className="h-3.5 w-3.5" />
                                    ) : (
                                      <CheckCircle className="h-3.5 w-3.5" />
                                    )}
                                    {item.percentUsed}% Used
                                  </span>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8 text-xs font-medium"
                                        aria-label={`View transactions for ${item.name} budget`}
                                      >
                                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                                        View Details
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>View all transactions related to this budget</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                              <div className="bg-muted/20 p-3 rounded-md text-center flex flex-col justify-between">
                                <span className="text-xs text-muted-foreground mb-1">Total Budget</span>
                                <span className="text-base font-bold text-primary">€{item.Budget.toLocaleString()}</span>
                              </div>
                              <div className="bg-muted/20 p-3 rounded-md text-center flex flex-col justify-between">
                                <span className="text-xs text-muted-foreground mb-1">Spent</span>
                                <span className={`text-base font-bold ${
                                  item.percentUsed >= 90 ? 'text-red-600 dark:text-red-400' : 
                                  item.percentUsed >= 70 ? 'text-amber-600 dark:text-amber-400' : 
                                  'text-emerald-600 dark:text-emerald-400'
                                }`}>€{item.Spent.toLocaleString()}</span>
                              </div>
                              <div className="bg-muted/20 p-3 rounded-md text-center flex flex-col justify-between">
                                <span className="text-xs text-muted-foreground mb-1">Remaining</span>
                                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">€{item.Remaining.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            {/* Enhanced progress bar with labels */}
                            <div className="mt-4">
                              <div className="flex mb-1 items-center justify-between">
                                <span className="text-xs text-muted-foreground">Budget Period</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="relative">
                                <div 
                                  className="overflow-hidden h-5 mb-2 text-xs flex rounded-md bg-muted"
                                  role="progressbar" 
                                  aria-valuenow={item.percentUsed} 
                                  aria-valuemin={0} 
                                  aria-valuemax={100}
                                >
                                  <div 
                                    style={{ width: `${item.percentUsed}%` }} 
                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-in-out ${
                                      item.percentUsed >= 90 ? 'bg-red-500' : 
                                      item.percentUsed >= 70 ? 'bg-amber-500' : 
                                      'bg-emerald-500'
                                    }`}
                                  >
                                    {item.percentUsed > 10 && (
                                      <span className="text-xs font-medium px-2">€{item.Spent.toLocaleString()} of €{item.Budget.toLocaleString()}</span>
                                    )}
                                  </div>
                                </div>
                                {item.percentUsed <= 10 && (
                                  <span className="text-xs text-muted-foreground">€{item.Spent.toLocaleString()} of €{item.Budget.toLocaleString()}</span>
                                )}
                                
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>0%</span>
                                  <span>25%</span>
                                  <span>50%</span>
                                  <span>75%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                              
                              {/* Spending rate indicator */}
                              <div className="mt-4 p-3 bg-muted/10 rounded-md">
                                <h5 className="text-xs font-medium mb-2 text-foreground flex items-center">
                                  <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                  Spending Rate Analysis
                                </h5>
                                <div className="flex items-center gap-1 mb-2">
                                  <div className={`h-1.5 flex-1 rounded-l-full ${
                                    item.percentUsed <= 33 ? 'bg-emerald-500' : 'bg-muted'
                                  }`}></div>
                                  <div className={`h-1.5 flex-1 ${
                                    item.percentUsed > 33 && item.percentUsed <= 66 ? 'bg-blue-500' : 'bg-muted'
                                  }`}></div>
                                  <div className={`h-1.5 flex-1 rounded-r-full ${
                                    item.percentUsed > 66 ? 'bg-amber-500' : 'bg-muted'
                                  }`}></div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {item.percentUsed <= 33 ? (
                                    "Spending rate: Within expected levels for this budget period"
                                  ) : item.percentUsed <= 66 ? (
                                    "Spending rate: Progressing at expected pace - within projections"
                                  ) : (
                                    "Spending rate: Higher than expected - monitor closely"
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
        
      case "vendors":
        return (
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vendor Management</CardTitle>
                  <CardDescription>Vendors for {currentVessel.name}</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setShowVendorDialog(true)}
                        aria-label="Add a new vendor"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                      >
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" /> Add Vendor
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add a new vendor or supplier</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No vendors found for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Vendors will appear here once added.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case "categories":
        return (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Financial Categories</CardTitle>
                <CardDescription>Category structure for {currentVessel.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Category Hierarchy</h3>
                  <div className="border rounded-md p-6">
                    <div className="space-y-2">
                      {/* Top level category */}
                      <div className="flex items-center gap-2">
                        <Checkbox id="cat1" />
                        <div className="flex flex-1 items-center justify-between">
                          <label htmlFor="cat1" className="font-medium">Fuel Expenses (FUE)</label>
                          <Badge variant="outline">Level 1</Badge>
                        </div>
                      </div>
                      
                      {/* Second level categories */}
                      <div className="ml-6 pl-6 border-l space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="cat1-1" />
                          <div className="flex flex-1 items-center justify-between">
                            <label htmlFor="cat1-1">Diesel (DSL)</label>
                            <Badge variant="outline">Level 2</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="cat1-2" />
                          <div className="flex flex-1 items-center justify-between">
                            <label htmlFor="cat1-2">Gasoline (GSL)</label>
                            <Badge variant="outline">Level 2</Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Another top level category */}
                      <div className="flex items-center gap-2 mt-4">
                        <Checkbox id="cat2" />
                        <div className="flex flex-1 items-center justify-between">
                          <label htmlFor="cat2" className="font-medium">Maintenance (MNT)</label>
                          <Badge variant="outline">Level 1</Badge>
                        </div>
                      </div>
                      
                      {/* Its subcategories */}
                      <div className="ml-6 pl-6 border-l space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox id="cat2-1" />
                          <div className="flex flex-1 items-center justify-between">
                            <label htmlFor="cat2-1">Parts (PRT)</label>
                            <Badge variant="outline">Level 2</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="cat2-2" />
                          <div className="flex flex-1 items-center justify-between">
                            <label htmlFor="cat2-2">Labor (LBR)</label>
                            <Badge variant="outline">Level 2</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Category Details</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Parent</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Fuel Expenses</TableCell>
                          <TableCell>FUE</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Diesel</TableCell>
                          <TableCell>DSL</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell>Fuel Expenses</TableCell>
                          <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Gasoline</TableCell>
                          <TableCell>GSL</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell>Fuel Expenses</TableCell>
                          <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Maintenance</TableCell>
                          <TableCell>MNT</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Parts</TableCell>
                          <TableCell>PRT</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell>Maintenance</TableCell>
                          <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8">Labor</TableCell>
                          <TableCell>LBR</TableCell>
                          <TableCell>2</TableCell>
                          <TableCell>Maintenance</TableCell>
                          <TableCell><Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "reports":
        return (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Financial reports for {currentVessel.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No reports available for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Reports will be generated based on financial data.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      // Budgets case handled in earlier switch statement
        
      // Expenses case handled in earlier switch statement
        
      // Vendors case handled in earlier switch statement
        
      // Categories case handled in earlier switch statement
        
      // Payroll case handled in earlier switch statement
        
      default:
        return (
          <div className="p-4 border rounded-md text-center">
            <p className="text-muted-foreground">
              Select a tab to view specific financial information for {currentVessel.name}.
            </p>
          </div>
        );
    }
  };

  // Handle adding new items based on the active tab
  const handleAddNew = () => {
    if (!currentVessel) return;
    
    switch (activeTab) {
      case "accounts":
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
      case "reports":
        // No add new functionality for reports
        break;
      default:
        // For other tabs, show a generic dialog
        setShowGenericDialog(true);
    }
  };

  // Form validation schemas
  const accountSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    accountNumber: z.string().min(1, "Account number is required"),
    balance: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    type: z.string().min(1, "Account type is required"),
    description: z.string().optional()
  });

  const expenseSchema = z.object({
    description: z.string().min(2, "Description required"),
    amount: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    date: z.string().min(1, "Date is required"),
    category: z.string().min(1, "Category is required"),
    accountId: z.string().min(1, "Account is required"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    referenceNumber: z.string().optional()
  });

  const budgetSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    amount: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    period: z.string().min(1, "Budget period is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    category: z.string().min(1, "Category is required")
  });
  
  const journalSchema = z.object({
    date: z.string().min(1, "Date is required"),
    reference: z.string().min(1, "Reference is required"),
    description: z.string().min(2, "Description must be at least 2 characters"),
    debit: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    credit: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    account: z.string().min(1, "Account is required")
  });
  
  const depositSchema = z.object({
    date: z.string().min(1, "Date is required"),
    accountId: z.string().min(1, "Account is required"),
    amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be greater than zero"),
    description: z.string().min(2, "Description must be at least 2 characters"),
    reference: z.string().optional(),
    depositType: z.string().min(1, "Deposit type is required"),
    depositMethod: z.string().min(1, "Deposit method is required")
  });
  
  const bankingSchema = z.object({
    accountName: z.string().min(2, "Account name must be at least 2 characters"),
    bankName: z.string().min(2, "Bank name must be at least 2 characters"),
    accountNumber: z.string().min(1, "Account number is required"),
    routingNumber: z.string().min(1, "Routing number is required"),
    balance: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number")
  });
  
  const payrollSchema = z.object({
    employeeName: z.string().min(2, "Employee name must be at least 2 characters"),
    position: z.string().min(1, "Position is required"),
    salary: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    paymentDate: z.string().min(1, "Payment date is required"),
    bankAccount: z.string().min(1, "Bank account is required"),
    taxCode: z.string().optional()
  });
  
  const vendorSchema = z.object({
    name: z.string().min(2, "Vendor name must be at least 2 characters"),
    contactPerson: z.string().min(2, "Contact person must be at least 2 characters"),
    email: z.string().email("Must be a valid email address"),
    phone: z.string().min(5, "Phone number is required"),
    address: z.string().min(5, "Address is required"),
    category: z.string().min(1, "Category is required")
  });
  
  const categorySchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    code: z.string().min(1, "Code is required"),
    description: z.string().optional(),
    parentCategoryId: z.string().nullable(),
    level: z.string(),
    isActive: z.boolean().default(true)
  });

  // Form setup
  const accountForm = useForm({
    defaultValues: {
      name: "",
      accountNumber: "",
      balance: "0.00",
      type: "asset",
      description: ""
    }
  });

  const expenseForm = useForm({
    defaultValues: {
      description: "",
      amount: "0.00",
      date: format(new Date(), "yyyy-MM-dd"),
      category: "",
      accountId: "",  // Add accountId field to link expense to a financial account
      paymentMethod: "bank_transfer",
      referenceNumber: ""
    }
  });

  const budgetForm = useForm({
    defaultValues: {
      name: "",
      amount: "0.00",
      period: "monthly",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd"),
      category: ""
    }
  });
  
  const journalForm = useForm({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      reference: "",
      description: "",
      debit: "0.00",
      credit: "0.00",
      account: ""
    }
  });
  
  const depositForm = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      accountId: "",
      amount: "0.00",
      description: "",
      reference: "",
      depositType: "income",
      depositMethod: "bank_transfer"
    }
  });
  
  const bankingForm = useForm({
    defaultValues: {
      accountName: "",
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      balance: "0.00"
    }
  });
  
  const payrollForm = useForm({
    defaultValues: {
      employeeName: "",
      position: "",
      salary: "0.00",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      bankAccount: "",
      taxCode: ""
    }
  });
  
  const vendorForm = useForm({
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      category: ""
    }
  });
  
  const categoryForm = useForm({
    defaultValues: {
      name: "",
      code: "",
      description: "",
      parentCategoryId: null as string | null,
      level: "1",
      isActive: true
    }
  });

  // Form submission handlers
  const onAccountSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      if (!currentVessel?.id) {
        throw new Error("No vessel selected");
      }
      
      // Convert form data to match API schema
      const accountData = {
        accountName: data.name,
        accountNumber: data.accountNumber,
        balance: data.balance,
        accountType: data.type,
        description: data.description,
        category: "operational", // Default category
        isActive: true,
        vesselId: currentVessel.id
      };
      
      // Check if we're editing or creating
      if (editingAccount) {
        // Make API call to update the account
        const result = await apiRequest(
          'PATCH',
          `/api/financial-accounts/${editingAccount.id}`,
          accountData
        );
        
        // Success handling for update
        toast({
          title: "Account updated successfully",
          description: `${data.name} has been updated in your chart of accounts`,
          variant: "default"
        });
      } else {
        // Make API call to create a new account
        const result = await apiRequest(
          'POST',
          '/api/financial-accounts',
          accountData
        );
        
        // Success handling for creation
        toast({
          title: "Account created successfully",
          description: `${data.name} has been added to your chart of accounts`,
          variant: "default"
        });
      }
      
      // Directly refresh accounts data to ensure UI is updated
      await refreshFinancialAccounts();
      
      // Reset the form and close the dialog
      setShowAccountDialog(false);
      setEditingAccount(null);
      accountForm.reset({
        name: "",
        accountNumber: "",
        balance: "0.00",
        type: "asset",
        description: ""
      });
      
    } catch (error) {
      console.error("Error with account operation:", error);
      toast({
        title: `Error ${editingAccount ? "updating" : "creating"} account`,
        description: `There was a problem ${editingAccount ? "updating" : "creating"} the account. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onExpenseSubmit = async (data: any) => {
    if (!currentVessel?.id) {
      toast({
        title: "Error",
        description: "No vessel selected. Please select a vessel first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First create a transaction
      const transactionData = {
        transactionType: "expense",
        transactionDate: new Date(data.date).toISOString(),
        amount: parseFloat(data.amount),
        currency: "EUR",
        description: data.description,
        vesselId: currentVessel.id,
      };
      
      console.log("Creating transaction:", transactionData);
      
      // Submit the transaction to create it first
      const transactionResponse = await apiRequest("POST", "/api/transactions", transactionData);
      const transaction = await transactionResponse.json();
      
      if (!transaction || !transaction.id) {
        throw new Error("Failed to create transaction");
      }
      
      // Format the expense data for API submission
      const expenseData = {
        transactionId: transaction.id,
        description: data.description,
        expenseDate: new Date(data.date).toISOString(),
        vesselId: currentVessel.id,
        paymentMethod: data.paymentMethod,
        total: parseFloat(data.amount),
        status: "submitted",
        category: data.category,
        accountId: parseInt(data.accountId), // Link to financial account
        referenceNumber: data.referenceNumber, // Include reference number for invoices/receipts
      };
      
      console.log("Submitting expense data:", expenseData);
      
      // Submit the expense to the API
      await apiRequest("POST", "/api/expenses", expenseData);
      
      // Directly refresh the accounts data to ensure UI is updated
      await refreshFinancialAccounts();
      
      // Invalidate other query caches to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/vessel', currentVessel.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/vessel', currentVessel.id] });
      
      toast({
        title: "Success",
        description: "Expense recorded successfully",
      });
      
      // Reset form and close dialog
      expenseForm.reset({
        description: "",
        amount: "0.00",
        date: format(new Date(), "yyyy-MM-dd"),
        category: "",
        accountId: "",
        paymentMethod: "bank_transfer",
        referenceNumber: ""
      });
      setShowExpenseDialog(false);
    } catch (error) {
      console.error("Error creating expense:", error);
      toast({
        title: "Error",
        description: "Failed to record expense. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBudgetSubmit = (data: any) => {
    console.log("New budget data:", data);
    setShowBudgetDialog(false);
    // Here you would call a mutation to create the budget
  };
  
  const onJournalSubmit = async (data: any) => {
    if (!currentVessel?.id) {
      toast({
        title: "Error",
        description: "No vessel selected. Please select a vessel first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format the data for API submission
      const journalData = {
        ...data,
        vesselId: currentVessel.id,
        date: data.date,
        debit: parseFloat(data.debit),
        credit: parseFloat(data.credit),
        // Add additional fields needed for the API
        status: "posted",
        createdById: 5, // Current admin user ID
      };

      // Submit the journal entry to the API
      await apiRequest("POST", `/api/journals`, journalData);
      
      // Invalidate journal query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
      
      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });
      
      journalForm.reset();
      setShowJournalDialog(false);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to create journal entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onDepositSubmit = async (data: any) => {
    if (!currentVessel?.id) {
      toast({
        title: "Error",
        description: "No vessel selected. Please select a vessel first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First create a transaction
      const transactionData = {
        transactionType: "deposit",
        transactionDate: new Date(data.date).toISOString(),
        amount: parseFloat(data.amount),
        currency: "EUR",
        description: data.description,
        vesselId: currentVessel.id,
        accountId: parseInt(data.accountId)
      };
      
      console.log("Creating deposit transaction:", transactionData);
      
      // Submit the transaction to create it first
      const transactionResponse = await apiRequest("POST", "/api/transactions", transactionData);
      const transaction = await transactionResponse.json();
      
      if (!transaction || !transaction.id) {
        throw new Error("Failed to create transaction");
      }
      
      // Format the deposit data for API submission
      const depositData = {
        transactionId: transaction.id,
        description: data.description,
        depositDate: new Date(data.date).toISOString(),
        vesselId: currentVessel.id,
        depositMethod: data.depositMethod,
        amount: parseFloat(data.amount),
        status: "completed",
        depositType: data.depositType,
        accountId: parseInt(data.accountId),
        reference: data.reference || ''
      };
      
      console.log("Submitting deposit data:", depositData);
      
      // Submit the deposit to the API
      await apiRequest("POST", "/api/deposits", depositData);
      
      // Refresh financial data
      await refreshFinancialAccounts();
      
      // Invalidate query caches to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/deposits/vessel', currentVessel.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/vessel', currentVessel.id] });
      
      toast({
        title: "Success",
        description: "Deposit recorded successfully",
      });
      
      // Reset form and close dialog
      depositForm.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        accountId: "",
        amount: "0.00",
        description: "",
        reference: "",
        depositType: "income",
        depositMethod: "bank_transfer"
      });
      setShowDepositDialog(false);
    } catch (error) {
      console.error("Error creating deposit:", error);
      toast({
        title: "Error",
        description: "Failed to record deposit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onBankingSubmit = (data: any) => {
    console.log("New banking data:", data);
    setShowBankingDialog(false);
    // Here you would call a mutation to create the banking record
  };
  
  const onPayrollSubmit = (data: any) => {
    console.log("New payroll data:", data);
    setShowPayrollDialog(false);
    // Here you would call a mutation to create the payroll record
  };
  
  const onVendorSubmit = (data: any) => {
    console.log("New vendor data:", data);
    setShowVendorDialog(false);
    // Here you would call a mutation to create the vendor
  };
  
  const onCategorySubmit = (data: any) => {
    console.log("New category data:", data);
    setShowCategoryDialog(false);
    // Here you would call a mutation to create the category
  };

  return (
    <MainLayout title="Financial Management">
      <TooltipProvider>
        <div className="w-full px-4 py-6">
          <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
            <div className="flex items-center gap-4">
              <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            </div>
          </div>
          
          {/* Vessel selector component */}
          {renderVesselSelector()}
          
          {/* Financial overview section */}
          {currentVessel && renderFinancialOverview()}
          
          <Tabs 
            defaultValue="accounts" 
            onValueChange={(value) => {
              console.log(`Tab changed to: ${value}`);
              setActiveTab(value);
            }} 
            value={activeTab}
          >
            <div className="flex justify-between items-center">
              <TabsList className="inline-flex h-12 items-center justify-between w-full max-w-5xl p-1 bg-muted/80 rounded-md border border-border">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="accounts" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="View and manage financial accounts"
                      >
                        <DollarSign className="h-4 w-4" /> Accounts
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View and manage financial accounts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="deposits" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Manage account deposits"
                      >
                        <Banknote className="h-4 w-4" /> Deposits
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Track and manage deposits to accounts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="banking" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Reconcile bank transactions"
                      >
                        <Building className="h-4 w-4" /> Banking
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reconcile bank transactions and manage accounts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="payroll" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Manage crew payroll and compensation"
                      >
                        <Users className="h-4 w-4" /> Payroll
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage crew payroll and compensation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="budgets" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Create and track financial budgets"
                      >
                        <Wallet className="h-4 w-4" /> Budgets
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Create and track financial budgets</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="expenses" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Track and categorize expenses"
                      >
                        <CreditCard className="h-4 w-4" /> Expenses
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Track and categorize expenses</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="vendors" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Manage supplier relationships"
                      >
                        <Building className="h-4 w-4" /> Vendors
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage supplier and vendor relationships</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="categories" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Organize financial categories"
                      >
                        <ListTree className="h-4 w-4" /> Categories
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Organize and manage financial categories</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="reports" 
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                                  data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                                  data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                                  focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        aria-label="Generate financial reports"
                      >
                        <FileText className="h-4 w-4" /> Reports
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate financial statements and reports</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsList>
              
              <div className="flex items-center gap-2">
                {currentVessel && activeTab !== "reports" && (
                  renderBulkImportButton(activeTab)
                )}
                
                {currentVessel && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddNew}
                          className="bg-background text-foreground border-primary/30 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
                          {activeTab === "reports" && "Generate Report"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Create a new {activeTab.slice(0, -1)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            
            <TabsContent value={activeTab} className="mt-6">
              {renderTabContent()}
            </TabsContent>
          </Tabs>
          
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
                  <FormField
                    control={accountForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Operating Account" 
                            aria-label="Account name"
                            aria-describedby="account-name-description"
                            className="focus-visible:ring-2 focus-visible:ring-primary/30"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription id="account-name-description" className="text-xs text-muted-foreground">
                          A descriptive name for this financial account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. AC12345678" 
                            aria-label="Account number"
                            aria-describedby="account-number-description"
                            className="focus-visible:ring-2 focus-visible:ring-primary/30"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription id="account-number-description" className="text-xs text-muted-foreground">
                          A unique reference code for this account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Balance (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                            <Input className="pl-6" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          aria-label="Select account type"
                          aria-describedby="account-type-description"
                        >
                          <FormControl>
                            <SelectTrigger className="focus-visible:ring-2 focus-visible:ring-primary/30">
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="asset">Asset</SelectItem>
                            <SelectItem value="liability">Liability</SelectItem>
                            <SelectItem value="equity">Equity</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription id="account-type-description" className="text-xs text-muted-foreground">
                          Determines how this account is categorized in financial reports
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Optional description" 
                            aria-label="Account description"
                            aria-describedby="description-help"
                            className="focus-visible:ring-2 focus-visible:ring-primary/30 min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription id="description-help" className="text-xs text-muted-foreground">
                          Additional details about this account's purpose or usage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="flex items-center justify-between gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAccountDialog(false)}
                      disabled={isSubmitting}
                      aria-label="Cancel account creation"
                      className="text-foreground hover:bg-muted/20 hover:text-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      aria-label={isSubmitting 
                        ? `${editingAccount ? 'Updating' : 'Creating'} account, please wait` 
                        : `${editingAccount ? 'Update' : 'Create'} financial account`
                      }
                      className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>{editingAccount ? 'Updating...' : 'Creating...'}</span>
                        </>
                      ) : (
                        editingAccount ? 'Update Account' : 'Create Account'
                      )}
                    </Button>
                  </DialogFooter>
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
              <Form {...expenseForm}>
                <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
                  <FormField
                    control={expenseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Fuel Purchase" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                            <Input className="pl-6" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fuel">Fuel</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="crew">Crew</SelectItem>
                            <SelectItem value="provisions">Provisions</SelectItem>
                            <SelectItem value="berthing">Berthing</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Add the account selection field */}
                  <FormField
                    control={expenseForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Account</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts && accounts.length > 0 ? (
                              accounts.map((account: { id: number; accountName: string; accountNumber: string }) => (
                                <SelectItem 
                                  key={account.id} 
                                  value={account.id.toString()}
                                >
                                  {account.accountName} ({account.accountNumber})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>No accounts available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the financial account to associate with this expense
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. INV-12345" {...field} />
                        </FormControl>
                        <FormDescription>
                          Invoice or receipt number for this expense
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      aria-disabled={isSubmitting}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Recording...
                        </>
                      ) : (
                        "Record Expense"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Add New Budget Dialog */}
          <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>
                  Set up a new budget for {currentVessel?.name}.
                </DialogDescription>
              </DialogHeader>
              <Form {...budgetForm}>
                <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
                  <FormField
                    control={budgetForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Q2 2025 Operating Budget" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={budgetForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Amount (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                            <Input className="pl-6" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={budgetForm.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={budgetForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={budgetForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={budgetForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="operations">Operations</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="crew">Crew</SelectItem>
                            <SelectItem value="docking">Docking & Berthing</SelectItem>
                            <SelectItem value="admin">Administration</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Budget</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Generic Dialog for other tabs */}
          <Dialog open={showGenericDialog} onOpenChange={setShowGenericDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}</DialogTitle>
                <DialogDescription>
                  This functionality is currently under development.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 text-center">
                <p className="text-muted-foreground">
                  The ability to add new {activeTab} will be available in an upcoming update.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowGenericDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add New Journal Entry Dialog */}
          <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Journal Entry</DialogTitle>
                <DialogDescription>
                  Create a new journal entry for {currentVessel?.name}.
                </DialogDescription>
              </DialogHeader>
              <Form {...journalForm}>
                <form onSubmit={journalForm.handleSubmit(onJournalSubmit)} className="space-y-4">
                  <FormField
                    control={journalForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={journalForm.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. JE001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={journalForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Monthly crew payment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={journalForm.control}
                      name="debit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Debit Amount (€)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                              <Input className="pl-6" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={journalForm.control}
                      name="credit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Amount (€)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                              <Input className="pl-6" placeholder="0.00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={journalForm.control}
                    name="account"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Show loading or empty state appropriately */}
                            {accountsLoading ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm">Loading accounts...</span>
                              </div>
                            ) : accounts?.length ? (
                              <>
                                {accounts.map((account: any) => (
                                  <SelectItem 
                                    key={account.id} 
                                    value={account.id.toString()}
                                    className="flex items-center gap-2"
                                  >
                                    <span>{account.accountName}</span>
                                    <span className="text-xs text-muted-foreground ml-1">({account.accountNumber})</span>
                                  </SelectItem>
                                ))}
                              </>
                            ) : (
                              <div className="py-2 text-center">
                                <span className="text-sm text-muted-foreground">No accounts found. Please create an account first.</span>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Journal Entry</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Add New Banking Dialog */}
          <Dialog open={showBankingDialog} onOpenChange={setShowBankingDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
                <DialogDescription>
                  Create a new bank account for {currentVessel?.name}.
                </DialogDescription>
              </DialogHeader>
              <Form {...bankingForm}>
                <form onSubmit={bankingForm.handleSubmit(onBankingSubmit)} className="space-y-4">
                  <FormField
                    control={bankingForm.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Main Account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bankingForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Maritime Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={bankingForm.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankingForm.control}
                      name="routingNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Routing Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 987654321" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={bankingForm.control}
                    name="balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Balance (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                            <Input className="pl-6" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Bank Account</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Add New Payroll Dialog */}
          <Dialog open={showPayrollDialog} onOpenChange={setShowPayrollDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Payroll Record</DialogTitle>
                <DialogDescription>
                  Create a new payroll record for {currentVessel?.name}.
                </DialogDescription>
              </DialogHeader>
              <Form {...payrollForm}>
                <form onSubmit={payrollForm.handleSubmit(onPayrollSubmit)} className="space-y-4">
                  <FormField
                    control={payrollForm.control}
                    name="employeeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={payrollForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="captain">Captain</SelectItem>
                            <SelectItem value="chief_engineer">Chief Engineer</SelectItem>
                            <SelectItem value="first_officer">First Officer</SelectItem>
                            <SelectItem value="deck_hand">Deck Hand</SelectItem>
                            <SelectItem value="steward">Steward</SelectItem>
                            <SelectItem value="chef">Chef</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={payrollForm.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                            <Input className="pl-6" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={payrollForm.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={payrollForm.control}
                    name="bankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. GB123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={payrollForm.control}
                    name="taxCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. TAX123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Payroll Record</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Add New Vendor Dialog */}
          <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Vendor</DialogTitle>
                <DialogDescription>
                  Create a new vendor for {currentVessel?.name}.
                </DialogDescription>
              </DialogHeader>
              <Form {...vendorForm}>
                <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-4">
                  <FormField
                    control={vendorForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Marine Supplies Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Brown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={vendorForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="e.g. contact@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={vendorForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. +44123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={vendorForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g. 123 Harbor Road, London, UK" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="supplies">Supplies</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="fuel">Fuel</SelectItem>
                            <SelectItem value="provisions">Provisions</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Vendor</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Add New Category Dialog */}
          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Financial Category</DialogTitle>
                <DialogDescription>
                  Create a new financial category for {currentVessel?.name}.
                </DialogDescription>
              </DialogHeader>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Fuel Expenses" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. FUE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g. All fuel related expenses" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="parentCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Category (Optional)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent category (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="null">None (Top-level category)</SelectItem>
                            <SelectItem value="1">Fuel Expenses</SelectItem>
                            <SelectItem value="2">Maintenance</SelectItem>
                            <SelectItem value="3">Crew Expenses</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          If this is a subcategory, select a parent category. Otherwise, leave as "None".
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Level 1 (Top-level)</SelectItem>
                            <SelectItem value="2">Level 2 (Subcategory)</SelectItem>
                            <SelectItem value="3">Level 3 (Sub-subcategory)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Active Category
                          </FormLabel>
                          <FormDescription>
                            Inactive categories won't appear in selection menus.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Category</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Deposit Dialog */}
          <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>New Deposit</DialogTitle>
                <DialogDescription>
                  Record a new deposit to an account
                </DialogDescription>
              </DialogHeader>
              <Form {...depositForm}>
                <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
                  <FormField
                    control={depositForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={depositForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accounts && accounts.length > 0 ? (
                              accounts.map((account: any) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.accountName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-accounts" disabled>
                                No accounts available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={depositForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (€)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2">€</span>
                            <Input className="pl-6" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={depositForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={depositForm.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter reference number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={depositForm.control}
                      name="depositType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                              <SelectItem value="investment">Investment</SelectItem>
                              <SelectItem value="refund">Refund</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={depositForm.control}
                      name="depositMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Create Deposit'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      </TooltipProvider>
    </MainLayout>
  );
};

export default FinancialManagement;