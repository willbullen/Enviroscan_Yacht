import React, { useState, useEffect } from "react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner"; 
import { PlusCircle, Database, Shield, RefreshCw } from "lucide-react";

// Types
interface BankingProvider {
  id: number;
  name: string;
  description: string;
  apiType: string;
  baseUrl: string;
  isActive: boolean;
  authType: string;
  requiredCredentials: Record<string, string>; // Fields needed for connection
}

interface ProviderCredentials {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  bearerToken?: string;
  [key: string]: string | undefined;
}

const BankingProviders: React.FC = () => {
  const { settings } = useSystemSettings();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<BankingProvider | null>(null);
  const [providerCredentials, setProviderCredentials] = useState<ProviderCredentials>({});

  // Fetch banking providers
  const { data: providers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/banking/providers'],
    retry: false,
    enabled: !settings.useMockBankingData, // Only fetch real providers if not using mock data
  });

  // If using mock data, provide some placeholder providers
  const displayProviders: BankingProvider[] = settings.useMockBankingData
    ? [
      {
        id: 1,
        name: "Centtrip",
        description: "Multi-currency banking and expense management",
        apiType: "centtrip",
        baseUrl: "https://api.centtrip.com",
        isActive: true,
        authType: "api_key",
        requiredCredentials: { apiKey: "API Key" }
      },
      {
        id: 2,
        name: "Revolut",
        description: "Business banking with multi-currency accounts",
        apiType: "revolut",
        baseUrl: "https://api.revolut.com",
        isActive: false,
        authType: "oauth2",
        requiredCredentials: { clientId: "Client ID", clientSecret: "Client Secret" }
      }
    ]
    : (providers as BankingProvider[]);

  // Handle provider connection test
  const testProviderConnection = async (provider: BankingProvider) => {
    if (settings.useMockBankingData) {
      // Simulate a connection test
      toast({
        title: "Test Connection Successful",
        description: `Successfully connected to ${provider.name} API (demo mode)`,
      });
      return;
    }

    try {
      // In a real app, this would test the connection to the banking API
      const response = await fetch(`/api/banking/test-connection/${provider.id}`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${provider.name} API`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Connection Failed",
          description: errorData.message || "Failed to connect to banking API",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    }
  };

  // Handle saving provider credentials
  const saveProviderCredentials = async () => {
    if (!selectedProvider) return;

    if (settings.useMockBankingData) {
      // Simulate saving credentials in demo mode
      toast({
        title: "Credentials Saved",
        description: `${selectedProvider.name} credentials saved successfully (demo mode)`,
      });
      setIsEditDialogOpen(false);
      return;
    }

    try {
      // In a real app, this would save the API credentials securely
      const response = await fetch(`/api/banking/providers/${selectedProvider.id}/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(providerCredentials),
      });

      if (response.ok) {
        toast({
          title: "Credentials Saved",
          description: `${selectedProvider.name} credentials saved successfully`,
        });
        setIsEditDialogOpen(false);
        refetch(); // Refresh the providers list
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to save credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving credentials",
        variant: "destructive",
      });
    }
  };

  // Handle editing provider credentials
  const editProviderCredentials = (provider: BankingProvider) => {
    setSelectedProvider(provider);
    setProviderCredentials({}); // Reset credentials
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Banking Providers</h3>
        <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {settings.useMockBankingData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Database className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode Active:</strong> Using simulated banking data. To connect to real banking APIs, disable demo mode in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayProviders.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                  <Badge variant={provider.isActive ? "default" : "outline"}>
                    {provider.isActive ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API Type:</span>
                    <span>{provider.apiType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Auth Method:</span>
                    <span>{provider.authType === "api_key" ? "API Key" : "OAuth2"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => testProviderConnection(provider)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Test Connection
                </Button>
                <Button onClick={() => editProviderCredentials(provider)}>
                  <Shield className="mr-2 h-4 w-4" /> Manage Credentials
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add Provider Dialog - TODO: Implement in the future */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Banking Provider</DialogTitle>
            <DialogDescription>
              Add a new banking provider to integrate with your financial data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-center text-muted-foreground">
              This feature will be available in a future update. 
              Currently, Centtrip and Revolut are the supported banking providers.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Provider Credentials Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProvider?.name} API Credentials
            </DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect to {selectedProvider?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedProvider && Object.entries(selectedProvider.requiredCredentials).map(([key, label]) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right">
                  {label}
                </Label>
                <Input
                  id={key}
                  type="password"
                  value={providerCredentials[key] || ""}
                  onChange={(e) => setProviderCredentials({
                    ...providerCredentials,
                    [key]: e.target.value
                  })}
                  className="col-span-3"
                  placeholder={`Enter your ${label}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProviderCredentials}>
              Save Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankingProviders;