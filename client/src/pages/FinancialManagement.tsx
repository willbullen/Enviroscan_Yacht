import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import MainLayout from "@/components/layout/MainLayout";
import ViewToggle, { ViewMode } from "@/components/ui/view-toggle";
import BatchImportDialog from "@/components/BatchImportDialog";
import { useVessel } from "@/contexts/VesselContext";
import { 
  DollarSign, 
  Wallet, 
  CreditCard, 
  FileText, 
  BarChart4, 
  Calendar, 
  Plus, 
  Building, 
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
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FinancialManagement: React.FC = () => {
  // State for view toggle (Card/Grid vs Table view)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARDS);
  const [activeTab, setActiveTab] = useState("accounts");
  
  // Dialog states for adding new items
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showGenericDialog, setShowGenericDialog] = useState(false);
  
  // Get current vessel from context to filter financial data
  const { currentVessel } = useVessel();
  
  // Load vessel-specific financial data
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/transactions`, currentVessel?.id],
    queryFn: () => [],
    enabled: !!currentVessel?.id
  });
  
  // Load vessel accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: [`/api/accounts`, currentVessel?.id],
    queryFn: () => [],
    enabled: !!currentVessel?.id
  });
  
  // Load vessel expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: [`/api/expenses`, currentVessel?.id],
    queryFn: () => [],
    enabled: !!currentVessel?.id
  });
  
  // Load vessel income
  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: [`/api/income`, currentVessel?.id],
    queryFn: () => [],
    enabled: !!currentVessel?.id
  });
  
  // Load vessel budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: [`/api/budgets`, currentVessel?.id],
    queryFn: () => [],
    enabled: !!currentVessel?.id
  });

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0.00</div>
            <p className="text-xs text-muted-foreground">For selected vessel</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€0.00</div>
            <p className="text-xs text-muted-foreground">For selected vessel</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Of current budget</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
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
    expenses: "date,amount,category,description,paymentMethod,vesselId,reference\n2025-01-05,1500.00,Fuel,Diesel refill,bank_transfer,1,INV12345\n2025-01-10,350.00,Provisions,Crew food supplies,credit_card,1,REC67890"
  };

  // Function to create a bulk import button for a specific section
  const renderBulkImportButton = (section: string) => {
    const template = templateData[section as keyof typeof templateData] || "";
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 ml-auto mb-4">
            <FileUp className="h-4 w-4" /> Bulk Import {sectionName}
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
  const renderTabContent = () => {
    if (!currentVessel) {
      return (
        <div className="p-8 text-center border rounded-md bg-muted/10">
          <p className="text-muted-foreground">Please select a vessel to view financial data.</p>
        </div>
      );
    }
    
    const isLoading = transactionsLoading || accountsLoading || expensesLoading || incomeLoading || budgetsLoading;
    
    if (isLoading) {
      return (
        <div className="p-8 text-center border rounded-md">
          <p className="text-muted-foreground">Loading financial data for {currentVessel.name}...</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case "accounts":
        return (
          <div>
            {renderBulkImportButton('accounts')}
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>Financial accounts for {currentVessel.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No accounts found for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Accounts will appear here once added.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "journals":
        return (
          <div>
            {renderBulkImportButton('journals')}
            <Card>
              <CardHeader>
                <CardTitle>Journal Entries</CardTitle>
                <CardDescription>Financial journals for {currentVessel.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No journals found for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Journals will appear here once added.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case "banking":
        return (
          <div>
            {renderBulkImportButton('banking')}
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
            {renderBulkImportButton('payroll')}
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
            {renderBulkImportButton('expenses')}
            <Card>
              <CardHeader>
                <CardTitle>Expense Tracking</CardTitle>
                <CardDescription>Expenses for {currentVessel.name}</CardDescription>
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
        return (
          <div>
            {renderBulkImportButton('budgets')}
            <Card>
              <CardHeader>
                <CardTitle>Budget Management</CardTitle>
                <CardDescription>Budgets for {currentVessel.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-4 text-center">
                  <p className="text-muted-foreground">No budgets found for this vessel.</p>
                  <p className="text-sm text-muted-foreground mt-2">Budgets will appear here once added.</p>
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
      case "invoices":
        setShowInvoiceDialog(true);
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
    paymentMethod: z.string().min(1, "Payment method is required")
  });

  const budgetSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    amount: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    period: z.string().min(1, "Budget period is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    category: z.string().min(1, "Category is required")
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
      paymentMethod: "bank_transfer"
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

  // Form submission handlers
  const onAccountSubmit = (data: any) => {
    console.log("New account data:", data);
    setShowAccountDialog(false);
    // Here you would call a mutation to create the account
  };

  const onExpenseSubmit = (data: any) => {
    console.log("New expense data:", data);
    setShowExpenseDialog(false);
    // Here you would call a mutation to create the expense
  };

  const onBudgetSubmit = (data: any) => {
    console.log("New budget data:", data);
    setShowBudgetDialog(false);
    // Here you would call a mutation to create the budget
  };

  return (
    <MainLayout title="Financial Management">
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
          
          <Tabs defaultValue="accounts" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex justify-between items-center">
              <TabsList className="grid grid-cols-7 w-full max-w-4xl">
                <TabsTrigger value="accounts" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <DollarSign className="h-4 w-4" /> Accounts
                </TabsTrigger>
                <TabsTrigger value="journals" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <ListTree className="h-4 w-4" /> Journals
                </TabsTrigger>
                <TabsTrigger value="banking" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Building className="h-4 w-4" /> Banking
                </TabsTrigger>
                <TabsTrigger value="payroll" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Users className="h-4 w-4" /> Payroll
                </TabsTrigger>
                <TabsTrigger value="budgets" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Wallet className="h-4 w-4" /> Budgets
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <CreditCard className="h-4 w-4" /> Expenses
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <FileText className="h-4 w-4" /> Reports
                </TabsTrigger>
              </TabsList>
              
              {currentVessel && (
                <Button variant="outline" size="sm" onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              )}
            </div>
            
            <TabsContent value={activeTab} className="mt-6">
              {renderTabContent()}
            </TabsContent>
          </Tabs>
          
          {/* Add New Account Dialog */}
          <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Create a new financial account for {currentVessel?.name}.
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
                          <Input placeholder="e.g. Operating Account" {...field} />
                        </FormControl>
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
                          <Input placeholder="e.g. AC12345678" {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                          <Textarea placeholder="Optional description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Account</Button>
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
                    <Button type="submit">Record Expense</Button>
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
        </div>
      </div>
    </MainLayout>
  );
};

export default FinancialManagement;