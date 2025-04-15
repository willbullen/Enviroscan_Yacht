import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/components/layout/MainLayout";
import ViewToggle, { ViewMode } from "@/components/ui/view-toggle";
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
  Globe, 
  ArrowLeftRight
} from "lucide-react";
import { format } from "date-fns";

const FinancialManagement: React.FC = () => {
  // State for view toggle (Card/Grid vs Table view)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARDS);
  const [activeTab, setActiveTab] = useState("accounts");

  // Mock data for initial UI development
  const mockAccounts = [
    { id: 1, accountNumber: "10001", accountName: "Operational Expenses", accountType: "expense", category: "operational", balance: 250000, isActive: true },
    { id: 2, accountNumber: "10002", accountName: "Maintenance Fund", accountType: "expense", category: "maintenance", balance: 180000, isActive: true },
    { id: 3, accountNumber: "10003", accountName: "Crew Salaries", accountType: "expense", category: "crew", balance: 320000, isActive: true },
    { id: 4, accountNumber: "10004", accountName: "Fuel Budget", accountType: "expense", category: "fuel", balance: 150000, isActive: true },
    { id: 5, accountNumber: "20001", accountName: "Charter Revenue", accountType: "income", category: "revenue", balance: 750000, isActive: true },
  ];

  const mockBudgets = [
    { id: 1, name: "Annual Operations", startDate: new Date(2025, 0, 1), endDate: new Date(2025, 11, 31), totalAmount: 1200000, currency: "USD", status: "active" },
    { id: 2, name: "Q2 Maintenance", startDate: new Date(2025, 3, 1), endDate: new Date(2025, 5, 30), totalAmount: 250000, currency: "USD", status: "planned" },
    { id: 3, name: "Summer Charter Season", startDate: new Date(2025, 5, 1), endDate: new Date(2025, 8, 30), totalAmount: 800000, currency: "USD", status: "active" },
  ];

  const mockExpenses = [
    { id: 1, description: "Engine Parts", amount: 12500, currency: "USD", transactionDate: new Date(2025, 3, 15), category: "maintenance", status: "paid", vendor: "Marine Engines Ltd" },
    { id: 2, description: "Crew Uniform", amount: 3200, currency: "USD", transactionDate: new Date(2025, 3, 12), category: "crew", status: "paid", vendor: "NavyStyle Uniforms" },
    { id: 3, description: "Fuel Purchase", amount: 28500, currency: "USD", transactionDate: new Date(2025, 3, 10), category: "fuel", status: "pending", vendor: "Marina Fuels Inc" },
    { id: 4, description: "Food Provisions", amount: 8900, currency: "USD", transactionDate: new Date(2025, 3, 8), category: "provisions", status: "paid", vendor: "Gourmet Supplies" },
  ];

  const mockInvoices = [
    { id: 1, invoiceNumber: "INV-2025-001", description: "Quarterly Maintenance", amount: 45000, currency: "USD", issueDate: new Date(2025, 3, 1), dueDate: new Date(2025, 4, 1), status: "paid", vendor: "Marine Maintenance Services" },
    { id: 2, invoiceNumber: "INV-2025-002", description: "Navigation System Update", amount: 12800, currency: "USD", issueDate: new Date(2025, 3, 5), dueDate: new Date(2025, 4, 5), status: "pending", vendor: "NavTech Systems" },
    { id: 3, invoiceNumber: "INV-2025-003", description: "Safety Equipment Inspection", amount: 3500, currency: "USD", issueDate: new Date(2025, 3, 8), dueDate: new Date(2025, 4, 8), status: "approved", vendor: "SafeSeas Inspections" },
  ];

  const mockVendors = [
    { id: 1, name: "Marine Maintenance Services", contactPerson: "John Smith", email: "john@marinemaintenance.com", phone: "+1-555-123-4567", category: "maintenance" },
    { id: 2, name: "NavTech Systems", contactPerson: "Emily Johnson", email: "emily@navtech.com", phone: "+1-555-234-5678", category: "electronics" },
    { id: 3, name: "Marina Fuels Inc", contactPerson: "Robert Davis", email: "robert@marinafuels.com", phone: "+1-555-345-6789", category: "fuel" },
    { id: 4, name: "Gourmet Supplies", contactPerson: "Sarah Williams", email: "sarah@gourmetsupplies.com", phone: "+1-555-456-7890", category: "provisions" },
  ];

  const mockReports = [
    { id: 1, title: "Q1 2025 Financial Summary", reportType: "quarterly_summary", startDate: new Date(2025, 0, 1), endDate: new Date(2025, 2, 31), creationDate: new Date(2025, 3, 5) },
    { id: 2, title: "Budget vs Actual - March 2025", reportType: "budget_comparison", startDate: new Date(2025, 2, 1), endDate: new Date(2025, 2, 31), creationDate: new Date(2025, 3, 3) },
    { id: 3, title: "Expense Analysis by Category", reportType: "expense_analysis", startDate: new Date(2025, 0, 1), endDate: new Date(2025, 2, 31), creationDate: new Date(2025, 3, 4) },
  ];

  // Column definitions for table views
  const accountColumns = [
    { header: "Account Number", accessorKey: "accountNumber" },
    { header: "Account Name", accessorKey: "accountName" },
    { header: "Type", accessorKey: "accountType", cell: ({ row }: any) => (
      <Badge variant={row.original.accountType === "income" ? "success" : "default"}>
        {row.original.accountType.charAt(0).toUpperCase() + row.original.accountType.slice(1)}
      </Badge>
    )},
    { header: "Category", accessorKey: "category", cell: ({ row }: any) => (
      <span className="capitalize">{row.original.category}</span>
    )},
    { header: "Balance", accessorKey: "balance", cell: ({ row }: any) => (
      <span className="font-mono">${Number(row.original.balance).toLocaleString()}</span>
    )},
    { header: "Status", accessorKey: "isActive", cell: ({ row }: any) => (
      <Badge variant={row.original.isActive ? "success" : "destructive"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    )},
  ];

  const budgetColumns = [
    { header: "Name", accessorKey: "name" },
    { header: "Period", accessorKey: "period", cell: ({ row }: any) => (
      <span>
        {format(row.original.startDate, "MMM d, yyyy")} - {format(row.original.endDate, "MMM d, yyyy")}
      </span>
    )},
    { header: "Amount", accessorKey: "totalAmount", cell: ({ row }: any) => (
      <span className="font-mono">${Number(row.original.totalAmount).toLocaleString()} {row.original.currency}</span>
    )},
    { header: "Status", accessorKey: "status", cell: ({ row }: any) => {
      let variant = "default";
      if (row.original.status === "active") variant = "success";
      if (row.original.status === "planned") variant = "outline";
      if (row.original.status === "closed") variant = "secondary";
      
      return (
        <Badge variant={variant as any}>
          <span className="capitalize">{row.original.status}</span>
        </Badge>
      );
    }},
  ];

  const expenseColumns = [
    { header: "Description", accessorKey: "description" },
    { header: "Amount", accessorKey: "amount", cell: ({ row }: any) => (
      <span className="font-mono">${Number(row.original.amount).toLocaleString()} {row.original.currency}</span>
    )},
    { header: "Date", accessorKey: "transactionDate", cell: ({ row }: any) => (
      format(row.original.transactionDate, "MMM d, yyyy")
    )},
    { header: "Category", accessorKey: "category", cell: ({ row }: any) => (
      <span className="capitalize">{row.original.category}</span>
    )},
    { header: "Vendor", accessorKey: "vendor" },
    { header: "Status", accessorKey: "status", cell: ({ row }: any) => {
      let variant = "default";
      if (row.original.status === "paid") variant = "success";
      if (row.original.status === "pending") variant = "outline";
      
      return (
        <Badge variant={variant as any}>
          <span className="capitalize">{row.original.status}</span>
        </Badge>
      );
    }},
  ];

  const invoiceColumns = [
    { header: "Invoice #", accessorKey: "invoiceNumber" },
    { header: "Description", accessorKey: "description" },
    { header: "Amount", accessorKey: "amount", cell: ({ row }: any) => (
      <span className="font-mono">${Number(row.original.amount).toLocaleString()} {row.original.currency}</span>
    )},
    { header: "Issue Date", accessorKey: "issueDate", cell: ({ row }: any) => (
      format(row.original.issueDate, "MMM d, yyyy")
    )},
    { header: "Due Date", accessorKey: "dueDate", cell: ({ row }: any) => (
      format(row.original.dueDate, "MMM d, yyyy")
    )},
    { header: "Vendor", accessorKey: "vendor" },
    { header: "Status", accessorKey: "status", cell: ({ row }: any) => {
      let variant = "default";
      if (row.original.status === "paid") variant = "success";
      if (row.original.status === "pending") variant = "outline";
      if (row.original.status === "approved") variant = "secondary";
      
      return (
        <Badge variant={variant as any}>
          <span className="capitalize">{row.original.status}</span>
        </Badge>
      );
    }},
  ];

  const vendorColumns = [
    { header: "Name", accessorKey: "name" },
    { header: "Contact Person", accessorKey: "contactPerson" },
    { header: "Email", accessorKey: "email" },
    { header: "Phone", accessorKey: "phone" },
    { header: "Category", accessorKey: "category", cell: ({ row }: any) => (
      <span className="capitalize">{row.original.category}</span>
    )},
  ];

  const reportColumns = [
    { header: "Title", accessorKey: "title" },
    { header: "Type", accessorKey: "reportType", cell: ({ row }: any) => (
      <span className="capitalize">{row.original.reportType.replace(/_/g, ' ')}</span>
    )},
    { header: "Period", accessorKey: "period", cell: ({ row }: any) => (
      <span>
        {format(row.original.startDate, "MMM d, yyyy")} - {format(row.original.endDate, "MMM d, yyyy")}
      </span>
    )},
    { header: "Creation Date", accessorKey: "creationDate", cell: ({ row }: any) => (
      format(row.original.creationDate, "MMM d, yyyy")
    )},
    { header: "Actions", id: "actions", cell: () => (
      <Button size="sm" variant="outline">Download</Button>
    )},
  ];

  // Function to render account cards when in card view
  const renderAccountCards = () => {
    return mockAccounts.map(account => (
      <Card key={account.id} className="overflow-hidden">
        <CardHeader className={`pb-2 ${account.accountType === 'income' ? 'bg-emerald-50/20 dark:bg-emerald-950/20' : 'bg-blue-50/20 dark:bg-blue-950/20'}`}>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" /> {account.accountName}
              </CardTitle>
              <CardDescription>#{account.accountNumber}</CardDescription>
            </div>
            <Badge variant={account.isActive ? "success" : "destructive"}>
              {account.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Type:</span>
              <span className="capitalize">{account.accountType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Category:</span>
              <span className="capitalize">{account.category}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="font-bold text-lg font-mono">${account.balance.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Function to render budget cards when in card view
  const renderBudgetCards = () => {
    return mockBudgets.map(budget => (
      <Card key={budget.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{budget.name}</CardTitle>
            <Badge 
              variant={
                budget.status === "active" ? "success" : 
                budget.status === "planned" ? "outline" : 
                "secondary"
              }
            >
              <span className="capitalize">{budget.status}</span>
            </Badge>
          </div>
          <CardDescription>
            {format(budget.startDate, "MMM d, yyyy")} - {format(budget.endDate, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Budget:</span>
              <span className="font-bold text-lg font-mono">${budget.totalAmount.toLocaleString()} {budget.currency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Remaining:</span>
              <span className="font-bold text-green-600 font-mono">${(budget.totalAmount * 0.65).toLocaleString()} {budget.currency}</span>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full" 
                  style={{ width: "35%" }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>35% Spent</span>
                <span>65% Remaining</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Function to render expense cards when in card view
  const renderExpenseCards = () => {
    return mockExpenses.map(expense => (
      <Card key={expense.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">{expense.description}</CardTitle>
            <Badge 
              variant={
                expense.status === "paid" ? "success" : 
                expense.status === "pending" ? "outline" : 
                "default"
              }
            >
              <span className="capitalize">{expense.status}</span>
            </Badge>
          </div>
          <CardDescription>
            {format(expense.transactionDate, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Amount:</span>
              <span className="font-bold text-lg font-mono">${expense.amount.toLocaleString()} {expense.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Category:</span>
              <span className="capitalize">{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Vendor:</span>
              <span>{expense.vendor}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Function to render invoice cards when in card view
  const renderInvoiceCards = () => {
    return mockInvoices.map(invoice => (
      <Card key={invoice.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> {invoice.invoiceNumber}
              </CardTitle>
              <CardDescription>{invoice.description}</CardDescription>
            </div>
            <Badge 
              variant={
                invoice.status === "paid" ? "success" : 
                invoice.status === "pending" ? "outline" :
                invoice.status === "approved" ? "secondary" :
                "default"
              }
            >
              <span className="capitalize">{invoice.status}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Amount:</span>
              <span className="font-bold text-lg font-mono">${invoice.amount.toLocaleString()} {invoice.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Vendor:</span>
              <span>{invoice.vendor}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-500">Issue: </span>
                <span>{format(invoice.issueDate, "MMM d, yyyy")}</span>
              </div>
              <div>
                <span className="text-gray-500">Due: </span>
                <span>{format(invoice.dueDate, "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Function to render vendor cards when in card view
  const renderVendorCards = () => {
    return mockVendors.map(vendor => (
      <Card key={vendor.id}>
        <CardHeader>
          <CardTitle className="text-lg">{vendor.name}</CardTitle>
          <CardDescription className="capitalize">{vendor.category}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">Contact Person</div>
              <div>{vendor.contactPerson}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div>{vendor.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div>{vendor.phone}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Function to render report cards when in card view
  const renderReportCards = () => {
    return mockReports.map(report => (
      <Card key={report.id}>
        <CardHeader>
          <CardTitle className="text-lg">{report.title}</CardTitle>
          <CardDescription>
            {format(report.creationDate, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Type:</span>
              <span className="capitalize">{report.reportType.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Period:</span>
              <span>
                {format(report.startDate, "MMM d")} - {format(report.endDate, "MMM d, yyyy")}
              </span>
            </div>
            <div className="pt-3">
              <Button size="sm" className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" /> Download Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Determines which content to render based on active tab and view
  const renderContent = () => {
    if (viewMode === ViewMode.LIST) {
      switch (activeTab) {
        case "accounts":
          return <DataTable columns={accountColumns} data={mockAccounts} />;
        case "budgets":
          return <DataTable columns={budgetColumns} data={mockBudgets} />;
        case "expenses":
          return <DataTable columns={expenseColumns} data={mockExpenses} />;
        case "invoices":
          return <DataTable columns={invoiceColumns} data={mockInvoices} />;
        case "vendors":
          return <DataTable columns={vendorColumns} data={mockVendors} />;
        case "reports":
          return <DataTable columns={reportColumns} data={mockReports} />;
        default:
          return null;
      }
    } else {
      // Card view rendering
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {activeTab === "accounts" && renderAccountCards()}
          {activeTab === "budgets" && renderBudgetCards()}
          {activeTab === "expenses" && renderExpenseCards()}
          {activeTab === "invoices" && renderInvoiceCards()}
          {activeTab === "vendors" && renderVendorCards()}
          {activeTab === "reports" && renderReportCards()}
        </div>
      );
    }
  };

  // Helper function to get the tab's button/action
  const getTabAction = () => {
    switch (activeTab) {
      case "accounts":
        return (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Account
          </Button>
        );
      case "budgets":
        return (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Budget
          </Button>
        );
      case "expenses":
        return (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Expense
          </Button>
        );
      case "invoices":
        return (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Invoice
          </Button>
        );
      case "vendors":
        return (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Vendor
          </Button>
        );
      case "reports":
        return (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Generate Report
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout title="Financial Management">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
            <p className="text-muted-foreground">Manage yacht finances, budgets, expenses, and reporting</p>
          </div>
          
          <div className="flex items-center gap-4">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
            {getTabAction()}
          </div>
        </div>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid grid-cols-6 w-full">
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Accounts
              </TabsTrigger>
              <TabsTrigger value="budgets" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" /> Budgets
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Expenses
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Invoices
              </TabsTrigger>
              <TabsTrigger value="vendors" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Vendors
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Reports
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {renderContent()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default FinancialManagement;