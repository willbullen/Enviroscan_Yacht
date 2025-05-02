import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Vendor {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxIdentifier?: string | null;
  accountNumber?: string | null;
  website?: string | null;
  notes?: string | null;
  category?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NewVendor = Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & {
  isActive?: boolean;
};

interface VendorContextType {
  vendors: Vendor[];
  activeVendors: Vendor[];
  isLoading: boolean;
  error: Error | null;
  createVendor: (vendorData: NewVendor) => Promise<Vendor>;
  updateVendor: (id: number, vendorData: Partial<Vendor>) => Promise<Vendor>;
  deleteVendor: (id: number) => Promise<void>;
  refetchVendors: () => Promise<void>;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for fetching all vendors
  const { 
    data: vendors = [], 
    isLoading, 
    error,
    refetch
  } = useQuery<Vendor[], Error>({
    queryKey: ['/api/vendors'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for fetching active vendors only
  const { 
    data: activeVendors = [], 
  } = useQuery<Vendor[], Error>({
    queryKey: ['/api/vendors/active'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for creating a new vendor
  const createVendorMutation = useMutation({
    mutationFn: async (vendorData: NewVendor): Promise<Vendor> => {
      const response = await apiRequest('/api/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorData),
      });
      return response as Vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/active'] });
      toast({
        title: 'Vendor created',
        description: 'The vendor has been created successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating vendor',
        description: error.message || 'There was an error creating the vendor.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating a vendor
  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Vendor> }): Promise<Vendor> => {
      const response = await apiRequest(`/api/vendors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return response as Vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/active'] });
      toast({
        title: 'Vendor updated',
        description: 'The vendor has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating vendor',
        description: error.message || 'There was an error updating the vendor.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting a vendor
  const deleteVendorMutation = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiRequest(`/api/vendors/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/active'] });
      toast({
        title: 'Vendor deleted',
        description: 'The vendor has been deleted successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting vendor',
        description: error.message || 'There was an error deleting the vendor.',
        variant: 'destructive',
      });
    },
  });

  const createVendor = async (vendorData: NewVendor): Promise<Vendor> => {
    return await createVendorMutation.mutateAsync(vendorData);
  };

  const updateVendor = async (id: number, vendorData: Partial<Vendor>): Promise<Vendor> => {
    return await updateVendorMutation.mutateAsync({ id, data: vendorData });
  };

  const deleteVendor = async (id: number): Promise<void> => {
    await deleteVendorMutation.mutateAsync(id);
  };

  const refetchVendors = async (): Promise<void> => {
    await refetch();
  };

  return (
    <VendorContext.Provider
      value={{
        vendors,
        activeVendors,
        isLoading,
        error: error || null,
        createVendor,
        updateVendor,
        deleteVendor,
        refetchVendors,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export const useVendors = () => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendors must be used within a VendorProvider');
  }
  return context;
};