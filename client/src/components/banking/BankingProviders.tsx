import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';
import {
  ChevronRight,
  Wallet,
  CreditCard,
  RefreshCw,
  Link,
  AlertCircle,
  CircleCheck,
  Shield,
  Lock,
  CheckCircle2,
  ExternalLink,
  Clock,
  Download,
} from 'lucide-react';

interface BankingProvidersProps {
  vesselId: number;
}

export const BankingProviders: React.FC<BankingProvidersProps> = ({ vesselId }) => {
  const { useLiveBankingData, setUseLiveBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // Mock provider data - in a real app this would come from an API call
  const providers = [
    {
      id: 'centtrip',
      name: 'Centtrip',
      logo: <Wallet className="h-8 w-8 text-primary" />,
      description: 'Centtrip multi-currency banking platform',
      connected: useLiveBankingData ? bankingAPICredentialsSet.centtrip : true,
      lastSynced: '2025-05-04T18:30:00Z',
      accountCount: 3,
      transactionCount: 127,
    },
    {
      id: 'revolut',
      name: 'Revolut',
      logo: <CreditCard className="h-8 w-8 text-primary" />,
      description: 'Revolut business banking platform',
      connected: useLiveBankingData ? bankingAPICredentialsSet.revolut : true,
      lastSynced: '2025-05-05T09:15:00Z',
      accountCount: 2,
      transactionCount: 84,
    },
  ];

  const handleToggleLiveData = () => {
    setUseLiveBankingData(!useLiveBankingData);
  };

  const handleSyncProvider = (providerId: string) => {
    setSyncingProvider(providerId);
    
    // Simulate API call
    setTimeout(() => {
      setSyncingProvider(null);
    }, 2000);
  };

  const formatLastSyncTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium">Banking Data Source</h3>
          <p className="text-sm text-muted-foreground">
            Toggle between live API data and generated test data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="live-data-toggle" className={!useLiveBankingData ? 'text-muted-foreground' : ''}>
            {useLiveBankingData ? 'Live Data' : 'Test Data'}
          </Label>
          <Switch
            id="live-data-toggle"
            checked={useLiveBankingData}
            onCheckedChange={handleToggleLiveData}
          />
        </div>
      </div>

      {useLiveBankingData && !bankingAPICredentialsSet.centtrip && !bankingAPICredentialsSet.revolut && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Credentials Required</AlertTitle>
          <AlertDescription>
            You need to set up your banking API credentials in the Settings page before you can use live banking data.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.id} className={!provider.connected ? 'border-dashed opacity-70' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex items-center space-x-4">
                {provider.logo}
                <div>
                  <CardTitle className="text-xl">{provider.name}</CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </div>
              </div>
              <Badge variant={provider.connected ? 'default' : 'outline'}>
                {provider.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardHeader>
            <CardContent className="pb-2">
              {provider.connected ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Last Sync</p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1.5 text-muted-foreground" />
                      <span className="text-sm">{formatLastSyncTime(provider.lastSynced)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Accounts</p>
                    <div className="flex items-center mt-1">
                      <Wallet className="w-4 h-4 mr-1.5 text-muted-foreground" />
                      <span className="text-sm">{provider.accountCount} accounts</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Transactions</p>
                    <div className="flex items-center mt-1">
                      <Download className="w-4 h-4 mr-1.5 text-muted-foreground" />
                      <span className="text-sm">{provider.transactionCount} transactions</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <div className="flex items-center mt-1">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" />
                      <span className="text-sm">Healthy</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center py-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
                  <p className="text-sm text-muted-foreground">
                    {useLiveBankingData
                      ? 'This provider is not connected. Configure API credentials in Settings.'
                      : 'This provider is simulated in test mode.'}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" size="sm" asChild>
                <a href="#" className="inline-flex items-center">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Go to {provider.name}
                </a>
              </Button>
              <Button
                disabled={!provider.connected || syncingProvider === provider.id}
                variant="default"
                size="sm"
                onClick={() => handleSyncProvider(provider.id)}
              >
                {syncingProvider === provider.id ? (
                  <>
                    <Spinner size="xs" className="mr-1.5" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Sync Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {!useLiveBankingData && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Test Mode Active</AlertTitle>
          <AlertDescription>
            You are using generated test data. All banking operations are simulated
            and no actual API calls will be made.
          </AlertDescription>
        </Alert>
      )}

      {useLiveBankingData && (
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex items-start space-x-4">
            <Lock className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-medium">API Security</h3>
              <p className="text-sm text-muted-foreground">
                Your banking API credentials are securely stored and encrypted. All API
                communications are made using secure HTTPS connections.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/settings">
              Configure
              <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
};

export default BankingProviders;