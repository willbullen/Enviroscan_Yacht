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
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
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

// Type definitions
interface BankConnection {
  id: number;
  providerId: number;
  vesselId: number;
  connectionStatus: string;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  provider?: { 
    name: string;
    logoUrl?: string;
  };
}

interface BankingProvider {
  id: number;
  name: string;
  logoUrl?: string;
  code: string;
  isActive: boolean;
}

interface UnmatchedTransactionCounts {
  total: number;
  thisWeek: number;
  previousWeeks: number;
}

interface UnmatchedReceiptCounts {
  total: number;
  processing: number;
  processed: number;
}

export interface BankingIntegrationProps {
  vesselId: number;
}

export const BankingIntegration: React.FC<BankingIntegrationProps> = ({ vesselId }) => {
  const { useMockBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [activeGuide, setActiveGuide] = useState<'connection' | 'reconciliation' | 'receipt' | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  
  // Fetch banking connections
  const { 
    data: connectionsData, 
    isLoading: isLoadingConnections,
    error: connectionsError
  } = useQuery({
    queryKey: ['/api/banking/connections/vessel', vesselId],
    enabled: !!vesselId && !useMockBankingData
  });
  
  // Fetch banking providers for display
  const {
    data: providersData,
    isLoading: isLoadingProviders,
    error: providersError
  } = useQuery({
    queryKey: ['/api/banking/providers/vessel', vesselId],
    enabled: !!vesselId && !useMockBankingData
  });
  
  // Fetch unmatched transactions
  const {
    data: unmatchedTransactionsData,
    isLoading: isLoadingUnmatchedTx,
    error: unmatchedTxError
  } = useQuery<{ counts: UnmatchedTransactionCounts, transactions: any[] }>({
    queryKey: ['/api/banking/transactions/unmatched', vesselId],
    enabled: !!vesselId && !useMockBankingData
  });
  
  // Fetch unmatched receipts
  const {
    data: unmatchedReceiptsData,
    isLoading: isLoadingUnmatchedReceipts,
    error: unmatchedReceiptsError
  } = useQuery<{ counts: UnmatchedReceiptCounts, receipts: any[] }>({
    queryKey: ['/api/receipts/unmatched', vesselId],
    enabled: !!vesselId && !useMockBankingData
  });
  
  // Combine connections with provider data for display
  const connections: BankConnection[] = Array.isArray(connectionsData) ? connectionsData : [];
  const providers: BankingProvider[] = Array.isArray(providersData) ? providersData : [];
  
  // Enrich connections with provider information
  const enrichedConnections = connections.map(conn => {
    const provider = providers.find(p => p.id === conn.providerId);
    return {
      ...conn,
      provider
    };
  });
  
  // Filter active connections for display
  const activeConnections = enrichedConnections.filter(conn => 
    conn.connectionStatus === 'active' || conn.connectionStatus === 'connected'
  );
  
  // Get counts from API responses or use zeros if data isn't available yet
  const txCounts = unmatchedTransactionsData?.counts || { total: 0, thisWeek: 0, previousWeeks: 0 };
  const receiptCounts = unmatchedReceiptsData?.counts || { total: 0, processing: 0, processed: 0 };
  
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
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground">
          Manage banking connections, reconcile transactions, and match receipts to expenses
        </p>
        <div className="flex items-center">
          {!bankingAPICredentialsSet && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mr-3 gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Using Test Data
            </Badge>
          )}
          <Button size="sm" className="flex items-center gap-2" onClick={() => handleShowGuide('connection')}>
            <Lightbulb className="h-4 w-4" />
            Guide
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
        <Alert className="bg-amber-50 text-amber-800 border-amber-200 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription>
            Using test data for banking features. Add API credentials in Settings to connect real banking providers.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Banking Connections Widget */}
        <Card className="overflow-hidden">
          <div className="flex p-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Banking Connections</h4>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Loading indicator */}
              {isLoadingConnections && (
                <div className="flex items-center justify-center p-4">
                  <Spinner size="sm" className="mr-2" />
                  <span className="text-sm text-muted-foreground">Loading connections...</span>
                </div>
              )}
              
              {/* Error message */}
              {connectionsError && (
                <div className="text-sm text-red-500 p-2">
                  Failed to load banking connections
                </div>
              )}
              
              {/* Real data display */}
              {!isLoadingConnections && !connectionsError && (
                <>
                  <div className="text-2xl font-bold">{activeConnections.length}</div>
                  <p className="text-xs text-muted-foreground mb-2">Active banking connections</p>
                  
                  {activeConnections.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-2">
                      No active banking connections
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activeConnections.slice(0, 3).map(conn => (
                        <div key={conn.id} className="flex justify-between text-xs">
                          <span className="flex items-center">
                            <Building className="h-3 w-3 mr-1 text-primary" />
                            {conn.provider?.name || `Provider #${conn.providerId}`}
                          </span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs py-0 h-5">
                            Active
                          </Badge>
                        </div>
                      ))}
                      
                      {activeConnections.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          +{activeConnections.length - 3} more connections
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Pending Reconciliation Widget */}
        <Card className="overflow-hidden">
          <div className="flex p-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Pending Reconciliation</h4>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Loading indicator */}
              {isLoadingUnmatchedTx && (
                <div className="flex items-center justify-center p-4">
                  <Spinner size="sm" className="mr-2" />
                  <span className="text-sm text-muted-foreground">Loading data...</span>
                </div>
              )}
              
              {/* Error message */}
              {unmatchedTxError && (
                <div className="text-sm text-red-500 p-2">
                  Failed to load reconciliation data
                </div>
              )}
              
              {/* Real data display */}
              {!isLoadingUnmatchedTx && !unmatchedTxError && (
                <>
                  <div className="text-2xl font-bold">{txCounts.total}</div>
                  <p className="text-xs text-muted-foreground mb-2">Unmatched transactions this month</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>This week</span>
                      <span>{txCounts.thisWeek} transaction{txCounts.thisWeek !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Previous weeks</span>
                      <span>{txCounts.previousWeeks} transaction{txCounts.previousWeeks !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Unmatched Receipts Widget */}
        <Card className="overflow-hidden">
          <div className="flex p-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Unmatched Receipts</h4>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Loading indicator */}
              {isLoadingUnmatchedReceipts && (
                <div className="flex items-center justify-center p-4">
                  <Spinner size="sm" className="mr-2" />
                  <span className="text-sm text-muted-foreground">Loading receipts...</span>
                </div>
              )}
              
              {/* Error message */}
              {unmatchedReceiptsError && (
                <div className="text-sm text-red-500 p-2">
                  Failed to load receipt data
                </div>
              )}
              
              {/* Real data display */}
              {!isLoadingUnmatchedReceipts && !unmatchedReceiptsError && (
                <>
                  <div className="text-2xl font-bold">{receiptCounts.total}</div>
                  <p className="text-xs text-muted-foreground mb-2">Receipts awaiting processing or matching</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center">
                        <RefreshCw className="h-3 w-3 mr-1 text-blue-500" />
                        Processing
                      </span>
                      <span>{receiptCounts.processing} receipt{receiptCounts.processing !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center">
                        <FileCheck className="h-3 w-3 mr-1 text-purple-500" />
                        Processed
                      </span>
                      <span>{receiptCounts.processed} receipt{receiptCounts.processed !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="transactions" className="flex items-center">
            <BanknoteIcon className="h-4 w-4 mr-2" />
            Banking & Transactions
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex items-center">
            <Receipt className="h-4 w-4 mr-2" />
            Receipt Matching
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="pt-3">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              Manage bank connections and match transactions to your vessel's expenses
            </p>
            <Button variant="outline" size="sm" onClick={() => handleShowGuide('reconciliation')}>
              <Info className="h-4 w-4 mr-2" />
              Guide
            </Button>
          </div>
          <TransactionReconciliation vesselId={vesselId} />
        </TabsContent>
        
        <TabsContent value="receipts" className="pt-3">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              Upload receipts for automatic extraction and expense matching
            </p>
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