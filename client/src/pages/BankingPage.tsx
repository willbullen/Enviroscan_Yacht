import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVessel } from '@/contexts/VesselContext';
import BankingIntegration from '@/components/banking/BankingIntegration';
import TransactionReconciliation from '@/components/banking/TransactionReconciliation';
import { CreditCard, Receipt, PieChart, ArrowLeftRight, Building2 } from 'lucide-react';

const BankingPage = () => {
  const { currentVessel } = useVessel();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Banking & Reconciliation
        </h1>
        <p className="text-muted-foreground">
          Manage banking connections, reconcile transactions, and track vessel finances
        </p>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-3xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Financial Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Banking Connections</span>
            <span className="sm:hidden">Connections</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Transaction Matching</span>
            <span className="sm:hidden">Matching</span>
          </TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Financial Ledger</span>
            <span className="sm:hidden">Ledger</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>
                Financial summary for {currentVessel?.name || 'your vessel'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>Financial overview will be implemented in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <BankingIntegration />
        </TabsContent>

        {/* Transaction Reconciliation Tab */}
        <TabsContent value="reconciliation" className="space-y-4">
          <TransactionReconciliation />
        </TabsContent>

        {/* Financial Ledger Tab */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Ledger</CardTitle>
              <CardDescription>
                Complete financial ledger for {currentVessel?.name || 'your vessel'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>Financial ledger will be implemented in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankingPage;