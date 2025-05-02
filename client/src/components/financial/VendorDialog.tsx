import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVendors, type Vendor } from '@/contexts/VendorContext';
import { Form, FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Define schema for vendor form
const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxIdentifier: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor;
  onSuccess?: () => void;
}

export function VendorDialog({ open, onOpenChange, vendor, onSuccess }: VendorDialogProps) {
  const { createVendor, updateVendor } = useVendors();
  const isEditMode = !!vendor;

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      contactPerson: null,
      email: null,
      phone: null,
      address: null,
      taxIdentifier: null,
      accountNumber: null,
      website: null,
      notes: null,
      category: null,
      isActive: true,
    },
  });

  // Populate form when editing an existing vendor
  useEffect(() => {
    if (vendor) {
      const formValues: VendorFormValues = {
        name: vendor.name,
        contactPerson: vendor.contactPerson || null,
        email: vendor.email || null,
        phone: vendor.phone || null,
        address: vendor.address || null,
        taxIdentifier: vendor.taxIdentifier || null,
        accountNumber: vendor.accountNumber || null,
        website: vendor.website || null,
        notes: vendor.notes || null,
        category: vendor.category || null,
        isActive: vendor.isActive,
      };
      form.reset(formValues);
    } else {
      // Reset form when not in edit mode
      form.reset({
        name: '',
        contactPerson: null,
        email: null,
        phone: null,
        address: null,
        taxIdentifier: null,
        accountNumber: null,
        website: null,
        notes: null,
        category: null,
        isActive: true,
      });
    }
  }, [vendor, form]);

  const onSubmit = async (values: VendorFormValues) => {
    try {
      if (isEditMode && vendor) {
        await updateVendor(vendor.id, values);
      } else {
        await createVendor(values);
      }
      
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save vendor:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update vendor information in the system.' 
              : 'Create a new vendor for financial transactions.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Vendor Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter vendor name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Contact name" 
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value || null)}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="provisions">Provisions</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="Email address" 
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Phone number" 
                        value={field.value || ''} 
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Vendor address" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxIdentifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Identifier</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Tax ID / VAT number" 
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
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Account number" 
                        value={field.value || ''} 
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Website URL" 
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes" 
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
                    <FormLabel>Active Vendor</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Inactive vendors won't appear in selection lists
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
                {isEditMode ? 'Update Vendor' : 'Create Vendor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}