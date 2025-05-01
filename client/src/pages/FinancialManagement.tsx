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
  Trash
} from "lucide-react";
import { format } from "date-fns";

const FinancialManagement: React.FC = () => {
  // State for view toggle (Card/Grid vs Table view)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CARDS);
  const [activeTab, setActiveTab] = useState("accounts");
  
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
        );
        
      case "expenses":
        return (
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
        );
        
      case "budgets":
        return (
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

  return (
    <MainLayout title="Financial Management">
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
          
          {/* Vessel selector component */}
          {renderVesselSelector()}
          
          {/* Financial overview section */}
          {currentVessel && renderFinancialOverview()}
          
          <Tabs defaultValue="accounts" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex justify-between items-center">
              <TabsList className="grid grid-cols-7 w-[700px]">
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
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              )}
            </div>
            
            <TabsContent value={activeTab} className="mt-6">
              {renderTabContent()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default FinancialManagement;