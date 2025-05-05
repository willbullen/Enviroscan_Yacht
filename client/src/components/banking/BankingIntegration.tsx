import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import BankingProviders from './BankingProviders';
import TransactionReconciliation from './TransactionReconciliation';
import ReceiptMatching from './ReceiptMatching';
import BankingConnectionGuide from './BankingConnectionGuide';
import ReconciliationGuide from './ReconciliationGuide';
import ReceiptMatchingGuide from './ReceiptMatchingGuide';
import { 
  BanknoteIcon, 
  CreditCard, 
  BarChart3, 
  Receipt, 
  Building, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Info, 
  RefreshCw,
  Lightbulb
} from 'lucide-react';

export interface BankingIntegrationProps {
  vesselId: number;
}

export const BankingIntegration: React.FC<BankingIntegrationProps> = ({ vesselId }) => {
  const { useMockBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [activeGuide, setActiveGuide] = useState<'connection' | 'reconciliation' | 'receipt' | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  
  const handleShowGuide = (guide: 'connection' | 'reconciliation' | 'receipt') => {
    setActiveGuide(guide);
    setGuideStep(0);
  };
  
  const handleGuideStepChange = (step: number) => {
    if (step < 0) {
      setActiveGuide(null);
      return;
    }
    setGuideStep(step);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Banking & Reconciliation</h2>
          <p className="text-muted-foreground">
            Manage banking connections, reconcile transactions, and match receipts to expenses
          </p>
        </div>
        <div className="flex items-center">
          {!bankingAPICredentialsSet && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mr-3 gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Using Test Data
            </Badge>
          )}
          <Button className="flex items-center gap-2" onClick={() => handleShowGuide('connection')}>
            <Lightbulb className="h-4 w-4" />
            Banking Guide
          </Button>
        </div>
      </div>

      {activeGuide === 'connection' && (
        <BankingConnectionGuide 
          currentStep={guideStep} 
          onSelectStep={handleGuideStepChange} 
        />
      )}
      
      {activeGuide === 'reconciliation' && (
        <ReconciliationGuide 
          currentStep={guideStep} 
          onSelectStep={handleGuideStepChange} 
        />
      )}
      
      {activeGuide === 'receipt' && (
        <ReceiptMatchingGuide 
          currentStep={guideStep} 
          onSelectStep={handleGuideStepChange} 
        />
      )}
      
      {!bankingAPICredentialsSet && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertTitle>Using Test Data Mode</AlertTitle>
          <AlertDescription>
            You're using test data for banking features. To connect real banking providers, add your API credentials in Settings.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Banking Connections</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Active banking connections
            </p>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Building className="h-3.5 w-3.5 mr-1 text-primary" />
                  Centtrip
                </span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <Building className="h-3.5 w-3.5 mr-1 text-primary" />
                  Revolut
                </span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Reconciliation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              Unmatched transactions this month
            </p>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>This week</span>
                <span>8 transactions</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Previous weeks</span>
                <span>6 transactions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Unmatched Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Receipts awaiting processing or matching
            </p>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  Processing
                </span>
                <span>1 receipt</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <FileCheck className="h-3.5 w-3.5 mr-1 text-purple-500" />
                  Processed
                </span>
                <span>2 receipts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="providers" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Banking Providers
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center">
            <BanknoteIcon className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center">
            <Receipt className="h-4 w-4 mr-2" />
            Receipt Matching
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="providers" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Banking Providers</h3>
              <p className="text-sm text-muted-foreground">
                Configure and manage connections to your vessel's banking providers
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleShowGuide('connection')}>
              <Info className="h-4 w-4 mr-2" />
              Guide
            </Button>
          </div>
          <BankingProviders vesselId={vesselId} />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Transaction Reconciliation</h3>
              <p className="text-sm text-muted-foreground">
                Match banking transactions to your vessel's expenses and deposits
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleShowGuide('reconciliation')}>
              <Info className="h-4 w-4 mr-2" />
              Guide
            </Button>
          </div>
          <TransactionReconciliation vesselId={vesselId} />
        </TabsContent>
        
        <TabsContent value="receipts" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">AI Receipt Matching</h3>
              <p className="text-sm text-muted-foreground">
                Upload receipts for automatic extraction and expense matching
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleShowGuide('receipt')}>
              <Info className="h-4 w-4 mr-2" />
              Guide
            </Button>
          </div>
          <ReceiptMatching vesselId={vesselId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankingIntegration;