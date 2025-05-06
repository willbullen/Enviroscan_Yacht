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
  Edit,
  CreditCard
} from 'lucide-react';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BankingProvidersProps {
  vesselId: number;
  onClose?: () => void;
}

interface MappedAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  bankAccountId: string;
  bankAccountName: string;
}

interface BankingProvider {
  id: number;
  name: string;
  apiType: string;
  authType: string;
  baseUrl: string;
  status: 'connected' | 'disconnected';
  vesselId: number;
  isActive: boolean;
  apiKeySet?: boolean;
  apiSecretSet?: boolean;
  lastSynced?: string;
  createdAt: string;
  updatedAt: string;
  icon?: React.ReactNode; // For UI display only
  accounts?: number; // Count of mapped accounts
  mappedAccounts?: MappedAccount[]; // UI helper for mapped accounts
}

// Interface for API response
interface BankingProviderApiResponse {
  id: number;
  name: string;
  apiType: string;
  authType: string;
  baseUrl: string;
  apiKey?: string | null;
  apiSecret?: string | null;
  status: string;
  vesselId: number;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BankConnection {
  id: number;
  providerId: number;
  vesselId: number;
  accountIdentifier: string;
  accountName: string;
  status: string;
  lastSyncedAt: string | null;
  balance: string;
  currency: string;
  mappedFinancialAccountId: number | null;
  createdAt: string;
  updatedAt: string;
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

const BankingProviders: React.FC<BankingProvidersProps> = ({ vesselId, onClose }) => {
  const { useMockBankingData, updateSettings, bankingAPICredentialsSet } = useSystemSettings();
  const queryClient = useQueryClient();
  
  // Fetch banking providers for the vessel
  const { 
    data: apiProviders = [], 
    isLoading: isLoadingProviders,
    error: providersError
  } = useQuery<BankingProviderApiResponse[]>({
    queryKey: ['/api/banking/providers/vessel', vesselId],
    enabled: !!vesselId && !useMockBankingData,
  });
  
  // Fetch bank connections for the vessel
  const {
    data: bankConnections = [],
    isLoading: isLoadingConnections
  } = useQuery<BankConnection[]>({
    queryKey: ['/api/banking/connections/vessel', vesselId],
    enabled: !!vesselId && !useMockBankingData,
  });
  
  // Transform API data to component format with UI enhancements
  const providers: BankingProvider[] = apiProviders.map(provider => {
    // Find connections for this provider
    const providerConnections = bankConnections.filter(conn => conn.providerId === provider.id);
    
    // Create the enhanced provider object
    return {
      ...provider,
      icon: getProviderIcon(provider.name),
      status: provider.status === 'active' ? 'connected' : 'disconnected',
      accounts: providerConnections.length,
      apiKeySet: !!provider.apiKey,
      apiSecretSet: !!provider.apiSecret,
      lastSynced: provider.lastSyncedAt || undefined,
    };
  });
      
  // Helper to get icon based on provider name
  function getProviderIcon(providerName: string): React.ReactNode {
    const name = providerName.toLowerCase();
    if (name.includes('centtrip')) {
      return <Building2 className="h-8 w-8 text-blue-600" />;
    } else if (name.includes('revolut')) {
      return <Building2 className="h-8 w-8 text-purple-600" />;
    } else if (name.includes('barclays')) {
      return <Building2 className="h-8 w-8 text-blue-800" />;
    } else if (name.includes('credit')) {
      return <CreditCard className="h-8 w-8 text-green-600" />;
    } else {
      return <Building2 className="h-8 w-8 text-gray-600" />;
    }
  }
  
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
  const [isSyncing, setIsSyncing] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderApiType, setNewProviderApiType] = useState('REST');
  const [newProviderAuthType, setNewProviderAuthType] = useState('API_KEY');
  const [newProviderBaseUrl, setNewProviderBaseUrl] = useState('');
  
  // Mock bank accounts from provider API
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  
  // Account mapping state
  const [accountMappings, setAccountMappings] = useState<{[key: string]: string}>({});
  
  // Create provider mutation
  const createProviderMutation = useMutation({
    mutationFn: (newProvider: { 
      name: string; 
      apiType: string; 
      authType: string; 
      baseUrl: string;
      vesselId: number;
      apiKey?: string;
      apiSecret?: string;
      isActive: boolean;
    }) => {
      return apiRequest(
        'POST',
        '/api/banking/providers',
        newProvider
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banking/providers/vessel', vesselId] });
      setShowAddProviderDialog(false);
      toast({
        title: "Success",
        description: "Banking provider added successfully",
        variant: "default"
      });
      
      // Reset form
      setNewProviderName('');
      setNewProviderApiType('REST');
      setNewProviderAuthType('API_KEY');
      setNewProviderBaseUrl('');
      setApiKey('');
      setApiSecret('');
    },
    onError: (error) => {
      console.error("Failed to add provider:", error);
      toast({
        title: "Error",
        description: "Failed to add banking provider",
        variant: "destructive"
      });
    }
  });
  
  // Update provider mutation
  const updateProviderMutation = useMutation({
    mutationFn: ({ id, updates }: { 
      id: number;
      updates: Partial<BankingProvider>;
    }) => {
      return apiRequest(
        'PATCH',
        `/api/banking/providers/${id}`,
        updates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banking/providers/vessel', vesselId] });
      setShowProviderDialog(false);
      toast({
        title: "Success",
        description: "Banking provider updated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error("Failed to update provider:", error);
      toast({
        title: "Error",
        description: "Failed to update banking provider",
        variant: "destructive"
      });
    }
  });
  
  // Fetch bank accounts when a provider is selected for mapping
  useEffect(() => {
    if (selectedProvider && showMapAccountsDialog) {
      // Get bank accounts from API
      const fetchBankAccounts = async () => {
        try {
          const response = await fetch(`/api/banking/providers/${selectedProvider.id}/accounts`);
          if (response.ok) {
            const data = await response.json();
            setBankAccounts(data);
          } else {
            console.error("Failed to fetch bank accounts:", await response.text());
            toast({
              title: "Error",
              description: "Failed to fetch bank accounts from provider",
              variant: "destructive"
            });
            setBankAccounts([]);
          }
        } catch (error) {
          console.error("Error fetching bank accounts:", error);
          toast({
            title: "Error",
            description: "An error occurred while fetching bank accounts",
            variant: "destructive"
          });
          setBankAccounts([]);
        }
      };
      
      fetchBankAccounts();
      
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
  
  // Sync provider mutation
  const syncProviderMutation = useMutation({
    mutationFn: (providerId: number) => {
      return apiRequest(
        'POST',
        `/api/banking/providers/${providerId}/sync`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banking/providers/vessel', vesselId] });
      toast({
        title: "Success",
        description: "Provider synced successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error("Failed to sync provider:", error);
      toast({
        title: "Error",
        description: "Failed to sync with banking provider",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSyncing(null);
    }
  });
  
  const handleSyncProvider = (providerId: number) => {
    setIsSyncing(providerId);
    if (!useMockBankingData) {
      syncProviderMutation.mutate(providerId);
    } else {
      // Simulate API call for mock data
      setTimeout(() => {
        setIsSyncing(null);
        toast({
          title: "Success",
          description: "Provider synced successfully (mock mode)",
          variant: "default"
        });
      }, 2000);
    }
  };
  
  const handleConfigureProvider = (provider: BankingProvider) => {
    setSelectedProvider(provider);
    setShowProviderDialog(true);
    setApiKey('');
    setApiSecret('');
  };
  
  const handleSubmitApiCredentials = () => {
    if (!selectedProvider) return;
    
    if (!apiKey || !apiSecret) {
      toast({
        title: "Validation Error",
        description: "Both API key and secret are required",
        variant: "destructive"
      });
      return;
    }
    
    // Update provider with new credentials
    const updates = {
      apiKey,
      apiSecret,
      status: 'connected' as const,
      isActive: true
    };
    
    // Use the update mutation to save changes
    updateProviderMutation.mutate({ 
      id: selectedProvider.id,
      updates
    });
    
    // Update SystemSettingsContext
    const updatedCredentials = {
      ...bankingAPICredentialsSet,
      [selectedProvider.id]: true
    };
    
    // Update the context to use live data
    updateSettings({
      bankingAPICredentialsSet: updatedCredentials,
      useMockBankingData: false // Automatically switch to live data mode when credentials are added
    });
  };
  
  // Handle opening the account mapping dialog
  const handleMapAccounts = (provider: BankingProvider) => {
    setSelectedProvider(provider);
    setShowMapAccountsDialog(true);
  };
  
  // Account mappings mutation
  const updateAccountMappingsMutation = useMutation({
    mutationFn: ({ providerId, mappings }: { 
      providerId: number;
      mappings: Array<{
        accountId: number;
        bankAccountId: string;
      }>;
    }) => {
      return apiRequest(
        'PATCH',
        `/api/banking/providers/${providerId}/account-mappings`,
        { mappings }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banking/providers/vessel', vesselId] });
      setShowMapAccountsDialog(false);
      toast({
        title: "Success",
        description: "Account mappings updated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error("Failed to update account mappings:", error);
      toast({
        title: "Error",
        description: "Failed to update account mappings",
        variant: "destructive"
      });
    }
  });
  
  // Handle saving account mappings
  const handleSaveAccountMappings = () => {
    if (!selectedProvider) return;
    
    // Create mappings array for the API
    const mappings = Object.entries(accountMappings)
      .filter(([_, bankAccountId]) => bankAccountId && bankAccountId !== 'not_mapped')
      .map(([accountId, bankAccountId]) => ({
        accountId: parseInt(accountId),
        bankAccountId
      }));
    
    // Use mutation to update mappings
    updateAccountMappingsMutation.mutate({
      providerId: selectedProvider.id,
      mappings
    });
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
              <Label htmlFor="api-type">API Type</Label>
              <Select 
                value={newProviderApiType}
                onValueChange={setNewProviderApiType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select API type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REST">REST API</SelectItem>
                  <SelectItem value="GRAPHQL">GraphQL API</SelectItem>
                  <SelectItem value="SOAP">SOAP API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auth-type">Authentication Type</Label>
              <Select 
                value={newProviderAuthType}
                onValueChange={setNewProviderAuthType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API_KEY">API Key</SelectItem>
                  <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
                  <SelectItem value="BASIC">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                type="text"
                placeholder="Enter base URL (e.g. https://api.barclays.com)"
                value={newProviderBaseUrl}
                onChange={(e) => setNewProviderBaseUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret (Optional)</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Enter API secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
            </div>
            
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <HelpCircle className="h-4 w-4 text-blue-800" />
              <AlertDescription className="text-xs">
                API credentials are stored securely and encrypted. You can get these from your banking provider's developer portal.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProviderDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!newProviderName) {
                  toast({
                    title: "Validation Error",
                    description: "Please enter provider name",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (!newProviderBaseUrl) {
                  toast({
                    title: "Validation Error",
                    description: "Please enter base URL",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Create provider data
                const newProvider = {
                  name: newProviderName,
                  apiType: newProviderApiType,
                  authType: newProviderAuthType,
                  baseUrl: newProviderBaseUrl,
                  vesselId: vesselId,
                  isActive: true,
                  status: 'active'
                };
                
                // Add API credentials if provided
                if (apiKey) {
                  Object.assign(newProvider, { apiKey });
                }
                
                if (apiSecret) {
                  Object.assign(newProvider, { apiSecret });
                }
                
                // Use mutation to create provider
                createProviderMutation.mutate(newProvider);
              }}
              disabled={createProviderMutation.isPending || !newProviderName}
            >
              {createProviderMutation.isPending ? (
                <>
                  <Spinner size="xs" className="mr-2" />
                  Adding...
                </>
              ) : (
                'Add Provider'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Map accounts dialog */}
      <Dialog open={showMapAccountsDialog} onOpenChange={setShowMapAccountsDialog}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Map Financial Accounts to {selectedProvider?.name}</DialogTitle>
            <DialogDescription>
              Associate your vessel's financial accounts with bank accounts from {selectedProvider?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
                <span className="ml-2">Loading accounts...</span>
              </div>
            ) : financialAccounts.length === 0 ? (
              <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-800" />
                <AlertTitle>No Financial Accounts Found</AlertTitle>
                <AlertDescription className="text-xs">
                  Please add financial accounts to your vessel before mapping them to banking providers.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which bank account from {selectedProvider?.name} corresponds to each financial account in your system.
                </p>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {financialAccounts.map((account: FinancialAccount) => (
                    <div key={account.id} className="border rounded-lg p-4 bg-muted/20">
                      <h4 className="font-medium mb-2">{account.accountName} ({account.accountNumber})</h4>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-2">
                          Type: {account.accountType} | Category: {account.category} | Balance: {account.balance}
                        </p>
                        <Label htmlFor={`map-account-${account.id}`}>Select {selectedProvider?.name} Account</Label>
                        <Select 
                          value={accountMappings[account.id.toString()] || 'not_mapped'} 
                          onValueChange={(value) => {
                            setAccountMappings({
                              ...accountMappings,
                              [account.id.toString()]: value === 'not_mapped' ? '' : value
                            });
                          }}
                        >
                          <SelectTrigger id={`map-account-${account.id}`} className="w-full">
                            <SelectValue placeholder="Select a bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_mapped">-- Not Mapped --</SelectItem>
                            {bankAccounts.map((bankAccount: BankAccount) => (
                              <SelectItem key={bankAccount.id} value={bankAccount.id}>
                                {bankAccount.name} ({bankAccount.currency} {bankAccount.balance})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMapAccountsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAccountMappings} 
              disabled={isLoadingAccounts || updateAccountMappingsMutation.isPending}
            >
              {updateAccountMappingsMutation.isPending ? (
                <>
                  <Spinner size="xs" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Mappings'
              )}
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
            <Button 
              onClick={handleSubmitApiCredentials} 
              disabled={!apiKey || !apiSecret || updateProviderMutation.isPending}
            >
              {updateProviderMutation.isPending ? (
                <>
                  <Spinner size="xs" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Credentials'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankingProviders;