import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BankingConnectionGuide } from './BankingConnectionGuide';
import { ReconciliationGuide } from './ReconciliationGuide';
import { ReceiptMatchingGuide } from './ReceiptMatchingGuide';
import BankingProviders from './BankingProviders';
import TransactionReconciliation from './TransactionReconciliation';
import ReceiptMatching from './ReceiptMatching';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { 
  AlertCircle, 
  CreditCard, 
  CheckCircle2, 
  Receipt, 
  RefreshCw, 
  FileCheck,
  BarChart,
  BadgeInfo,
  InfoIcon,
  HelpCircle,
} from 'lucide-react';

interface BankingIntegrationProps {
  vesselId: number;
}

export const BankingIntegration: React.FC<BankingIntegrationProps> = ({ vesselId }) => {
  const [activeTab, setActiveTab] = useState('providers');
  const [showConnectionGuide, setShowConnectionGuide] = useState(false);
  const [showReconciliationGuide, setShowReconciliationGuide] = useState(false);
  const [showReceiptMatchingGuide, setShowReceiptMatchingGuide] = useState(false);
  const [guideSections, setGuideSections] = useState<{
    connectionStep: number;
    reconciliationStep: number;
    receiptMatchingStep: number;
  }>({
    connectionStep: 0,
    reconciliationStep: 0,
    receiptMatchingStep: 0,
  });
  
  const { useLiveBankingData, bankingAPICredentialsSet } = useSystemSettings();
  
  // Stats for summary cards (in a real app, these would come from API calls)
  const bankConnections = {
    total: 2,
    active: useLiveBankingData 
      ? (bankingAPICredentialsSet.centtrip ? 1 : 0) + (bankingAPICredentialsSet.revolut ? 1 : 0)
      : 2,
  };
  
  const pendingReconciliations = {
    count: 12,
    value: 34250.75,
  };
  
  const unmatchedReceipts = {
    count: 8,
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleShowConnectionGuide = () => {
    setShowConnectionGuide(true);
    setShowReconciliationGuide(false);
    setShowReceiptMatchingGuide(false);
  };
  
  const handleShowReconciliationGuide = () => {
    setShowConnectionGuide(false);
    setShowReconciliationGuide(true);
    setShowReceiptMatchingGuide(false);
  };
  
  const handleShowReceiptMatchingGuide = () => {
    setShowConnectionGuide(false);
    setShowReconciliationGuide(false);
    setShowReceiptMatchingGuide(true);
  };
  
  const handleHideGuides = () => {
    setShowConnectionGuide(false);
    setShowReconciliationGuide(false);
    setShowReceiptMatchingGuide(false);
  };
  
  const handleConnectionStepChange = (step: number) => {
    if (step === -1) {
      setShowConnectionGuide(false);
      return;
    }
    setGuideSections(prev => ({
      ...prev,
      connectionStep: step,
    }));
  };
  
  const handleReconciliationStepChange = (step: number) => {
    if (step === -1) {
      setShowReconciliationGuide(false);
      return;
    }
    setGuideSections(prev => ({
      ...prev,
      reconciliationStep: step,
    }));
  };
  
  const handleReceiptMatchingStepChange = (step: number) => {
    if (step === -1) {
      setShowReceiptMatchingGuide(false);
      return;
    }
    setGuideSections(prev => ({
      ...prev,
      receiptMatchingStep: step,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Banking Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">{bankConnections.active} / {bankConnections.total}</div>
                <p className="text-xs text-muted-foreground">Active connections</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={handleShowConnectionGuide}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Connection Guide
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reconciliations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">{pendingReconciliations.count}</div>
                <p className="text-xs text-muted-foreground">Value: ${pendingReconciliations.value.toLocaleString()}</p>
              </div>
              <FileCheck className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleShowReconciliationGuide}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Reconciliation Guide
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unmatched Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">{unmatchedReceipts.count}</div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </div>
              <Receipt className="h-8 w-8 text-primary opacity-80" />
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleShowReceiptMatchingGuide}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Receipt Matching Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {!useLiveBankingData && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Using Generated Test Data</AlertTitle>
          <AlertDescription>
            You are currently using generated test data for banking integration. 
            To connect to live banking APIs, configure your API credentials in Settings and toggle to Live Data mode.
          </AlertDescription>
        </Alert>
      )}
      
      {useLiveBankingData && !bankingAPICredentialsSet.centtrip && !bankingAPICredentialsSet.revolut && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Banking Connections</AlertTitle>
          <AlertDescription>
            You have enabled live banking data but have not configured any API credentials. 
            Please configure your banking provider credentials in the Settings page.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="providers">Banking Providers</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="receipts">Receipt Matching</TabsTrigger>
        </TabsList>
        <TabsContent value="providers">
          <BankingProviders vesselId={vesselId} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionReconciliation vesselId={vesselId} />
        </TabsContent>
        <TabsContent value="receipts">
          <ReceiptMatching vesselId={vesselId} />
        </TabsContent>
      </Tabs>
      
      {/* Guides */}
      {showConnectionGuide && (
        <div className="mt-6">
          <BankingConnectionGuide 
            currentStep={guideSections.connectionStep} 
            onSelectStep={handleConnectionStepChange} 
          />
        </div>
      )}
      
      {showReconciliationGuide && (
        <div className="mt-6">
          <ReconciliationGuide 
            currentStep={guideSections.reconciliationStep} 
            onSelectStep={handleReconciliationStepChange} 
          />
        </div>
      )}
      
      {showReceiptMatchingGuide && (
        <div className="mt-6">
          <ReceiptMatchingGuide 
            currentStep={guideSections.receiptMatchingStep} 
            onSelectStep={handleReceiptMatchingStepChange} 
          />
        </div>
      )}
    </div>
  );
};

export default BankingIntegration;