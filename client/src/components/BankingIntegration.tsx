import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { apiRequest } from "@lib/queryClient";
import { Loader2, RefreshCw, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

// Define form schemas
const connectionFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  bankAccountId: z.string().min(1, "Bank account is required"),
  providerId: z.string().min(1, "API provider is required"),
  credentials: z.object({
    apiKey: z.string().optional(),
    accessToken: z.string().optional(),
  }).optional(),
});

const BankingIntegration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  
  const connectionForm = useForm({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      name: "",
      bankAccountId: "",
      providerId: "",
      credentials: {
        apiKey: "",
        accessToken: "",
      },
    },
  });

  // Load bank accounts and providers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch bank accounts
        const bankAccountsResp = await apiRequest("/api/banking/accounts", {
          method: "GET",
        });
        
        // Fetch API providers
        const providersResp = await apiRequest("/api/banking/providers", {
          method: "GET",
        });
        
        // Fetch existing connections
        const connectionsResp = await apiRequest("/api/banking/connections", {
          method: "GET",
        });
        
        setBankAccounts(bankAccountsResp.data || []);
        setProviders(providersResp.data || []);
        setConnections(connectionsResp.data || []);
      } catch (error) {
        console.error("Error fetching banking data:", error);
        toast({
          title: "Error",
          description: "Failed to load banking integration data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Handle connection form submission
  const onCreateConnection = async (data) => {
    try {
      setLoading(true);
      
      // Format the data based on the selected provider
      const provider = providers.find(p => p.id === parseInt(data.providerId));
      let credentials = {};
      
      if (provider.apiType === "centtrip") {
        credentials = { apiKey: data.credentials.apiKey };
      } else if (provider.apiType === "revolut") {
        credentials = { accessToken: data.credentials.accessToken };
      }
      
      const response = await apiRequest("/api/banking/connections", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          bankAccountId: parseInt(data.bankAccountId),
          providerId: parseInt(data.providerId),
          credentials,
        }),
      });
      
      if (response.data) {
        toast({
          title: "Success",
          description: "Banking connection created successfully",
        });
        
        // Refresh connections list
        const connectionsResp = await apiRequest("/api/banking/connections", {
          method: "GET",
        });
        
        setConnections(connectionsResp.data || []);
        setConnectionDialogOpen(false);
        connectionForm.reset();
      }
    } catch (error) {
      console.error("Error creating banking connection:", error);
      toast({
        title: "Error",
        description: "Failed to create banking connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync transactions
  const syncTransactions = async (connectionId) => {
    try {
      setSyncInProgress(true);
      
      const response = await apiRequest(`/api/banking/connections/${connectionId}/sync`, {
        method: "POST",
      });
      
      if (response.data) {
        toast({
          title: "Success",
          description: `Synced ${response.data.transactions.length} transactions`,
        });
        
        // Refresh sync logs
        loadSyncHistory(connectionId);
      }
    } catch (error) {
      console.error("Error syncing transactions:", error);
      toast({
        title: "Error",
        description: "Failed to sync transactions",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  // Load sync history for a connection
  const loadSyncHistory = async (connectionId) => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/banking/connections/${connectionId}/sync-history`, {
        method: "GET",
      });
      
      if (response.data) {
        setSyncLogs(response.data);
        setSelectedConnection(connectionId);
      }
    } catch (error) {
      console.error("Error loading sync history:", error);
      toast({
        title: "Error",
        description: "Failed to load sync history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get provider by ID
  const getProviderById = (id) => {
    return providers.find(p => p.id === id) || { name: "Unknown", apiType: "unknown" };
  };

  // Get bank account by ID
  const getBankAccountById = (id) => {
    return bankAccounts.find(a => a.id === id) || { name: "Unknown" };
  };

  // Render bank status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>;
    }
  };

  return (
    <div className="w-full space-y-4">
      <Tabs defaultValue="connections">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">Bank Connections</TabsTrigger>
          <TabsTrigger value="sync-history">Sync History</TabsTrigger>
          <TabsTrigger value="imports">Imported Transactions</TabsTrigger>
        </TabsList>
        
        {/* Bank Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Banking Connections</h2>
            <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add New Connection</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Banking Connection</DialogTitle>
                  <DialogDescription>
                    Connect to a banking API provider to automatically import transactions.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...connectionForm}>
                  <form onSubmit={connectionForm.handleSubmit(onCreateConnection)} className="space-y-4">
                    <FormField
                      control={connectionForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Connection Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Bank Connection" {...field} />
                          </FormControl>
                          <FormDescription>
                            Give this connection a descriptive name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={connectionForm.control}
                      name="bankAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a bank account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bankAccounts.map((account) => (
                                <SelectItem 
                                  key={account.id} 
                                  value={account.id.toString()}
                                >
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the bank account to link
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={connectionForm.control}
                      name="providerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Provider</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Reset credentials when provider changes
                              connectionForm.setValue("credentials", {});
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem 
                                  key={provider.id} 
                                  value={provider.id.toString()}
                                >
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the banking API provider
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {connectionForm.watch("providerId") && (
                      <>
                        {getProviderById(parseInt(connectionForm.watch("providerId"))).apiType === "centtrip" && (
                          <FormField
                            control={connectionForm.control}
                            name="credentials.apiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Enter your Centtrip API key" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Your Centtrip API key for authentication
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        {getProviderById(parseInt(connectionForm.watch("providerId"))).apiType === "revolut" && (
                          <FormField
                            control={connectionForm.control}
                            name="credentials.accessToken"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Access Token</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Enter your Revolut access token" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Your Revolut API access token
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}
                    
                    <DialogFooter>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Connection
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : connections.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <CardDescription>
                    No banking connections found. Create a new connection to automatically import transactions.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card key={connection.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{connection.name}</CardTitle>
                      <Badge className={connection.isActive ? "bg-green-500" : "bg-red-500"}>
                        {connection.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {getProviderById(connection.providerId).name} | {getBankAccountById(connection.bankAccountId).name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last synced:</span>
                        <span>{connection.lastSyncDate ? format(new Date(connection.lastSyncDate), 'MMM d, yyyy HH:mm') : 'Never'}</span>
                      </div>
                      
                      {connection.lastSyncStatus && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last sync status:</span>
                          <span>{renderStatusBadge(connection.lastSyncStatus)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSyncHistory(connection.id)}
                    >
                      View History
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => syncTransactions(connection.id)}
                      disabled={syncInProgress}
                    >
                      {syncInProgress ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Sync Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Sync History Tab */}
        <TabsContent value="sync-history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Sync History</h2>
            {selectedConnection && (
              <div className="flex gap-2">
                <Select 
                  value={selectedConnection.toString()} 
                  onValueChange={(val) => loadSyncHistory(parseInt(val))}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select a connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id.toString()}>
                        {conn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => loadSyncHistory(selectedConnection)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {!selectedConnection ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <CardDescription>
                    Select a banking connection to view its sync history.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : syncLogs.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <CardDescription>
                    No sync history found for this connection. Try syncing now.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableCaption>Sync history for selected connection</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records Fetched</TableHead>
                  <TableHead>Records Processed</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.startDate), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>{renderStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.recordsFetched || 0}</TableCell>
                    <TableCell>{log.recordsProcessed || 0}</TableCell>
                    <TableCell>
                      {log.endDate ? 
                        `${Math.round((new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) / 1000)}s` : 
                        'In progress'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        {/* Imported Transactions Tab */}
        <TabsContent value="imports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Imported Transactions</h2>
            {/* Additional filters could go here */}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recently Imported Transactions</CardTitle>
              <CardDescription>
                Transactions imported from your connected bank accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  Connect a bank account and sync to see imported transactions here.
                </p>
                <Button className="mt-4" onClick={() => setConnectionDialogOpen(true)}>
                  Add Bank Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BankingIntegration;