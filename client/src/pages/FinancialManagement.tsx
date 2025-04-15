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
  
  // Mock data for additional features (double-entry accounting, multi-currency, etc.)
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);

  // Mock data for initial UI development
  const mockAccounts = [
    { id: 1, accountNumber: "10001", accountName: "Operational Expenses", accountType: "expense", category: "operational", balance: 250000, isActive: true },
    { id: 2, accountNumber: "10002", accountName: "Maintenance Fund", accountType: "expense", category: "maintenance", balance: 180000, isActive: true },
    { id: 3, accountNumber: "10003", accountName: "Crew Salaries", accountType: "expense", category: "crew", balance: 320000, isActive: true },
    { id: 4, accountNumber: "10004", accountName: "Fuel Budget", accountType: "expense", category: "fuel", balance: 150000, isActive: true },
    { id: 5, accountNumber: "20001", accountName: "Charter Revenue", accountType: "income", category: "revenue", balance: 750000, isActive: true },
  ];
  
  // Mock data for journal entries (double-entry bookkeeping)
  const mockJournalEntries = [
    { 
      id: 1, 
      date: new Date(2025, 3, 5),
      description: "Monthly Engine Maintenance", 
      debitAccount: "Maintenance Expense", 
      creditAccount: "Cash", 
      amount: 12500, 
      currency: "USD",
      status: "posted",
      createdBy: "John Smith"
    },
    { 
      id: 2, 
      date: new Date(2025, 3, 10),
      description: "Charter Revenue", 
      debitAccount: "Accounts Receivable", 
      creditAccount: "Charter Revenue", 
      amount: 45000, 
      currency: "EUR",
      status: "posted",
      createdBy: "John Smith"
    },
    { 
      id: 3, 
      date: new Date(2025, 3, 15),
      description: "Crew Payroll", 
      debitAccount: "Crew Expense", 
      creditAccount: "Cash", 
      amount: 28000, 
      currency: "USD",
      status: "pending",
      createdBy: "Jane Doe"
    },
  ];
  
  // Mock data for bank accounts and reconciliation
  const mockBankAccounts = [
    { 
      id: 1, 
      accountName: "Operations Account", 
      accountNumber: "CHASE-12345", 
      bankName: "Chase", 
      currency: "USD", 
      currentBalance: 450000,
      lastReconciled: new Date(2025, 2, 31)
    },
    { 
      id: 2, 
      accountName: "Euro Operations", 
      accountNumber: "HSBC-67890", 
      bankName: "HSBC", 
      currency: "EUR", 
      currentBalance: 320000,
      lastReconciled: new Date(2025, 2, 15)
    }
  ];
  
  // Mock data for currency exchange rates
  const mockExchangeRates = [
    { from: "USD", to: "EUR", rate: 0.93, date: new Date(2025, 3, 15) },
    { from: "USD", to: "GBP", rate: 0.79, date: new Date(2025, 3, 15) },
    { from: "USD", to: "JPY", rate: 153.45, date: new Date(2025, 3, 15) },
    { from: "EUR", to: "USD", rate: 1.07, date: new Date(2025, 3, 15) },
    { from: "GBP", to: "USD", rate: 1.27, date: new Date(2025, 3, 15) },
  ];

  // Mock data for payroll
  const mockPayrollData = [
    { 
      id: 1, 
      name: "April 2025 Crew Payroll", 
      periodStart: new Date(2025, 3, 1),
      periodEnd: new Date(2025, 3, 15),
      totalGross: 45000,
      totalTax: 9000,
      totalNet: 36000,
      status: "processed",
      processDate: new Date(2025, 3, 16),
      employeeCount: 12
    },
    { 
      id: 2, 
      name: "March 2025 Crew Payroll", 
      periodStart: new Date(2025, 2, 16),
      periodEnd: new Date(2025, 2, 31),
      totalGross: 44000,
      totalTax: 8800,
      totalNet: 35200,
      status: "paid",
      processDate: new Date(2025, 3, 1),
      employeeCount: 12
    }
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
  
  // Journal entries columns for double-entry bookkeeping
  const journalEntryColumns = [
    { header: "Date", accessorKey: "date", cell: ({ row }: any) => (
      format(row.original.date, "MMM d, yyyy")
    )},
    { header: "Description", accessorKey: "description" },
    { header: "Debit Account", accessorKey: "debitAccount" },
    { header: "Credit Account", accessorKey: "creditAccount" },
    { header: "Amount", accessorKey: "amount", cell: ({ row }: any) => (
      <span className="font-mono">
        {row.original.currency === "USD" ? "$" : row.original.currency === "EUR" ? "€" : ""}
        {Number(row.original.amount).toLocaleString()} {row.original.currency !== "USD" && row.original.currency !== "EUR" ? row.original.currency : ""}
      </span>
    )},
    { header: "Status", accessorKey: "status", cell: ({ row }: any) => {
      let variant = "default";
      if (row.original.status === "posted") variant = "success";
      if (row.original.status === "pending") variant = "outline";
      
      return (
        <Badge variant={variant as any}>
          <span className="capitalize">{row.original.status}</span>
        </Badge>
      );
    }},
    { header: "Created By", accessorKey: "createdBy" },
  ];
  
  // Bank account columns
  const bankAccountColumns = [
    { header: "Account Name", accessorKey: "accountName" },
    { header: "Account Number", accessorKey: "accountNumber" },
    { header: "Bank", accessorKey: "bankName" },
    { header: "Currency", accessorKey: "currency" },
    { header: "Current Balance", accessorKey: "currentBalance", cell: ({ row }: any) => (
      <span className="font-mono">
        {row.original.currency === "USD" ? "$" : row.original.currency === "EUR" ? "€" : ""}
        {Number(row.original.currentBalance).toLocaleString()} {row.original.currency !== "USD" && row.original.currency !== "EUR" ? row.original.currency : ""}
      </span>
    )},
    { header: "Last Reconciled", accessorKey: "lastReconciled", cell: ({ row }: any) => (
      format(row.original.lastReconciled, "MMM d, yyyy")
    )},
  ];
  
  // Exchange rate columns
  const exchangeRateColumns = [
    { header: "From", accessorKey: "from" },
    { header: "To", accessorKey: "to" },
    { header: "Rate", accessorKey: "rate", cell: ({ row }: any) => (
      <span className="font-mono">{row.original.rate.toFixed(4)}</span>
    )},
    { header: "Date", accessorKey: "date", cell: ({ row }: any) => (
      format(row.original.date, "MMM d, yyyy")
    )},
  ];
  
  // Payroll columns
  const payrollColumns = [
    { header: "Name", accessorKey: "name" },
    { header: "Period", accessorKey: "period", cell: ({ row }: any) => (
      <span>
        {format(row.original.periodStart, "MMM d, yyyy")} - {format(row.original.periodEnd, "MMM d, yyyy")}
      </span>
    )},
    { header: "Gross", accessorKey: "totalGross", cell: ({ row }: any) => (
      <span className="font-mono">${Number(row.original.totalGross).toLocaleString()}</span>
    )},
    { header: "Tax", accessorKey: "totalTax", cell: ({ row }: any) => (
      <span className="font-mono">${Number(row.original.totalTax).toLocaleString()}</span>
    )},
    { header: "Net", accessorKey: "totalNet", cell: ({ row }: any) => (
      <span className="font-mono">${Number(row.original.totalNet).toLocaleString()}</span>
    )},
    { header: "Status", accessorKey: "status", cell: ({ row }: any) => {
      let variant = "default";
      if (row.original.status === "processed") variant = "outline";
      if (row.original.status === "paid") variant = "success";
      
      return (
        <Badge variant={variant as any}>
          <span className="capitalize">{row.original.status}</span>
        </Badge>
      );
    }},
    { header: "Employees", accessorKey: "employeeCount" },
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
  
  // Function to render journal entry cards when in card view
  const renderJournalEntryCards = () => {
    return mockJournalEntries.map(entry => (
      <Card key={entry.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> {entry.description}
              </CardTitle>
              <CardDescription>{format(entry.date, "MMM d, yyyy")}</CardDescription>
            </div>
            <Badge 
              variant={
                entry.status === "posted" ? "success" : 
                entry.status === "pending" ? "outline" :
                "default"
              }
            >
              <span className="capitalize">{entry.status}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Debit:</span>
              <span>{entry.debitAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Credit:</span>
              <span>{entry.creditAccount}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Amount:</span>
              <span className="font-bold text-lg font-mono">
                {entry.currency === "USD" ? "$" : entry.currency === "EUR" ? "€" : ""}
                {entry.amount.toLocaleString()} {entry.currency !== "USD" && entry.currency !== "EUR" ? entry.currency : ""}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Created by:</span>
              <span>{entry.createdBy}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };
  
  // Function to render bank account cards when in card view
  const renderBankAccountCards = () => {
    return mockBankAccounts.map(account => (
      <Card key={account.id} className="overflow-hidden">
        <CardHeader className="pb-2 bg-blue-50/20 dark:bg-blue-950/20">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" /> {account.accountName}
              </CardTitle>
              <CardDescription>{account.bankName} • {account.accountNumber}</CardDescription>
            </div>
            <Badge>{account.currency}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <span className="font-bold text-lg font-mono">
                {account.currency === "USD" ? "$" : account.currency === "EUR" ? "€" : ""}
                {account.currentBalance.toLocaleString()} {account.currency !== "USD" && account.currency !== "EUR" ? account.currency : ""}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Reconciled:</span>
              <span>{format(account.lastReconciled, "MMM d, yyyy")}</span>
            </div>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="w-full">Reconcile</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };
  
  // Function to render exchange rate cards when in card view
  const renderExchangeRateCards = () => {
    return mockExchangeRates.map((rate, index) => (
      <Card key={index} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" /> {rate.from} to {rate.to}
            </CardTitle>
          </div>
          <CardDescription>{format(rate.date, "MMM d, yyyy")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rate:</span>
              <span className="font-bold text-lg font-mono">{rate.rate.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">Example:</span>
              <span className="font-mono">
                1.00 {rate.from} = {rate.rate.toFixed(4)} {rate.to}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };
  
  // Function to render payroll cards when in card view
  const renderPayrollCards = () => {
    return mockPayrollData.map(payroll => (
      <Card key={payroll.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" /> {payroll.name}
              </CardTitle>
              <CardDescription>
                {format(payroll.periodStart, "MMM d, yyyy")} - {format(payroll.periodEnd, "MMM d, yyyy")}
              </CardDescription>
            </div>
            <Badge 
              variant={
                payroll.status === "processed" ? "outline" : 
                payroll.status === "paid" ? "success" : 
                "default"
              }
            >
              <span className="capitalize">{payroll.status}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Employees:</span>
              <span>{payroll.employeeCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Process Date:</span>
              <span>{format(payroll.processDate, "MMM d, yyyy")}</span>
            </div>
            <Separator className="my-2" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm text-gray-500">Gross</div>
                <div className="font-bold font-mono">${payroll.totalGross.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Tax</div>
                <div className="font-bold font-mono">${payroll.totalTax.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Net</div>
                <div className="font-bold font-mono">${payroll.totalNet.toLocaleString()}</div>
              </div>
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
        case "journals":
          return <DataTable columns={journalEntryColumns} data={mockJournalEntries} />;
        case "banking":
          return <DataTable columns={bankAccountColumns} data={mockBankAccounts} />;
        case "currencies":
          return <DataTable columns={exchangeRateColumns} data={mockExchangeRates} />;
        case "payroll":
          return <DataTable columns={payrollColumns} data={mockPayrollData} />;
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
          {activeTab === "journals" && renderJournalEntryCards()}
          {activeTab === "banking" && renderBankAccountCards()}
          {activeTab === "currencies" && renderExchangeRateCards()}
          {activeTab === "payroll" && renderPayrollCards()}
          {activeTab === "budgets" && renderBudgetCards()}
          {activeTab === "expenses" && renderExpenseCards()}
          {activeTab === "invoices" && renderInvoiceCards()}
          {activeTab === "vendors" && renderVendorCards()}
          {activeTab === "reports" && renderReportCards()}
        </div>
      );
    }
  };

  // State for managing dialogs
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [showNewJournalDialog, setShowNewJournalDialog] = useState(false);
  const [showNewBankAccountDialog, setShowNewBankAccountDialog] = useState(false);
  const [showNewRateDialog, setShowNewRateDialog] = useState(false);
  const [showNewPayrollDialog, setShowNewPayrollDialog] = useState(false);
  const [showNewBudgetDialog, setShowNewBudgetDialog] = useState(false);
  const [showNewExpenseDialog, setShowNewExpenseDialog] = useState(false);
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [showNewVendorDialog, setShowNewVendorDialog] = useState(false);
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  
  // Helper function to get the tab's button/action
  const getTabAction = () => {
    switch (activeTab) {
      case "accounts":
        return (
          <Button onClick={() => setShowNewAccountDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Account
          </Button>
        );
      case "journals":
        return (
          <Button onClick={() => setShowNewJournalDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Journal Entry
          </Button>
        );
      case "banking":
        return (
          <Button onClick={() => setShowNewBankAccountDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Bank Account
          </Button>
        );
      case "currencies":
        return (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCurrencyConverter(!showCurrencyConverter)}>
              <ArrowLeftRight className="h-4 w-4 mr-2" /> Convert
            </Button>
            <Button onClick={() => setShowNewRateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Rate
            </Button>
          </div>
        );
      case "payroll":
        return (
          <Button onClick={() => setShowNewPayrollDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Payroll Run
          </Button>
        );
      case "budgets":
        return (
          <Button onClick={() => setShowNewBudgetDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Budget
          </Button>
        );
      case "expenses":
        return (
          <Button onClick={() => setShowNewExpenseDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Expense
          </Button>
        );
      case "invoices":
        return (
          <Button onClick={() => setShowNewInvoiceDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Invoice
          </Button>
        );
      case "vendors":
        return (
          <Button onClick={() => setShowNewVendorDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Vendor
          </Button>
        );
      case "reports":
        return (
          <Button onClick={() => setShowNewReportDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Generate Report
          </Button>
        );
      default:
        return null;
    }
  };

  // Currency Converter Dialog
  const CurrencyConverterDialog = () => {
    const [amount, setAmount] = useState<number>(1);
    const [fromCurrency, setFromCurrency] = useState<string>("USD");
    const [toCurrency, setToCurrency] = useState<string>("EUR");
    const [result, setResult] = useState<number | null>(null);
    
    const handleConvert = () => {
      const rate = mockExchangeRates.find(
        r => r.from === fromCurrency && r.to === toCurrency
      );
      
      if (rate) {
        setResult(amount * rate.rate);
      } else {
        // Try to find reverse rate and invert it
        const reverseRate = mockExchangeRates.find(
          r => r.from === toCurrency && r.to === fromCurrency
        );
        
        if (reverseRate) {
          setResult(amount / reverseRate.rate);
        } else {
          setResult(null);
        }
      }
    };
    
    const uniqueCurrencies = Array.from(
      new Set(mockExchangeRates.flatMap(rate => [rate.from, rate.to]))
    );
    
    return (
      <Dialog open={showCurrencyConverter} onOpenChange={setShowCurrencyConverter}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Currency Converter</DialogTitle>
            <DialogDescription>
              Convert between currencies using latest exchange rates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fromCurrency" className="text-right">
                From
              </Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCurrencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="toCurrency" className="text-right">
                To
              </Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCurrencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {result !== null && (
              <div className="mt-2 text-center font-bold text-lg">
                {amount.toFixed(2)} {fromCurrency} = {result.toFixed(2)} {toCurrency}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2 flex-row items-center">
            <Button variant="outline" onClick={() => setShowCurrencyConverter(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvert}>
              Convert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // New Account Dialog
  const NewAccountDialog = () => {
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountType, setAccountType] = useState("expense");
    const [category, setCategory] = useState("");
    
    const handleSubmit = () => {
      // In a real application, this would make an API call to create the account
      // For demo purposes, we'll just log the values and close the dialog
      console.log("Creating new account:", { accountNumber, accountName, accountType, category });
      setShowNewAccountDialog(false);
      
      // Reset form values
      setAccountNumber("");
      setAccountName("");
      setAccountType("expense");
      setCategory("");
    };
    
    return (
      <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new account to your chart of accounts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountNumber" className="text-right">
                Account #
              </Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountName" className="text-right">
                Name
              </Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountType" className="text-right">
                Type
              </Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAccountDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit}>
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // New Journal Entry Dialog
  const NewJournalEntryDialog = () => {
    return (
      <Dialog open={showNewJournalDialog} onOpenChange={setShowNewJournalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
            <DialogDescription>
              Create a new journal entry in the general ledger.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Form fields would go here */}
            <p className="text-center text-muted-foreground">
              Journal entry form under development
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJournalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowNewJournalDialog(false)}>
              Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
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
        
        {/* Dialogs */}
        <CurrencyConverterDialog />
        <NewAccountDialog />
        <NewJournalEntryDialog />
        
        {/* Bank Account Dialog */}
        <Dialog open={showNewBankAccountDialog} onOpenChange={setShowNewBankAccountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Bank Account</DialogTitle>
              <DialogDescription>
                Add details for a new bank account or credit card.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-center text-muted-foreground">
                Bank account form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBankAccountDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewBankAccountDialog(false)}>Add Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Exchange Rate Dialog */}
        <Dialog open={showNewRateDialog} onOpenChange={setShowNewRateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exchange Rate</DialogTitle>
              <DialogDescription>
                Add a new currency exchange rate to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-center text-muted-foreground">
                Exchange rate form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRateDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewRateDialog(false)}>Add Rate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Payroll Dialog */}
        <Dialog open={showNewPayrollDialog} onOpenChange={setShowNewPayrollDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Start New Payroll Run</DialogTitle>
              <DialogDescription>
                Process payroll for crew members for a specific period.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-center text-muted-foreground">
                Payroll processing form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPayrollDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewPayrollDialog(false)}>Start Payroll Run</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Budget Dialog */}
        <Dialog open={showNewBudgetDialog} onOpenChange={setShowNewBudgetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Create a new budget for a specific period.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-center text-muted-foreground">
                Budget creation form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBudgetDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewBudgetDialog(false)}>Create Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add placeholders for other dialogs (expense, invoice, vendor, report) */}
        <Dialog open={showNewExpenseDialog} onOpenChange={setShowNewExpenseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                Expense form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewExpenseDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewExpenseDialog(false)}>Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                Invoice form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewInvoiceDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewInvoiceDialog(false)}>Create Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showNewVendorDialog} onOpenChange={setShowNewVendorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                Vendor form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewVendorDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewVendorDialog(false)}>Add Vendor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                Report generation form under development
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewReportDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewReportDialog(false)}>Generate Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 max-w-full overflow-x-auto py-2 flex flex-nowrap">
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Accounts
              </TabsTrigger>
              <TabsTrigger value="journals" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Journal Entries
              </TabsTrigger>
              <TabsTrigger value="banking" className="flex items-center gap-2">
                <Building className="h-4 w-4" /> Banking
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
              <TabsTrigger value="payroll" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Payroll
              </TabsTrigger>
              <TabsTrigger value="currencies" className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Currencies
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