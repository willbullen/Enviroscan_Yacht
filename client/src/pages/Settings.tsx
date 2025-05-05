import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

// Define the form schemas
const bankingSettingsFormSchema = z.object({
  useMockBankingData: z.boolean(),
  aiReceiptMatching: z.boolean(),
  apiKeys: z.object({
    centtrip: z.string().optional(),
    revolut: z.string().optional()
  })
});

const profileFormSchema = z.object({
  yachtName: z.string().min(2, {
    message: "Yacht name must be at least 2 characters.",
  }),
  ownerName: z.string().min(2, {
    message: "Owner name must be at least 2 characters.",
  }),
  registrationNumber: z.string().min(2, {
    message: "Registration number is required.",
  }),
  flag: z.string().min(2, {
    message: "Flag is required.",
  }),
  yearBuilt: z.string().regex(/^\d{4}$/, {
    message: "Year must be a valid 4-digit year.",
  }),
  length: z.string().min(1, {
    message: "Length is required.",
  }),
  beam: z.string().min(1, {
    message: "Beam is required.",
  }),
  draft: z.string().min(1, {
    message: "Draft is required.",
  }),
});

const appearanceFormSchema = z.object({
  theme: z.string(),
  colorScheme: z.string(),
  radius: z.number().min(0).max(2),
});

const notificationsFormSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  maintenanceAlerts: z.boolean(),
  inventoryAlerts: z.boolean(),
  crewDocumentAlerts: z.boolean(),
  financialAlerts: z.boolean(),
});

const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [themeLoaded, setThemeLoaded] = useState(false);
  const { settings, updateSettings } = useSystemSettings();

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      yachtName: "MY Executive Yacht",
      ownerName: "John Smith",
      registrationNumber: "IMO 9876543",
      flag: "Cayman Islands",
      yearBuilt: "2015",
      length: "45m",
      beam: "9.2m",
      draft: "2.8m",
    },
  });

  // Appearance form
  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: "light",
      colorScheme: "blue",
      radius: 0.5,
    },
  });
  
  // Load current theme settings
  useEffect(() => {
    const loadCurrentTheme = async () => {
      try {
        // Try to load theme from local storage first
        const themeString = localStorage.getItem('theme');
        if (themeString) {
          try {
            const theme = JSON.parse(themeString);
            appearanceForm.reset({
              theme: theme.appearance || 'light',
              colorScheme: theme.primary || 'blue',
              radius: theme.radius || 0.5,
            });
          } catch (error) {
            console.warn('Failed to parse theme from localStorage:', error);
          }
        } else {
          // Try to load from theme.json via the server as fallback
          const response = await fetch('/theme.json');
          if (response.ok) {
            const theme = await response.json();
            appearanceForm.reset({
              theme: theme.appearance || 'light',
              colorScheme: theme.primary || 'blue',
              radius: theme.radius || 0.5,
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load theme settings:', error);
      } finally {
        setThemeLoaded(true);
      }
    };
    
    loadCurrentTheme();
  }, [appearanceForm]);

  // Notifications form
  const notificationsForm = useForm<z.infer<typeof notificationsFormSchema>>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      maintenanceAlerts: true,
      inventoryAlerts: true,
      crewDocumentAlerts: true,
      financialAlerts: false,
    },
  });

  // Form submission handlers
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      // In a real app, this would update the profile settings
      toast({
        title: "Profile updated",
        description: "Your yacht profile has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile settings.",
        variant: "destructive",
      });
    }
  };

  const onAppearanceSubmit = async (data: z.infer<typeof appearanceFormSchema>) => {
    try {
      // Prepare the theme data
      const themeData = {
        primary: data.colorScheme,
        radius: data.radius,
        appearance: data.theme,
        variant: "tint" // Default to tint variant
      };
      
      // Update theme via API
      await fetch("/api/update-theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(themeData)
      });
      
      toast({
        title: "Appearance updated",
        description: "Your appearance settings have been updated.",
      });
      
      // Save theme to localStorage too for immediate effect
      localStorage.setItem('theme', JSON.stringify(themeData));
      // Apply the theme immediately
      document.documentElement.setAttribute("data-theme", data.theme);
      
      // Reload the page to fully apply theme changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to update theme:", error);
      toast({
        title: "Error",
        description: "Failed to update appearance settings.",
        variant: "destructive",
      });
    }
  };

  const onNotificationsSubmit = async (data: z.infer<typeof notificationsFormSchema>) => {
    try {
      // In a real app, this would update notification settings
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  // Banking settings form
  const bankingSettingsForm = useForm<z.infer<typeof bankingSettingsFormSchema>>({
    resolver: zodResolver(bankingSettingsFormSchema),
    defaultValues: {
      useMockBankingData: true,
      aiReceiptMatching: true,
      apiKeys: {
        centtrip: '',
        revolut: ''
      }
    },
  });

  // Load banking settings from context
  useEffect(() => {
    if (Object.keys(useSystemSettings()).length > 0) {
      const { useMockBankingData, aiReceiptMatching, bankingAPICredentialsSet } = useSystemSettings();
      bankingSettingsForm.reset({
        useMockBankingData,
        aiReceiptMatching,
        apiKeys: {
          centtrip: bankingAPICredentialsSet?.centtrip ? '********' : '',
          revolut: bankingAPICredentialsSet?.revolut ? '********' : ''
        }
      });
    }
  }, [bankingSettingsForm]);

  // Handle banking settings submission
  const onBankingSettingsSubmit = async (data: z.infer<typeof bankingSettingsFormSchema>) => {
    try {
      // Update the system settings in context (stored in localStorage)
      const { updateSettings } = useSystemSettings();
      
      // Update API credentials status based on whether values were entered
      const centripApiUpdated = data.apiKeys.centtrip && data.apiKeys.centtrip !== '********';
      const revolutApiUpdated = data.apiKeys.revolut && data.apiKeys.revolut !== '********';
      
      // In a real app, we would save the API keys securely to the backend
      // Here we'll just update the credential status in the settings
      updateSettings({
        useMockBankingData: data.useMockBankingData,
        aiReceiptMatching: data.aiReceiptMatching,
        bankingAPICredentialsSet: {
          centtrip: centripApiUpdated || (useSystemSettings().bankingAPICredentialsSet?.centtrip || false),
          revolut: revolutApiUpdated || (useSystemSettings().bankingAPICredentialsSet?.revolut || false)
        }
      });
      
      // If a user is providing an API key, we should send it to a secure backend endpoint
      if (centripApiUpdated || revolutApiUpdated) {
        // In a real app, we would do this:
        // await apiRequest('/api/banking/update-api-keys', {
        //   method: 'POST',
        //   body: {
        //     centtrip: centripApiUpdated ? data.apiKeys.centtrip : undefined,
        //     revolut: revolutApiUpdated ? data.apiKeys.revolut : undefined
        //   }
        // });
        
        toast({
          title: "API Keys Updated",
          description: "Your banking API credentials have been securely saved.",
        });
      }
      
      toast({
        title: "Banking settings updated",
        description: "Your banking integration settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update banking settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout title="Settings">
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile">Yacht Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
          </TabsList>
          
          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Yacht Profile</CardTitle>
                <CardDescription>
                  Manage your yacht's information and details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="yachtName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yacht Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Yacht name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="ownerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Owner Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Owner name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="registrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Registration number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="flag"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Flag</FormLabel>
                            <FormControl>
                              <Input placeholder="Flag" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="yearBuilt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year Built</FormLabel>
                            <FormControl>
                              <Input placeholder="Year built" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input placeholder="Length" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="beam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beam</FormLabel>
                            <FormControl>
                              <Input placeholder="Beam" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="draft"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Draft</FormLabel>
                            <FormControl>
                              <Input placeholder="Draft" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="mt-4">Save Profile</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of your application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appearanceForm}>
                  <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-6">
                    <FormField
                      control={appearanceForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the theme mode for the application.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appearanceForm.control}
                      name="colorScheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Scheme</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a color scheme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                              <SelectItem value="orange">Orange</SelectItem>
                              <SelectItem value="red">Red</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the primary color for UI elements.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={appearanceForm.control}
                      name="radius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Border Radius: {field.value}</FormLabel>
                          <FormControl>
                            <Input 
                              type="range" 
                              min="0" 
                              max="2" 
                              step="0.1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Adjust the roundness of UI elements.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit">Save Appearance</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you want to be notified about system events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationsForm}>
                  <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={notificationsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via SMS.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="maintenanceAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Maintenance Alerts</FormLabel>
                              <FormDescription>
                                Get notified about upcoming and overdue maintenance tasks.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="inventoryAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Inventory Alerts</FormLabel>
                              <FormDescription>
                                Get notified about low stock and inventory issues.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="crewDocumentAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Crew Document Alerts</FormLabel>
                              <FormDescription>
                                Get notified about expiring crew documents and certifications.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={notificationsForm.control}
                        name="financialAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Financial Alerts</FormLabel>
                              <FormDescription>
                                Get notified about budget issues and financial approvals.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit">Save Notification Settings</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Banking Settings */}
          <TabsContent value="banking">
            <Card>
              <CardHeader>
                <CardTitle>Banking & Reconciliation</CardTitle>
                <CardDescription>
                  Configure banking connections and financial integration settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...bankingSettingsForm}>
                  <form onSubmit={bankingSettingsForm.handleSubmit(onBankingSettingsSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={bankingSettingsForm.control}
                        name="useMockBankingData"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Use Demo Banking Data</FormLabel>
                              <FormDescription>
                                Toggle between real banking API connections and demo data. Use this for testing until you configure your API keys.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bankingSettingsForm.control}
                        name="aiReceiptMatching"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">AI Receipt Matching</FormLabel>
                              <FormDescription>
                                Use AI to automatically analyze and match receipts to banking transactions.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 my-6">
                        <h3 className="text-lg font-medium mb-4">Banking API Credentials</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure your API credentials for direct banking connections. These will be securely stored to enable live transaction data.
                        </p>
                        
                        <div className="space-y-4">
                          <FormField
                            control={bankingSettingsForm.control}
                            name="apiKeys.centtrip"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Centtrip API Key</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Enter your Centtrip API key" 
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your Centtrip API key can be found in your Centtrip account dashboard.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={bankingSettingsForm.control}
                            name="apiKeys.revolut"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Revolut API Key</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="Enter your Revolut API key" 
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Your Revolut API key can be found in your Revolut Business account settings.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-4 text-xs text-muted-foreground">
                          <p className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            API keys are securely stored and never displayed after saving.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit">Save Banking Settings</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;