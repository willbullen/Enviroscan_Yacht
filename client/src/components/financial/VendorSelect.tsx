import React, { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVendors, type Vendor } from "@/contexts/VendorContext";
import { VendorDialog } from "./VendorDialog";

interface VendorSelectProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function VendorSelect({
  value,
  onValueChange,
  placeholder = "Select vendor",
  disabled = false,
  className,
  triggerClassName,
}: VendorSelectProps) {
  const [open, setOpen] = useState(false);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const { activeVendors, isLoading, refetchVendors } = useVendors();

  // Find selected vendor from the value
  const selectedVendor = activeVendors.find(vendor => vendor.id === value);

  // Handle new vendor creation success
  const handleVendorSuccess = () => {
    refetchVendors();
  };

  // Group vendors by category
  const groupedVendors: Record<string, Vendor[]> = activeVendors.reduce(
    (acc, vendor) => {
      const category = vendor.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(vendor);
      return acc;
    },
    {} as Record<string, Vendor[]>
  );

  // Sort categories for display
  const sortedCategories = Object.keys(groupedVendors).sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", triggerClassName)}
            disabled={disabled}
          >
            {selectedVendor ? selectedVendor.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <Command>
            <CommandInput placeholder="Search vendor..." />
            <CommandList>
              <CommandEmpty>
                {isLoading 
                  ? "Loading vendors..." 
                  : "No vendor found. Add a new one?"}
              </CommandEmpty>
              
              {sortedCategories.map((category) => (
                <CommandGroup key={category} heading={category}>
                  {groupedVendors[category].map((vendor) => (
                    <CommandItem
                      key={vendor.id}
                      value={vendor.name}
                      onSelect={() => {
                        onValueChange(vendor.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === vendor.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {vendor.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              
              <CommandSeparator />
              
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setVendorDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new vendor
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <VendorDialog 
        open={vendorDialogOpen} 
        onOpenChange={setVendorDialogOpen} 
        onSuccess={handleVendorSuccess}
      />
    </div>
  );
}