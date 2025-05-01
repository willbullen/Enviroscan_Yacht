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

  // Mock data for account categories and subcategories
  const mockAccountCategories = [
    // We'll keep this for now as reference but it would be replaced with real data
  ];

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
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          </div>
          
          {/* Vessel selector component */}
          {renderVesselSelector()}
          
          <Tabs defaultValue="accounts" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex justify-between items-center">
              <TabsList className="grid grid-cols-8 w-[800px]">
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
                <TabsTrigger value="invoices" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Receipt className="h-4 w-4" /> Invoices
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <FileText className="h-4 w-4" /> Reports
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab}>
              {/* Content based on the active tab will go here */}
              <div className="p-4 border border-dashed rounded-md text-center">
                <p className="text-muted-foreground">
                  {transactionsLoading ? (
                    "Loading financial data..."
                  ) : (
                    `Displaying financial data for vessel: ${currentVessel?.name || "No vessel selected"}`
                  )}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default FinancialManagement;