import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

export function formatCurrency(amount: string | number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
}

// Format transaction status for display
export function formatTransactionStatus(status: string | undefined | null): string {
  if (!status) return 'Unknown';
  
  // Capitalize first letter and replace underscores with spaces
  const formatted = status.toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  
  return formatted;
}

// Get appropriate status badge color based on transaction status
export function getStatusColor(status: string | undefined | null): string {
  if (!status) return 'bg-gray-200 text-gray-800'; // default/unknown
  
  const statusLower = status.toLowerCase();
  
  switch(statusLower) {
    case 'reconciled':
    case 'matched':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'unmatched':
    case 'needs_review':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'error':
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}