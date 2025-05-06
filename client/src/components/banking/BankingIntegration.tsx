import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { useVessel } from '@/contexts/VesselContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { formatDate, formatCurrency } from '@/lib/utils';
import { PlusCircle, RefreshCw, Trash2, ExternalLink, Link2, Building2, LinkIcon } from 'lucide-react';

type BankingProvider = {
  id: number;
  name: string;
  apiType: string;
  logoUrl?: string;
  isActive: boolean;
};

type BankConnection = {
  id: number;
  providerId: number;
  vesselId: number;
  accountName: string;
  bankAccountId: string;
  status: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  provider?: BankingProvider;
};

type SyncLog = {
  id: number;
  connectionId: number;
  status: string;
  startDate: string;
  endDate?: string;
  recordsFetched?: number;
  recordsProcessed?: number;
  errorDetails?: string;
};

const connectionFormSchema = z.object({
  providerId: z.number({ required_error: "Please select a banking provider" }),
  accountName: z.string().min(3, { message: "Account name must be at least 3 characters" }),
  bankAccountId: z.string().min(1, { message: "Bank account ID is required" }),
  apiKey: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  accessToken: z.string().optional(),
});

const BankingIntegration = () => {
  const { currentVessel } = useVessel();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<BankingProvider | null>(null);
  const [showSyncHistory, setShowSyncHistory] = useState<number | null>(null);

  // Get all banking providers
  const { data: providers = [], isLoading: isLoadingProviders } = useQuery({
    queryKey: ['/api/banking/providers'],
    queryFn: () => apiRequest('GET', '/api/banking/providers'),
  });

  // Get all bank connections for this vessel
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['/api/banking/connections/vessel', currentVessel?.id],
    queryFn: async () => {
      if (!currentVessel) return [];
      return apiRequest('GET', `/api/banking/connections/vessel/${currentVessel.id}`);
    },
    enabled: !!currentVessel,
  });

  // Get sync history for a specific connection
  const { data: syncHistory = [], isLoading: isLoadingSyncHistory } = useQuery({
    queryKey: ['/api/banking/connections/sync-history', showSyncHistory],
    queryFn: async () => {
      if (!showSyncHistory) return [];
      return apiRequest('GET', `/api/banking/connections/${showSyncHistory}/sync-history`);
    },
    enabled: !!showSyncHistory,
  });

  // Create a new bank connection
  const createConnectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/banking/connections', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Bank connection created successfully',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/banking/connections/vessel'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to create bank connection',
        variant: 'destructive',
      });
    },
  });

  // Delete a bank connection
  const deleteConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/banking/connections/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Bank connection deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/banking/connections/vessel'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to delete bank connection',
        variant: 'destructive',
      });
    },
  });

  // Sync a bank connection
  const syncConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/banking/connections/${id}/sync`);
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Synced ${data.transactions?.length || 0} transactions successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/banking/connections/vessel'] });
      if (showSyncHistory) {
        queryClient.invalidateQueries({ queryKey: ['/api/banking/connections/sync-history'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.error || 'Failed to sync bank connection',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<z.infer<typeof connectionFormSchema>>({
    resolver: zodResolver(connectionFormSchema),
  });

  const handleProviderChange = (value: string) => {
    const providerId = parseInt(value);
    const provider = providers.find(p => p.id === providerId);
    setSelectedProvider(provider || null);
    form.setValue('providerId', providerId);
  };

  const onSubmit = (values: z.infer<typeof connectionFormSchema>) => {
    if (!currentVessel) {
      toast({
        title: 'Error',
        description: 'Please select a vessel first',
        variant: 'destructive',
      });
      return;
    }

    // Prepare credentials based on provider type
    let credentials = {};
    if (selectedProvider?.apiType === 'api_key') {
      credentials = { apiKey: values.apiKey };
    } else if (selectedProvider?.apiType === 'oauth') {
      credentials = {
        clientId: values.clientId,
        clientSecret: values.clientSecret,
        accessToken: values.accessToken,
      };
    }

    createConnectionMutation.mutate({
      providerId: values.providerId,
      vesselId: currentVessel.id,
      accountName: values.accountName,
      bankAccountId: values.bankAccountId,
      credentials,
    });
  };

  const handleDelete = (connection: BankConnection) => {
    if (confirm(`Are you sure you want to delete the connection to ${connection.accountName}?`)) {
      deleteConnectionMutation.mutate(connection.id);
    }
  };

  const handleSync = (connection: BankConnection) => {
    syncConnectionMutation.mutate(connection.id);
  };

  if (!currentVessel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Banking Integrations</CardTitle>
          <CardDescription>Connect to your vessel's banking accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Please select a vessel to view banking integrations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Banking Integrations</CardTitle>
          <CardDescription>Connect to banking providers for {currentVessel.name}</CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingConnections ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Loading banking connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-md bg-muted/20">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Banking Connections</h3>
            <p className="text-muted-foreground mb-6">Connect to your banking providers to import transactions automatically</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Connect a Bank
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {connection.provider?.logoUrl ? (
                            <img 
                              src={connection.provider.logoUrl} 
                              alt={connection.provider.name} 
                              className="h-6 w-6 rounded" 
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span>{connection.provider?.name || 'Unknown Provider'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{connection.accountName}</TableCell>
                      <TableCell>
                        <Badge variant={connection.status === 'active' ? 'outline' : 'secondary'}>
                          {connection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {connection.lastSyncedAt ? formatDate(connection.lastSyncedAt) : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleSync(connection)}
                            title="Sync data"
                            disabled={syncConnectionMutation.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 ${syncConnectionMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSyncHistory(connection.id)}
                            title="Show sync history"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(connection)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete connection"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Sync History Dialog */}
            <Dialog open={!!showSyncHistory} onOpenChange={(open) => !open && setShowSyncHistory(null)}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Sync History</DialogTitle>
                  <DialogDescription>
                    Recent synchronization history for this banking connection
                  </DialogDescription>
                </DialogHeader>
                
                {isLoadingSyncHistory ? (
                  <div className="flex justify-center py-8">
                    <p className="text-muted-foreground">Loading sync history...</p>
                  </div>
                ) : syncHistory.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No sync history found</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Records Fetched</TableHead>
                          <TableHead>Records Processed</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncHistory.map((log: SyncLog) => (
                          <TableRow key={log.id}>
                            <TableCell>{formatDate(log.startDate)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                log.status === 'completed' ? 'outline' :
                                log.status === 'failed' ? 'destructive' :
                                log.status === 'in_progress' ? 'secondary' : 'default'
                              }>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.recordsFetched || 0}</TableCell>
                            <TableCell>{log.recordsProcessed || 0}</TableCell>
                            <TableCell>
                              {log.endDate ? (
                                `${Math.round((new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) / 1000)}s`
                              ) : 'In progress'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSyncHistory(null)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>

      {/* Add Connection Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Banking Provider</DialogTitle>
            <DialogDescription>
              Add a new banking connection for {currentVessel.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banking Provider</FormLabel>
                    <Select onValueChange={handleProviderChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a banking provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingProviders ? (
                          <SelectItem value="loading" disabled>Loading providers...</SelectItem>
                        ) : providers.length === 0 ? (
                          <SelectItem value="none" disabled>No providers available</SelectItem>
                        ) : (
                          providers.map((provider) => (
                            <SelectItem 
                              key={provider.id} 
                              value={provider.id.toString()}
                              disabled={!provider.isActive}
                            >
                              {provider.name}
                              {!provider.isActive && ' (Inactive)'}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose your banking provider
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Vessel Operations Account" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this bank account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12345678" {...field} />
                    </FormControl>
                    <FormDescription>
                      The account number or ID at your banking provider
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedProvider?.apiType === 'api_key' && (
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your API key" {...field} />
                      </FormControl>
                      <FormDescription>
                        The API key provided by {selectedProvider.name}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {selectedProvider?.apiType === 'oauth' && (
                <>
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                          <Input placeholder="OAuth Client ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="OAuth Client Secret" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accessToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Token</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="OAuth Access Token" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createConnectionMutation.isPending}
                >
                  {createConnectionMutation.isPending ? 'Creating...' : 'Create Connection'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BankingIntegration;