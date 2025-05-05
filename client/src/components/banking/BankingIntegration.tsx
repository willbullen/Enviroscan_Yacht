import React, { useState } from "react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, AlertCircle, Wallet, ReceiptText, Banknote, ArrowDownUp, PiggyBank, CreditCard } from "lucide-react";
import BankingProviders from "./BankingProviders";
import TransactionReconciliation from "./TransactionReconciliation";
import ReceiptMatching from "./ReceiptMatching";
import { Grid } from "@tremor/react";

// Summary widgets for banking dashboard
const BankingSummaryWidgets = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-base">
            <span>Pending Reconciliation</span>
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>Transactions waiting to be reconciled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">12</div>
            <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              Requires attention
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-base">
            <span>Unmatched Receipts</span>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>Receipts without matched transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">5</div>
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Pending review
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-base">
            <span>Banking Connections</span>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>Connected banking providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">2</div>
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Active
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BankingIntegration: React.FC = () => {
  const { settings } = useSystemSettings();
  const [activeTab, setActiveTab] = useState("providers");

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {settings.useMockBankingData && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
              <Database className="mr-1 h-4 w-4 text-yellow-500" />
              Demo Mode
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
      </div>
      
      {settings.useMockBankingData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode Active:</strong> You're viewing simulated banking data. To connect to real banking APIs, disable demo mode in Settings and configure your API connections.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banking Summary Widgets */}
      <BankingSummaryWidgets />
      
      {/* Banking Tabs */}
      <Tabs defaultValue="providers" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <Card>
          <CardHeader className="pb-0">
            <TabsList className="w-full">
              <TabsTrigger value="providers">Banking Providers</TabsTrigger>
              <TabsTrigger value="transactions">Transaction Reconciliation</TabsTrigger>
              <TabsTrigger value="receipts">Receipt Matching</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="providers" className="space-y-4">
              <BankingProviders />
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-4">
              <TransactionReconciliation />
            </TabsContent>
            
            <TabsContent value="receipts" className="space-y-4">
              <ReceiptMatching />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default BankingIntegration;