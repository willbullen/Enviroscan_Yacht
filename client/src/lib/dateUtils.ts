/**
 * Date utility functions for consistent date formatting throughout the application
 */

type DateFormatType = 'short' | 'medium' | 'long' | 'full' | 'relative' | 'month-year' | 'iso';

/**
 * Format a date consistently based on the specified format type
 * @param date The date to format (Date object or string)
 * @param format The format type to use (short, medium, long, full, relative, month-year, iso)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, format: DateFormatType = 'medium'): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Return special string for invalid dates
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Define format options for each type
  const formatOptions: Record<Exclude<DateFormatType, 'relative' | 'month-year' | 'iso'>, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  // Special case for relative dates
  if (format === 'relative') {
    return formatRelativeDate(dateObj);
  }
  
  // Special case for month-year format
  if (format === 'month-year') {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(dateObj);
  }
  
  // Special case for ISO format
  if (format === 'iso') {
    return dateObj.toISOString();
  }
  
  // Format using the appropriate options
  return new Intl.DateTimeFormat('en-US', formatOptions[format]).format(dateObj);
}

/**
 * Format a date relative to the current date (today, yesterday, tomorrow, in X days, etc.)
 * @param date The date to format relative to today
 * @returns Relative date string
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day
  
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0); // Reset to start of day
  
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
  
  // Default to medium format for dates more than a week away
  return formatDate(date, 'medium');
}

/**
 * Calculate days until a future date or days since a past date
 * @param date The target date
 * @returns Number of days until/since the date (positive for future, negative for past)
 */
export function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Return null for invalid dates
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0); // Reset to start of day
  
  const diffMs = targetDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is in the past
 * @param date The date to check
 * @returns Boolean indicating if the date is in the past
 */
export function isDateInPast(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Return false for invalid dates
  if (isNaN(dateObj.getTime())) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0); // Reset to start of day
  
  return targetDate < today;
}

/**
 * Format date range as a single string
 * @param startDate The start date
 * @param endDate The end date
 * @param format The format to use for both dates
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: Date | string | null | undefined, 
  endDate: Date | string | null | undefined, 
  format: DateFormatType = 'medium'
): string {
  if (!startDate && !endDate) return 'N/A';
  if (!startDate) return `Until ${formatDate(endDate, format)}`;
  if (!endDate) return `From ${formatDate(startDate, format)}`;
  
  return `${formatDate(startDate, format)} - ${formatDate(endDate, format)}`;
}