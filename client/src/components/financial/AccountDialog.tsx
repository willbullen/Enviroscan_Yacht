import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useVessel } from '@/contexts/VesselContext';
import { Form, FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { queryClient } from '@/lib/queryClient';

// Define types for account data
export interface FinancialAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  accountType: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  parentAccountId?: number | null;
  balance: number;
  vesselId: number;
  createdById?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define schema for account form
const accountSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.string().min(1, 'Account type is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  parentAccountId: z.number().optional().nullable(),
  initialBalance: z.number().default(0),
  currency: z.string().default('USD')
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: FinancialAccount;
  onSuccess?: () => void;
}

export function AccountDialog({ open, onOpenChange, account, onSuccess }: AccountDialogProps) {
  const { toast } = useToast();
  const { currentVessel } = useVessel();
  const isEditMode = !!account;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountNumber: '',
      accountName: '',
      accountType: 'asset',
      category: 'operational',
      description: null,
      isActive: true,
      parentAccountId: null,
      initialBalance: 0,
      currency: 'USD'
    },
  });

  // Populate form when editing an existing account
  useEffect(() => {
    if (account) {
      const formValues: AccountFormValues = {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        category: account.category,
        description: account.description,
        isActive: account.isActive,
        parentAccountId: account.parentAccountId || null,
        // For editing, we don't modify the balance directly via initial balance
        initialBalance: 0, 
        currency: 'USD' // Assuming USD as default, adjust if storing currency in account
      };
      form.reset(formValues);
    } else {
      // Reset form when not in edit mode
      form.reset({
        accountNumber: '',
        accountName: '',
        accountType: 'asset',
        category: 'operational',
        description: null,
        isActive: true,
        parentAccountId: null,
        initialBalance: 0,
        currency: 'USD'
      });
    }
  }, [account, form]);

  const onSubmit = async (values: AccountFormValues) => {
    if (!currentVessel?.id) {
      toast({
        title: "Error",
        description: "No vessel selected. Please select a vessel first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = isEditMode 
        ? `/api/financial-accounts/${account?.id}` 
        : '/api/financial-accounts';
      
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const payload = {
        ...values,
        vesselId: currentVessel.id,
        // Only include initialBalance for new accounts
        ...(isEditMode ? {} : { balance: values.initialBalance }),
      };
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save account');
      }
      
      const savedAccount = await response.json();
      
      // Show success toast
      toast({
        title: isEditMode ? "Account Updated" : "Account Created",
        description: `${values.accountName} has been ${isEditMode ? 'updated' : 'created'} successfully.`,
        variant: "default",
      });
      
      // Invalidate the accounts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/financial-accounts/vessel', currentVessel.id] });
      
      // Close dialog and call onSuccess if provided
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save account:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} account. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Update financial account information for ${currentVessel?.name || 'the vessel'}.` 
              : `Create a new financial account for ${currentVessel?.name || 'the vessel'}.`}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter account name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter account number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type <span className="text-destructive">*</span></FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="liability">Liability</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="crew">Crew</SelectItem>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="docking">Docking Fees</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="provisions">Provisions</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="capital">Capital</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {!isEditMode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initialBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Balance</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD ($)</SelectItem>
                          <SelectItem value="AUD">AUD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Account description" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active Account</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive accounts won't appear in selection lists
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Account' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}