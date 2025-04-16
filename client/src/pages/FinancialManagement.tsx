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
import MainLayout from "@/components/layout/MainLayout";
import ViewToggle, { ViewMode } from "@/components/ui/view-toggle";
import BatchImportDialog from "@/components/BatchImportDialog";
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
  ArrowLeftRight,
  Pencil,
  ListTree,
  FileUp,
  Trash
} from "lucide-react";
import { format } from "date-fns";

const FinancialManagement: React.FC = () => {
  // State for view toggle (Card/Grid vs Table view)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARDS);
  const [activeTab, setActiveTab] = useState("accounts");
  
  // Mock data for additional features (double-entry accounting, multi-currency, etc.)
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);

  // Mock data for account categories and subcategories
  const mockAccountCategories = [
    { 
      id: 1, 
      name: "Operational", 
      type: "expense",
      subcategories: [
        { id: 101, name: "General Operations" },
        { id: 102, name: "Port Fees" },
        { id: 103, name: "Administrative" }
      ]
    },
    { 
      id: 2, 
      name: "Maintenance", 
      type: "expense",
      subcategories: [
        { id: 201, name: "Engine" },
        { id: 202, name: "Hull" },
        { id: 203, name: "Interior" },
        { id: 204, name: "Electronics" }
      ]
    },
    { 
      id: 3, 
      name: "Crew", 
      type: "expense",
      subcategories: [
        { id: 301, name: "Salaries" },
        { id: 302, name: "Benefits" },
        { id: 303, name: "Training" },
        { id: 304, name: "Uniforms" }
      ]
    },
    { 
      id: 4, 
      name: "Fuel", 
      type: "expense",
      subcategories: [
        { id: 401, name: "Main Engines" },
        { id: 402, name: "Generators" },
        { id: 403, name: "Tenders" }
      ]
    },
    { 
      id: 5, 
      name: "Revenue", 
      type: "income",
      subcategories: [
        { id: 501, name: "Charter" },
        { id: 502, name: "Owner Usage" },
        { id: 503, name: "Special Events" }
      ]
    },
    { 
      id: 6, 
      name: "Assets", 
      type: "asset",
      subcategories: [
        { id: 601, name: "Current Assets" },
        { id: 602, name: "Fixed Assets" },
        { id: 603, name: "Long-term Investments" }
      ]
    },
    { 
      id: 7, 
      name: "Liabilities", 
      type: "liability",
      subcategories: [
        { id: 701, name: "Current Liabilities" },
        { id: 702, name: "Long-term Liabilities" }
      ]
    }
  ];

  // Mock data for initial UI development
  const mockAccounts = [
    { id: 1, accountNumber: "10001", accountName: "Operational Expenses", accountType: "expense", categoryId: 1, subcategoryId: 101, balance: 250000, isActive: true },
    { id: 2, accountNumber: "10002", accountName: "Maintenance Fund", accountType: "expense", categoryId: 2, subcategoryId: 201, balance: 180000, isActive: true },
    { id: 3, accountNumber: "10003", accountName: "Crew Salaries", accountType: "expense", categoryId: 3, subcategoryId: 301, balance: 320000, isActive: true },
    { id: 4, accountNumber: "10004", accountName: "Fuel Budget", accountType: "expense", categoryId: 4, subcategoryId: 401, balance: 150000, isActive: true },
    { id: 5, accountNumber: "20001", accountName: "Charter Revenue", accountType: "income", categoryId: 5, subcategoryId: 501, balance: 750000, isActive: true },
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
    { 
      header: "Category", 
      id: "category", 
      cell: ({ row }: any) => {
        const category = mockAccountCategories.find(c => c.id === row.original.categoryId);
        const subcategory = category?.subcategories.find(s => s.id === row.original.subcategoryId);
        return (
          <div>
            <div>{category?.name}</div>
            {subcategory && <div className="text-xs text-muted-foreground">{subcategory.name}</div>}
          </div>
        );
      }
    },
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
              <span>
                {(() => {
                  const category = mockAccountCategories.find(c => c.id === account.categoryId);
                  const subcategory = category?.subcategories.find(s => s.id === account.subcategoryId);
                  return (
                    <span>
                      {category?.name}
                      {subcategory && <span className="text-xs text-muted-foreground ml-2">({subcategory.name})</span>}
                    </span>
                  );
                })()}
              </span>
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
  
  // Batch import dialog states
  const [showJournalBatchImportDialog, setShowJournalBatchImportDialog] = useState(false);
  const [showBudgetBatchImportDialog, setShowBudgetBatchImportDialog] = useState(false);
  const [showExpenseBatchImportDialog, setShowExpenseBatchImportDialog] = useState(false);
  const [showInvoiceBatchImportDialog, setShowInvoiceBatchImportDialog] = useState(false);
  const [showVendorBatchImportDialog, setShowVendorBatchImportDialog] = useState(false);
  const [showPayrollBatchImportDialog, setShowPayrollBatchImportDialog] = useState(false);
  
  // CSV templates
  const journalEntriesTemplateContent = `date,description,debitAccountId,debitAmount,creditAccountId,creditAmount,currency,reference
2025-04-15,Fuel Purchase,501,1200.00,101,1200.00,USD,INV-12345
2025-04-15,Maintenance Service,502,850.50,101,850.50,USD,SVC-67890
2025-04-15,Crew Salary,601,3500.00,101,3500.00,USD,PAY-54321`;

  const budgetsTemplateContent = `name,type,startDate,endDate,totalAmount,currency,operationsPercent,maintenancePercent,crewPercent,administrativePercent,otherPercent
Annual Operations 2025,operational,2025-01-01,2025-12-31,1200000.00,USD,25,35,20,15,5
Refit Project 2025,refit,2025-06-01,2025-08-31,500000.00,EUR,10,60,10,10,10
Mediterranean Season,charter,2025-05-01,2025-09-30,300000.00,EUR,30,20,40,5,5`;

  const expensesTemplateContent = `date,description,amount,currency,categoryId,subcategoryId,paymentMethod,vendorId,status,notes
2025-04-10,Fuel Purchase - Monaco,12500.00,EUR,501,5011,bank_account,1,paid,Regular refueling
2025-04-11,Port Fees - Monaco,3750.00,EUR,502,5021,credit_card,2,paid,Weekly dockage
2025-04-12,Provisions - Food & Beverage,2250.00,EUR,503,5031,bank_account,3,paid,Guest provisions
2025-04-13,Engine Maintenance,4800.00,EUR,504,5041,bank_account,4,pending,Scheduled maintenance`;

  const invoicesTemplateContent = `invoiceNumber,date,dueDate,clientName,clientEmail,clientAddress,amount,currency,status,description,termsDays
INV-2025-001,2025-04-15,2025-05-15,Charter Client Ltd,client@example.com,123 Ocean Avenue Monaco,75000.00,EUR,draft,Charter Services Apr 15-20 2025,30
INV-2025-002,2025-04-16,2025-05-16,Marine Services Inc,services@example.com,456 Harbor Road Antibes,12500.00,EUR,draft,Equipment Rental,15
INV-2025-003,2025-04-17,2025-05-17,Event Company LLC,events@example.com,789 Yacht Club Dr Fort Lauderdale,32000.00,USD,draft,Corporate Event Apr 25 2025,21`;

  const vendorsTemplateContent = `name,contactName,email,phone,address,category,currency,paymentTerms,taxId,notes
Monaco Yacht Services,Jean Leclerc,info@monacoyacht.com,+37712345678,15 Quai Antoine 1er Monaco,maintenance,EUR,30,FR12345678,Preferred maintenance provider
Antibes Chandlery,Marie Dubois,sales@antibeschandlery.com,+33493123456,10 Port Vauban Antibes,supplies,EUR,15,FR87654321,Marine supplies and parts
Global Fuel Solutions,Robert Smith,operations@globalfuel.com,+12025550178,123 Marina Drive Fort Lauderdale,fuel,USD,immediate,US123456789,International bunkering services
Gourmet Yacht Provisions,Sophie Laurent,orders@gourmetyacht.com,+33607123456,25 Avenue du Port Cannes,provisions,EUR,7,FR45678912,Specialty food and beverage supplier`;

  const payrollTemplateContent = `payrollPeriod,employeeId,employeeName,position,baseSalary,currency,overtimeHours,overtimeRate,bonusAmount,deductionAmount,deductionReason,netAmount,paymentMethod,bankAccount,notes
April 2025,1,John Smith,Captain,12000.00,USD,10,30.00,1000.00,500.00,Health Insurance,12800.00,bank_transfer,XXXX1234,Charter bonus included
April 2025,2,Maria Rodriguez,Chief Stewardess,8500.00,USD,8,25.00,750.00,400.00,Health Insurance,9050.00,bank_transfer,XXXX5678,Performance bonus
April 2025,3,James Wilson,Chief Engineer,10000.00,USD,15,27.50,0.00,450.00,Health Insurance,10162.50,bank_transfer,XXXX9012,Additional maintenance hours
April 2025,4,Sarah Johnson,Chef,9000.00,USD,5,26.00,500.00,400.00,Health Insurance,9230.00,bank_transfer,XXXX3456,Special event bonus`;
  
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
          <div className="flex gap-2">
            <Button onClick={() => setShowNewJournalDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Journal Entry
            </Button>
            <Button variant="outline" onClick={() => setShowJournalBatchImportDialog(true)}>
              <FileUp className="h-4 w-4 mr-2" /> Batch Import
            </Button>
          </div>
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
          <div className="flex gap-2">
            <Button onClick={() => setShowNewPayrollDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Payroll Run
            </Button>
            <Button variant="outline" onClick={() => setShowPayrollBatchImportDialog(true)}>
              <FileUp className="h-4 w-4 mr-2" /> Batch Import
            </Button>
          </div>
        );
      case "budgets":
        return (
          <div className="flex gap-2">
            <Button onClick={() => setShowNewBudgetDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Budget
            </Button>
            <Button variant="outline" onClick={() => setShowBudgetBatchImportDialog(true)}>
              <FileUp className="h-4 w-4 mr-2" /> Batch Import
            </Button>
          </div>
        );
      case "expenses":
        return (
          <div className="flex gap-2">
            <Button onClick={() => setShowNewExpenseDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Expense
            </Button>
            <Button variant="outline" onClick={() => setShowExpenseBatchImportDialog(true)}>
              <FileUp className="h-4 w-4 mr-2" /> Batch Import
            </Button>
          </div>
        );
      case "invoices":
        return (
          <div className="flex gap-2">
            <Button onClick={() => setShowNewInvoiceDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Invoice
            </Button>
            <Button variant="outline" onClick={() => setShowInvoiceBatchImportDialog(true)}>
              <FileUp className="h-4 w-4 mr-2" /> Batch Import
            </Button>
          </div>
        );
      case "vendors":
        return (
          <div className="flex gap-2">
            <Button onClick={() => setShowNewVendorDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Vendor
            </Button>
            <Button variant="outline" onClick={() => setShowVendorBatchImportDialog(true)}>
              <FileUp className="h-4 w-4 mr-2" /> Batch Import
            </Button>
          </div>
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
  
  // State for managing the category dialogs
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  
  // New Account Dialog
  const NewAccountDialog = () => {
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountType, setAccountType] = useState("expense");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
    
    // Filter available categories based on the selected account type
    const availableCategories = mockAccountCategories.filter(
      category => category.type === accountType
    );
    
    // Get subcategories for the selected category
    const availableSubcategories = categoryId 
      ? mockAccountCategories.find(c => c.id === categoryId)?.subcategories || []
      : [];
    
    // Reset subcategory when category changes
    useEffect(() => {
      setSubcategoryId(null);
    }, [categoryId]);
    
    // Reset category when account type changes
    useEffect(() => {
      setCategoryId(null);
    }, [accountType]);
    
    const handleSubmit = () => {
      // In a real application, this would make an API call to create the account
      // For demo purposes, we'll just log the values and close the dialog
      console.log("Creating new account:", { 
        accountNumber, 
        accountName, 
        accountType, 
        categoryId, 
        subcategoryId 
      });
      setShowNewAccountDialog(false);
      
      // Reset form values
      setAccountNumber("");
      setAccountName("");
      setAccountType("expense");
      setCategoryId(null);
      setSubcategoryId(null);
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
              <div className="col-span-3 flex gap-2">
                <Select 
                  value={categoryId ? categoryId.toString() : ""} 
                  onValueChange={val => setCategoryId(val ? parseInt(val) : null)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    setNewCategoryType(accountType);
                    setShowCategoryDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subcategory" className="text-right">
                Subcategory
              </Label>
              <div className="col-span-3 flex gap-2">
                <Select 
                  value={subcategoryId ? subcategoryId.toString() : ""} 
                  onValueChange={val => setSubcategoryId(val ? parseInt(val) : null)}
                  disabled={!categoryId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map(subcategory => (
                      <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  disabled={!categoryId}
                  onClick={() => {
                    if (categoryId) {
                      setSelectedCategoryId(categoryId);
                      setShowCategoryDialog(true);
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
  
  // Category Management Dialog
  const CategoryManagementDialog = () => {
    const handleAddCategory = () => {
      // In a real app, this would add the category to the database
      console.log("Adding new category:", { name: newCategoryName, type: newCategoryType });
      
      // Reset form
      setNewCategoryName("");
      setSelectedCategoryId(null);
    };
    
    const handleAddSubcategory = () => {
      // In a real app, this would add the subcategory to the database
      console.log("Adding new subcategory:", { 
        categoryId: selectedCategoryId, 
        name: newSubcategoryName 
      });
      
      // Reset form
      setNewSubcategoryName("");
    };
    
    const selectedCategory = selectedCategoryId 
      ? mockAccountCategories.find(c => c.id === selectedCategoryId)
      : null;
    
    return (
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategoryId ? `Manage ${selectedCategory?.name} Subcategories` : "Manage Account Categories"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategoryId 
                ? "Add or edit subcategories for this account category." 
                : "Create and organize categories for your chart of accounts."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedCategoryId ? (
              // Subcategory management UI
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New subcategory name"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddSubcategory}
                    disabled={!newSubcategoryName.trim()}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcategory Name</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCategory?.subcategories.map(subcategory => (
                        <TableRow key={subcategory.id}>
                          <TableCell>{subcategory.name}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedCategoryId(null)}
                >
                  Back to Categories
                </Button>
              </div>
            ) : (
              // Category management UI
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={newCategoryType} onValueChange={setNewCategoryType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subcategories</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockAccountCategories.map(category => (
                        <TableRow key={category.id}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell className="capitalize">{category.type}</TableCell>
                          <TableCell>{category.subcategories.length}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedCategoryId(category.id)}
                            >
                              <ListTree className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCategoryDialog(false);
              setSelectedCategoryId(null);
              setNewCategoryName("");
              setNewSubcategoryName("");
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // New Journal Entry Dialog
  const NewJournalEntryDialog = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [description, setDescription] = useState("");
    const [debitAccount, setDebitAccount] = useState("");
    const [creditAccount, setCreditAccount] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [memo, setMemo] = useState("");
    
    // Generate account options for the dropdowns
    const accountOptions = React.useMemo(() => {
      // List of bank accounts for selection
      const bankAccounts = [
        { value: "Cash", label: "Cash" },
        { value: "Operations Account", label: "Operations Account" },
        { value: "Euro Operations", label: "Euro Operations" },
        { value: "Credit Card", label: "Credit Card" }
      ];
      
      // Get account options from mockAccounts
      const accountOpts = mockAccounts.map(account => ({
        value: account.accountName,
        label: `${account.accountNumber} - ${account.accountName}`
      }));
      
      // Add bank accounts to the list
      bankAccounts.forEach(account => {
        accountOpts.push({
          value: account.label,
          label: account.label
        });
      });
      
      return accountOpts;
    }, []);
    
    // List of currencies
    const currencyOptions = [
      { value: "USD", label: "US Dollar (USD)" },
      { value: "EUR", label: "Euro (EUR)" },
      { value: "GBP", label: "British Pound (GBP)" },
      { value: "JPY", label: "Japanese Yen (JPY)" }
    ];
    
    const handleSubmit = () => {
      // In a real application, this would make an API call to create the journal entry
      console.log("Creating journal entry:", {
        date,
        description,
        debitAccount,
        creditAccount,
        amount: parseFloat(amount),
        currency,
        memo
      });
      
      // Reset form and close dialog
      setDescription("");
      setDebitAccount("");
      setCreditAccount("");
      setAmount("");
      setCurrency("USD");
      setMemo("");
      setShowNewJournalDialog(false);
    };
    
    return (
      <Dialog open={showNewJournalDialog} onOpenChange={setShowNewJournalDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
            <DialogDescription>
              Create a new journal entry in the general ledger using double-entry bookkeeping.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Input
                  id="date"
                  type="date"
                  value={date ? format(date, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Brief description of this transaction"
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="debitAccount" className="text-right">
                Debit Account
              </Label>
              <Select value={debitAccount} onValueChange={setDebitAccount}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select debit account" />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map(option => (
                    <SelectItem key={`debit-${option.value}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="creditAccount" className="text-right">
                Credit Account
              </Label>
              <Select value={creditAccount} onValueChange={setCreditAccount}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select credit account" />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map(option => (
                    <SelectItem key={`credit-${option.value}`} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1"
                />
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memo" className="text-right">
                Memo
              </Label>
              <Input
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="col-span-3"
                placeholder="Additional notes (optional)"
              />
            </div>
            
            <div className="col-span-3 col-start-2 mt-2">
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="font-medium">Double-Entry Summary</div>
                <div className="text-muted-foreground mt-1">
                  {debitAccount && creditAccount ? (
                    <>
                      This transaction will <strong>debit {debitAccount}</strong> and <strong>credit {creditAccount}</strong>
                      {amount ? ` for ${currency} ${parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : ""}.
                    </>
                  ) : (
                    "Select accounts to see the double-entry summary."
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJournalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!description || !debitAccount || !creditAccount || !amount || parseFloat(amount) <= 0}
            >
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
        <CategoryManagementDialog />
        
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountName" className="text-right">
                  Account Name
                </Label>
                <Input
                  id="accountName"
                  placeholder="Operations Account"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountType" className="text-right">
                  Account Type
                </Label>
                <Select defaultValue="checking">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking Account</SelectItem>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="investment">Investment Account</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountNumber" className="text-right">
                  Account Number
                </Label>
                <Input
                  id="accountNumber"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bankName" className="text-right">
                  Bank Name
                </Label>
                <Input
                  id="bankName"
                  placeholder="Chase, HSBC, etc."
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currency" className="text-right">
                  Currency
                </Label>
                <Select defaultValue="USD">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="openingBalance" className="text-right">
                  Opening Balance
                </Label>
                <Input
                  id="openingBalance"
                  type="number"
                  placeholder="0.00"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balanceDate" className="text-right">
                  Balance Date
                </Label>
                <Input
                  id="balanceDate"
                  type="date"
                  className="col-span-3"
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="notes"
                  placeholder="Optional notes about this account"
                  className="col-span-3"
                />
              </div>
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fromCurrency" className="text-right">
                  From Currency
                </Label>
                <Select defaultValue="USD">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select base currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="toCurrency" className="text-right">
                  To Currency
                </Label>
                <Select defaultValue="EUR">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select target currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exchangeRate" className="text-right">
                  Exchange Rate
                </Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  placeholder="1.00"
                  step="0.0001"
                  min="0.0001"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rateDate" className="text-right">
                  Rate Date
                </Label>
                <Input
                  id="rateDate"
                  type="date"
                  className="col-span-3"
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dataSource" className="text-right">
                  Data Source
                </Label>
                <Input
                  id="dataSource"
                  placeholder="e.g., European Central Bank, manual entry"
                  className="col-span-3"
                />
              </div>
              
              <div className="col-span-4 mt-2">
                <div className="bg-muted rounded-md p-3 text-sm">
                  <p className="font-medium">Exchange Rate Conversion Example:</p>
                  <p className="text-muted-foreground mt-1">
                    1.00 USD = <span className="font-medium">0.93 EUR</span> (example)
                  </p>
                  <p className="text-muted-foreground mt-1">
                    1.00 EUR = <span className="font-medium">1.07 USD</span> (example)
                  </p>
                </div>
              </div>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>
                Create a new budget for a specific period.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budgetName" className="text-right">
                  Budget Name
                </Label>
                <Input
                  id="budgetName"
                  placeholder="e.g., Annual Operations 2025"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budgetType" className="text-right">
                  Budget Type
                </Label>
                <Select defaultValue="operational">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select budget type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="crew">Crew</SelectItem>
                    <SelectItem value="capital">Capital Expenditure</SelectItem>
                    <SelectItem value="charter">Charter Season</SelectItem>
                    <SelectItem value="refit">Refit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Period
                </Label>
                <div className="flex col-span-3 space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="startDate" className="sr-only">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      defaultValue={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <span className="flex items-center">to</span>
                  <div className="flex-1">
                    <Label htmlFor="endDate" className="sr-only">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      defaultValue={format(new Date(new Date().setMonth(new Date().getMonth() + 12)), "yyyy-MM-dd")}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="totalAmount" className="text-right">
                  Total Amount
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="totalAmount"
                    type="number"
                    min="0"
                    placeholder="1000000"
                    className="flex-1"
                  />
                  <Select defaultValue="USD">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-2">
                <h3 className="font-medium text-center mb-4">Budget Allocation by Category</h3>
                
                <div className="space-y-3">
                  {mockAccountCategories.filter(c => c.type === "expense").slice(0, 4).map((category, index) => (
                    <div key={category.id} className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">
                        {category.name}
                      </Label>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Allocation amount"
                        />
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {index === 0 ? '25%' : index === 1 ? '30%' : index === 2 ? '15%' : '20%'}
                      </div>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Other
                    </Label>
                    <div className="col-span-2">
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="Allocation amount"
                      />
                    </div>
                    <div className="text-muted-foreground text-sm">
                      10%
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p>You can adjust category allocations after creating the budget.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBudgetDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewBudgetDialog(false)}>Create Budget</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add placeholders for other dialogs (expense, invoice, vendor, report) */}
        <Dialog open={showNewExpenseDialog} onOpenChange={setShowNewExpenseDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new expense transaction.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expenseDate" className="text-right">
                  Date
                </Label>
                <div className="col-span-3">
                  <Input
                    id="expenseDate"
                    type="date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expenseDescription" className="text-right">
                  Description
                </Label>
                <Input
                  id="expenseDescription"
                  placeholder="Brief description of expense"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expenseAmount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="expenseAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <Select defaultValue="USD">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expenseCategory" className="text-right">
                  Category
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAccountCategories.filter(c => c.type === "expense").map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expenseSubcategory" className="text-right">
                  Subcategory
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Would be populated based on selected category */}
                    <SelectItem value="101">General Operations</SelectItem>
                    <SelectItem value="102">Port Fees</SelectItem>
                    <SelectItem value="103">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentMethod" className="text-right">
                  Payment Method
                </Label>
                <Select defaultValue="bank_account">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_account">Bank Account</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor" className="text-right">
                  Vendor
                </Label>
                <div className="flex space-x-2 col-span-3">
                  <div className="flex-1">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockVendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select defaultValue="pending">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="receiptUpload" className="text-right">
                  Receipt
                </Label>
                <div className="col-span-3">
                  <Input
                    id="receiptUpload"
                    type="file"
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="notes"
                  placeholder="Additional notes about this expense"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewExpenseDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowNewExpenseDialog(false)}>Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for goods or services.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invoiceNumber" className="text-right">
                  Invoice #
                </Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV-2025-001"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendorSelect" className="text-right">
                  Vendor
                </Label>
                <Select defaultValue="">
                  <SelectTrigger id="vendorSelect" className="col-span-3">
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select a vendor</SelectItem>
                    {mockVendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invoiceDescription" className="text-right">
                  Description
                </Label>
                <Input
                  id="invoiceDescription"
                  placeholder="Invoice description"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="issueDate" className="text-right">
                    Issue Date
                  </Label>
                  <Input
                    id="issueDate"
                    type="date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    defaultValue={format(new Date(new Date().setDate(new Date().getDate() + 30)), "yyyy-MM-dd")}
                  />
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <h3 className="font-medium text-sm">Invoice Items</h3>
              
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <Label htmlFor="item1-description">Description</Label>
                    <Input
                      id="item1-description"
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="item1-quantity">Quantity</Label>
                    <Input
                      id="item1-quantity"
                      placeholder="1"
                      type="number"
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="item1-price">Unit Price</Label>
                    <Input
                      id="item1-price"
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="item1-total">Total</Label>
                    <Input
                      id="item1-total"
                      placeholder="0.00"
                      readOnly
                      className="bg-muted/50"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <Input
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="1"
                      type="number"
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="0.00"
                      readOnly
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
              
              <Separator className="my-2" />
              
              <div className="flex flex-col gap-2 ml-auto w-1/3">
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label className="text-right">Subtotal</Label>
                  <Input value="0.00" readOnly className="bg-muted/50" />
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label className="text-right">Tax</Label>
                  <Input placeholder="0.00" type="number" min="0" step="0.01" />
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label className="text-right font-medium">Total</Label>
                  <Input value="0.00" readOnly className="bg-muted/50 font-medium" />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currency" className="text-right">
                  Currency
                </Label>
                <Select defaultValue="USD">
                  <SelectTrigger id="currency" className="col-span-3">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select defaultValue="draft">
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or terms..."
                  className="col-span-3"
                  rows={3}
                />
              </div>
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

        {/* Batch Import Dialogs */}
        <BatchImportDialog
          open={showJournalBatchImportDialog}
          onOpenChange={setShowJournalBatchImportDialog}
          title="Import Journal Entries"
          description="Upload a CSV file with journal entries data to batch import."
          templateFileName="journal_entries_template.csv"
          templateContent={journalEntriesTemplateContent}
          onImport={(data) => {
            console.log("Importing journal entries:", data);
            // In a real app, this would send the data to the server
            setShowJournalBatchImportDialog(false);
          }}
          validateRow={(row) => {
            if (!row.date || !row.description || !row.debitAccountId || !row.creditAccountId || !row.debitAmount || !row.creditAmount) {
              return "All required fields must be filled out";
            }
            if (parseFloat(row.debitAmount) !== parseFloat(row.creditAmount)) {
              return "Debit amount must equal credit amount for each entry";
            }
            return null;
          }}
        />

        <BatchImportDialog
          open={showBudgetBatchImportDialog}
          onOpenChange={setShowBudgetBatchImportDialog}
          title="Import Budgets"
          description="Upload a CSV file with budget data to batch import."
          templateFileName="budgets_template.csv"
          templateContent={budgetsTemplateContent}
          onImport={(data) => {
            console.log("Importing budgets:", data);
            // In a real app, this would send the data to the server
            setShowBudgetBatchImportDialog(false);
          }}
          validateRow={(row) => {
            if (!row.name || !row.type || !row.startDate || !row.endDate || !row.totalAmount || !row.currency) {
              return "All required fields must be filled out";
            }
            return null;
          }}
        />

        <BatchImportDialog
          open={showExpenseBatchImportDialog}
          onOpenChange={setShowExpenseBatchImportDialog}
          title="Import Expenses"
          description="Upload a CSV file with expense data to batch import."
          templateFileName="expenses_template.csv"
          templateContent={expensesTemplateContent}
          onImport={(data) => {
            console.log("Importing expenses:", data);
            // In a real app, this would send the data to the server
            setShowExpenseBatchImportDialog(false);
          }}
          validateRow={(row) => {
            if (!row.date || !row.description || !row.amount || !row.currency || !row.categoryId) {
              return "All required fields must be filled out";
            }
            return null;
          }}
        />

        <BatchImportDialog
          open={showInvoiceBatchImportDialog}
          onOpenChange={setShowInvoiceBatchImportDialog}
          title="Import Invoices"
          description="Upload a CSV file with invoice data to batch import."
          templateFileName="invoices_template.csv"
          templateContent={invoicesTemplateContent}
          onImport={(data) => {
            console.log("Importing invoices:", data);
            // In a real app, this would send the data to the server
            setShowInvoiceBatchImportDialog(false);
          }}
          validateRow={(row) => {
            if (!row.invoiceNumber || !row.date || !row.clientName || !row.amount || !row.currency) {
              return "All required fields must be filled out";
            }
            return null;
          }}
        />

        <BatchImportDialog
          open={showVendorBatchImportDialog}
          onOpenChange={setShowVendorBatchImportDialog}
          title="Import Vendors"
          description="Upload a CSV file with vendor data to batch import."
          templateFileName="vendors_template.csv"
          templateContent={vendorsTemplateContent}
          onImport={(data) => {
            console.log("Importing vendors:", data);
            // In a real app, this would send the data to the server
            setShowVendorBatchImportDialog(false);
          }}
          validateRow={(row) => {
            if (!row.name || !row.contactName || !row.email || !row.category) {
              return "All required fields must be filled out";
            }
            return null;
          }}
        />

        <BatchImportDialog
          open={showPayrollBatchImportDialog}
          onOpenChange={setShowPayrollBatchImportDialog}
          title="Import Payroll Data"
          description="Upload a CSV file with payroll data to batch import."
          templateFileName="payroll_template.csv"
          templateContent={payrollTemplateContent}
          onImport={(data) => {
            console.log("Importing payroll data:", data);
            // In a real app, this would send the data to the server
            setShowPayrollBatchImportDialog(false);
          }}
          validateRow={(row) => {
            if (!row.payrollPeriod || !row.employeeId || !row.employeeName || !row.position || !row.baseSalary) {
              return "All required fields must be filled out";
            }
            return null;
          }}
        />

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-2 overflow-x-auto">
              <TabsList className="flex w-max px-0 bg-transparent h-auto border-b">
                <TabsTrigger value="accounts" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Wallet className="h-4 w-4" /> Accounts
                </TabsTrigger>
                <TabsTrigger value="journals" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Receipt className="h-4 w-4" /> Journal Entries
                </TabsTrigger>
                <TabsTrigger value="banking" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Building className="h-4 w-4" /> Banking
                </TabsTrigger>
                <TabsTrigger value="budgets" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <BarChart4 className="h-4 w-4" /> Budgets
                </TabsTrigger>
                <TabsTrigger value="expenses" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <DollarSign className="h-4 w-4" /> Expenses
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <FileText className="h-4 w-4" /> Invoices
                </TabsTrigger>
                <TabsTrigger value="vendors" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <CreditCard className="h-4 w-4" /> Vendors
                </TabsTrigger>
                <TabsTrigger value="payroll" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Users className="h-4 w-4" /> Payroll
                </TabsTrigger>
                <TabsTrigger value="currencies" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Globe className="h-4 w-4" /> Currencies
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <FileText className="h-4 w-4" /> Reports
                </TabsTrigger>
              </TabsList>
            </div>
            
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