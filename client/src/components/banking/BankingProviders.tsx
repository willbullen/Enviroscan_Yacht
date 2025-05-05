import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  RefreshCw, 
  Settings, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Link, 
  HelpCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';

interface BankingProvidersProps {
  vesselId: number;
}

interface MappedAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  bankAccountId: string;
  bankAccountName: string;
}

interface BankingProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected';
  lastSynced?: string;
  accounts?: number;
  apiKeySet?: boolean;
  apiSecretSet?: boolean;
  mappedAccounts?: MappedAccount[];
}

// Interface for financial accounts
interface FinancialAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  accountType: string;
  category: string;
  balance: string;
  vesselId: number;
}

// Interface for bank accounts from provider
interface BankAccount {
  id: string;
  name: string;
  currency: string;
  balance: string;
}

const BankingProviders: React.FC<BankingProvidersProps> = ({ vesselId }) => {
  const { useMockBankingData, updateSettings, bankingAPICredentialsSet } = useSystemSettings();
  
  // Initial mock providers
  const [providers, setProviders] = useState<BankingProvider[]>([
    {
      id: 'centtrip',
      name: 'Centtrip',
      icon: <Building2 className="h-8 w-8 text-blue-600" />,
      status: 'connected',
      lastSynced: '2025-05-05T09:30:00Z',
      accounts: 2,
      apiKeySet: true,
      apiSecretSet: true,
      mappedAccounts: [
        {
          id: 1,
          accountNumber: 'FA-001',
          accountName: 'Lazar Card',
          bankAccountId: 'cent-001',
          bankAccountName: 'Crew Card #1'
        },
        {
          id: 2,
          accountNumber: 'FA-002',
          accountName: 'Maintenance Account',
          bankAccountId: 'cent-002',
          bankAccountName: 'Operations Account'
        }
      ]
    },
    {
      id: 'revolut',
      name: 'Revolut',
      icon: <Building2 className="h-8 w-8 text-purple-600" />,
      status: 'connected',
      lastSynced: '2025-05-05T08:45:00Z',
      accounts: 1,
      apiKeySet: true,
      apiSecretSet: true,
      mappedAccounts: [
        {
          id: 4,
          accountNumber: 'FA-004',
          accountName: 'Provisions Account',
          bankAccountId: 'rev-001',
          bankAccountName: 'Food & Beverage'
        }
      ]
    }
  ]);
  
  // Fetch financial accounts for the vessel
  const { data: financialAccounts = [], isLoading: isLoadingAccounts } = useQuery<FinancialAccount[]>({
    queryKey: ['/api/financial-accounts/vessel', vesselId],
    enabled: !!vesselId,
  });
  
  // State variables
  const [selectedProvider, setSelectedProvider] = useState<BankingProvider | null>(null);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
  const [showMapAccountsDialog, setShowMapAccountsDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderId, setNewProviderId] = useState('');
  
  // Mock bank accounts from provider API
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Account mapping state
  const [accountMappings, setAccountMappings] = useState<{[key: string]: string}>({});
  
  // Fetch bank accounts when a provider is selected for mapping
  useEffect(() => {
    if (selectedProvider && showMapAccountsDialog) {
      // In a real app, this would be an API call to fetch accounts from the provider
      const mockBankAccounts: BankAccount[] = [
        { id: `${selectedProvider.id}-001`, name: `${selectedProvider.name} Account #1`, currency: 'USD', balance: '250,000.00' },
        { id: `${selectedProvider.id}-002`, name: `${selectedProvider.name} Account #2`, currency: 'EUR', balance: '150,000.00' },
        { id: `${selectedProvider.id}-003`, name: `${selectedProvider.name} Card`, currency: 'GBP', balance: '75,000.00' },
      ];
      
      setBankAccounts(mockBankAccounts);
      
      // Initialize account mappings from existing mapped accounts
      const initialMappings: {[key: string]: string} = {};
      if (selectedProvider.mappedAccounts) {
        selectedProvider.mappedAccounts.forEach(mapping => {
          initialMappings[mapping.id.toString()] = mapping.bankAccountId;
        });
      }
      setAccountMappings(initialMappings);
    }
  }, [selectedProvider, showMapAccountsDialog]);
  
  const handleSyncProvider = (providerId: string) => {
    setIsSyncing(providerId);
    
    // Simulate API call
    setTimeout(() => {
      setIsSyncing(null);
      setProviders(providers.map(provider => 
        provider.id === providerId 
          ? { ...provider, lastSynced: new Date().toISOString() } 
          : provider
      ));
    }, 2000);
  };
  
  const handleConfigureProvider = (provider: BankingProvider) => {
    setSelectedProvider(provider);
    setShowProviderDialog(true);
    setApiKey('');
    setApiSecret('');
  };
  
  const handleSubmitApiCredentials = () => {
    if (!selectedProvider) return;
    
    // Update the provider status
    setProviders(providers.map(provider => 
      provider.id === selectedProvider.id 
        ? { 
            ...provider, 
            status: 'connected',
            apiKeySet: true,
            apiSecretSet: true,
            lastSynced: new Date().toISOString()
          } 
        : provider
    ));
    
    // Update SystemSettingsContext
    const updatedCredentials = {
      ...bankingAPICredentialsSet,
      [selectedProvider.id]: true
    };
    
    // Save API credentials securely (this would normally call an API endpoint)
    console.log(`Saving API credentials for ${selectedProvider.name}:`, {
      apiKey: apiKey.slice(0, 3) + '...',
      apiSecret: '•••••••••'
    });
    
    // Update the context
    updateSettings({
      bankingAPICredentialsSet: updatedCredentials,
      useMockBankingData: false // Automatically switch to live data mode when credentials are added
    });
    
    setShowProviderDialog(false);
  };
  
  // Handle opening the account mapping dialog
  const handleMapAccounts = (provider: BankingProvider) => {
    setSelectedProvider(provider);
    setShowMapAccountsDialog(true);
  };
  
  // Handle saving account mappings
  const handleSaveAccountMappings = () => {
    if (!selectedProvider) return;
    
    // Create mapped accounts from the selections
    const newMappedAccounts: MappedAccount[] = [];
    
    // Create mappings for each selected account
    Object.entries(accountMappings).forEach(([accountId, bankAccountId]) => {
      // Find the financial account
      const financialAccount = financialAccounts.find((acc: FinancialAccount) => acc.id.toString() === accountId);
      if (!financialAccount) return;
      
      // Find the bank account
      const bankAccount = bankAccounts.find((acc: BankAccount) => acc.id === bankAccountId);
      if (!bankAccount) return;
      
      // Create the mapping
      newMappedAccounts.push({
        id: financialAccount.id,
        accountNumber: financialAccount.accountNumber,
        accountName: financialAccount.accountName,
        bankAccountId: bankAccount.id,
        bankAccountName: bankAccount.name
      });
    });
    
    // Update the provider
    setProviders(providers.map(provider => 
      provider.id === selectedProvider.id 
        ? { 
            ...provider, 
            mappedAccounts: newMappedAccounts,
            accounts: newMappedAccounts.length
          } 
        : provider
    ));
    
    // Close the dialog
    setShowMapAccountsDialog(false);
  };
  
  // Format date for display
  const formatLastSynced = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium mb-1">Banking API Configuration</h4>
          <p className="text-xs text-muted-foreground">
            Configure your banking API credentials or use test data for demonstration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="mock-data-mode" className="cursor-pointer">
            {useMockBankingData ? 'Using Test Data' : 'Using Live API Data'}
          </Label>
          <Switch
            id="mock-data-mode"
            checked={useMockBankingData}
            onCheckedChange={(checked) => {
              updateSettings({ useMockBankingData: checked });
            }}
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {provider.icon}
                  <div>
                    <CardTitle>{provider.name}</CardTitle>
                    <CardDescription>
                      Maritime financial services provider
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`
                    ${provider.status === 'connected' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  `}
                >
                  {provider.status === 'connected' ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Key:</span>
                  <span className="font-medium">
                    {provider.apiKeySet ? (
                      <CheckCircle className="h-4 w-4 text-green-600 inline mr-1" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400 inline mr-1" />
                    )}
                    {provider.apiKeySet ? 'Configured' : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Secret:</span>
                  <span className="font-medium">
                    {provider.apiSecretSet ? (
                      <CheckCircle className="h-4 w-4 text-green-600 inline mr-1" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400 inline mr-1" />
                    )}
                    {provider.apiSecretSet ? 'Configured' : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Synced:</span>
                  <span className="font-medium">{formatLastSynced(provider.lastSynced)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connected Accounts:</span>
                  <span className="font-medium">{provider.accounts || 0}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-wrap gap-2 bg-muted/20">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleConfigureProvider(provider)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleMapAccounts(provider)}
              >
                <Link className="h-4 w-4 mr-2" />
                Map Accounts
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleSyncProvider(provider.id)}
                disabled={isSyncing === provider.id || useMockBankingData}
              >
                {isSyncing === provider.id ? (
                  <>
                    <Spinner size="xs" className="mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-[257px] p-6 text-center">
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-medium mb-1">Add Banking Provider</h3>
            <p className="text-sm text-muted-foreground mb-4">Connect to additional banking providers</p>
            <Button onClick={() => setShowAddProviderDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Add new provider dialog */}
      <Dialog open={showAddProviderDialog} onOpenChange={setShowAddProviderDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Banking Provider</DialogTitle>
            <DialogDescription>
              Add a new banking provider to integrate with your vessel's financial management system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Provider Name</Label>
              <Input
                id="provider-name"
                type="text"
                placeholder="Enter provider name (e.g. Barclays)"
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-id">Provider ID</Label>
              <Input
                id="provider-id"
                type="text"
                placeholder="Enter provider ID (e.g. barclays)"
                value={newProviderId}
                onChange={(e) => setNewProviderId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              />
              <p className="text-xs text-muted-foreground">
                This will be used as a unique identifier for this provider
              </p>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-800" />
              <AlertTitle>Additional Configuration Required</AlertTitle>
              <AlertDescription className="text-xs">
                After adding a new provider, you'll need to configure its API credentials separately.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProviderDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Create a new provider and add it to the list
                const newProvider: BankingProvider = {
                  id: newProviderId || newProviderName.toLowerCase().replace(/\s+/g, '-'),
                  name: newProviderName,
                  icon: <Building2 className="h-8 w-8 text-gray-600" />,
                  status: 'disconnected',
                  apiKeySet: false,
                  apiSecretSet: false
                };
                
                setProviders([...providers, newProvider]);
                setShowAddProviderDialog(false);
                setNewProviderName('');
                setNewProviderId('');
              }} 
              disabled={!newProviderName}
            >
              Add Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Configure existing provider dialog */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure {selectedProvider?.name} API</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect to {selectedProvider?.name}. These credentials will be securely stored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="text"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-start">
                <HelpCircle className="h-3 w-3 mr-1 mt-0.5" />
                You can find your API key in your {selectedProvider?.name} account dashboard
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Enter your API secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-start">
                <HelpCircle className="h-3 w-3 mr-1 mt-0.5" />
                Your API secret will be securely encrypted and stored
              </p>
            </div>
            
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-800" />
              <AlertTitle>Test Mode Available</AlertTitle>
              <AlertDescription className="text-xs">
                You can toggle to test mode in the settings above if you don't have API credentials yet.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProviderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApiCredentials} disabled={!apiKey || !apiSecret}>
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankingProviders;