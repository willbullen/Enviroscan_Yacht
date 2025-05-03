import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface VendorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  onAddNewClick: () => void;
  className?: string;
}

export function VendorSelect({ 
  value, 
  onValueChange, 
  onAddNewClick,
  className 
}: VendorSelectProps) {
  // Fetch vendors
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await fetch('/api/vendors');
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      return response.json();
    }
  });

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-baseline">
        <div className="flex-1">
          <Select 
            value={value || undefined}
            onValueChange={onValueChange}
          >
            <SelectTrigger id="vendor-select-trigger" className={className}>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="p-2 text-sm text-center text-muted-foreground">
                  Loading vendors...
                </div>
              ) : vendors && Array.isArray(vendors) && vendors.length > 0 ? (
                vendors.map((vendor: any) => (
                  vendor.id ? (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ) : null
                ))
              ) : (
                <div className="p-2 text-sm text-center text-muted-foreground">
                  No vendors found
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
        <Button 
          type="button" 
          variant="link" 
          size="sm" 
          className="h-auto p-0 ml-2 text-xs"
          onClick={onAddNewClick}
        >
          + Add New
        </Button>
      </div>
    </div>
  );
}

export default VendorSelect;