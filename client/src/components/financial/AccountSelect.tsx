import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useVessel } from "@/contexts/VesselContext";

interface AccountSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function AccountSelect({ 
  value, 
  onValueChange,
  className 
}: AccountSelectProps) {
  const { currentVessel } = useVessel();
  
  // Fetch accounts for current vessel
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['/api/financial-accounts/vessel', currentVessel?.id],
    queryFn: async () => {
      if (!currentVessel?.id) return [];
      const response = await fetch(`/api/financial-accounts/vessel/${currentVessel.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      return response.json();
    },
    enabled: !!currentVessel?.id,
  });

  return (
    <Select 
      value={value || undefined}
      onValueChange={onValueChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="p-2 text-sm text-center text-muted-foreground">
            Loading accounts...
          </div>
        ) : accounts && Array.isArray(accounts) && accounts.length > 0 ? (
          accounts.map((account: any) => (
            <SelectItem key={account.id} value={account.id.toString()}>
              {account.accountName} ({account.accountNumber})
            </SelectItem>
          ))
        ) : (
          <div className="p-2 text-sm text-center text-muted-foreground">
            No accounts found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

export default AccountSelect;