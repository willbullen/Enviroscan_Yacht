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
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [showBankingDialog, setShowBankingDialog] = useState(false);
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
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
        <Card className="bg-background border-primary/20 border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€0.00</div>
            <p className="text-xs text-muted-foreground">For selected vessel</p>
          </CardContent>
        </Card>
        
        <Card className="bg-background border-primary/20 border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€0.00</div>
            <p className="text-xs text-muted-foreground">For selected vessel</p>
          </CardContent>
        </Card>
        
        <Card className="bg-background border-primary/20 border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0%</div>
            <p className="text-xs text-muted-foreground">Of current budget</p>
          </CardContent>
        </Card>
        
        <Card className="bg-background border-primary/20 border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Open Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
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
        
      case "vendors":
        return (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Vendor Management</CardTitle>
                <CardDescription>Vendors for {currentVessel.name}</CardDescription>
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
      case "journals":
        setShowJournalDialog(true);
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
  
  const journalSchema = z.object({
    date: z.string().min(1, "Date is required"),
    reference: z.string().min(1, "Reference is required"),
    description: z.string().min(2, "Description must be at least 2 characters"),
    debit: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    credit: z.string().refine(val => !isNaN(parseFloat(val)), "Must be a valid number"),
    account: z.string().min(1, "Account is required")
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
  
  const onJournalSubmit = (data: any) => {
    console.log("New journal entry data:", data);
    setShowJournalDialog(false);
    // Here you would call a mutation to create the journal entry
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
          
          <Tabs defaultValue="accounts" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex justify-between items-center">
              <TabsList className="inline-flex h-12 items-center justify-between w-full max-w-5xl p-1 bg-muted/80 rounded-md border border-border">
                <TabsTrigger 
                  value="accounts" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <DollarSign className="h-4 w-4" /> Accounts
                </TabsTrigger>
                <TabsTrigger 
                  value="journals" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <ListTree className="h-4 w-4" /> Journals
                </TabsTrigger>
                <TabsTrigger 
                  value="banking" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <Building className="h-4 w-4" /> Banking
                </TabsTrigger>
                <TabsTrigger 
                  value="payroll" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <Users className="h-4 w-4" /> Payroll
                </TabsTrigger>
                <TabsTrigger 
                  value="budgets" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <Wallet className="h-4 w-4" /> Budgets
                </TabsTrigger>
                <TabsTrigger 
                  value="expenses" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <CreditCard className="h-4 w-4" /> Expenses
                </TabsTrigger>
                <TabsTrigger 
                  value="vendors" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <Building className="h-4 w-4" /> Vendors
                </TabsTrigger>
                <TabsTrigger 
                  value="categories" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <ListTree className="h-4 w-4" /> Categories
                </TabsTrigger>
                <TabsTrigger 
                  value="reports" 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-foreground/80 
                            data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow 
                            data-[state=active]:font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary 
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <FileText className="h-4 w-4" /> Reports
                </TabsTrigger>
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
                          {activeTab === "journals" && "New Journal Entry"}
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
                            <SelectItem value="operating_account">Operating Account</SelectItem>
                            <SelectItem value="crew_expenses">Crew Expenses</SelectItem>
                            <SelectItem value="maintenance_expenses">Maintenance Expenses</SelectItem>
                            <SelectItem value="fuel_expenses">Fuel Expenses</SelectItem>
                            <SelectItem value="berthing_expenses">Berthing Expenses</SelectItem>
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
        </div>
      </div>
      </TooltipProvider>
    </MainLayout>
  );
};

export default FinancialManagement;