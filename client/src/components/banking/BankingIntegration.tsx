import React, { useState } from "react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, RefreshCw, AlertCircle } from "lucide-react";
import BankingProviders from "./BankingProviders";
import TransactionReconciliation from "./TransactionReconciliation";
import ReceiptMatching from "./ReceiptMatching";

const BankingIntegration: React.FC = () => {
  const { settings } = useSystemSettings();
  const [activeTab, setActiveTab] = useState("providers");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Banking & Reconciliation</h1>
        
        <div className="flex items-center space-x-2">
          {settings.useMockBankingData && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
              <Database className="mr-1 h-4 w-4 text-yellow-500" />
              Demo Mode
            </Badge>
          )}
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
          </Button>
        </div>
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