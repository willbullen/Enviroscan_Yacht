import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Plus,
  Save,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoryItem {
  id: string | number;
  name: string;
  subcategories?: Array<{id: string | number; name: string}>;
}

// Maps CSV header keys to more user-friendly display names
const headerDisplayNames: Record<string, string> = {
  'date': 'Date',
  'description': 'Description',
  'category': 'Category',
  'amount': 'Amount',
  'total': 'Total',
  'vendor': 'Vendor',
  'vendorId': 'Vendor ID',
  'paymentMethod': 'Payment Method',
  'status': 'Status',
  'referenceNumber': 'Reference #',
  'accountNumber': 'Account #',
  'accountId': 'Account ID',
  'expenseDate': 'Expense Date',
  'transactionDate': 'Transaction Date',
  'notes': 'Notes',
  'currency': 'Currency',
  'categoryId': 'Category ID',
  'subcategory': 'Subcategory',
  'subcategoryId': 'Subcategory ID',
  'vesselId': 'Vessel ID',
  'budgetId': 'Budget ID',
  'createdById': 'Created By',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At'
};

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  templateFileName: string;
  templateContent: string;
  onImport: (data: any[]) => void;
  validateRow?: (row: any, index: number) => string | null;
  categories?: CategoryItem[];
  onAddCategory?: (category: { name: string, type?: string }) => void;
  onAddSubcategory?: (categoryId: string | number, subcategoryName: string) => void;
  vendors?: {id: number|string, name: string}[];
  accounts?: {id: number|string, accountNumber: string, accountName: string}[];
  expenseCategories?: string[];
  // Existing data for duplicate checking
  existingRecords?: any[];
}

const BatchImportDialog: React.FC<BatchImportDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  templateFileName,
  templateContent,
  onImport,
  validateRow = () => null,
  categories = [],
  onAddCategory,
  onAddSubcategory,
  vendors = [],
  accounts = [],
  expenseCategories = [],
  existingRecords = []
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [missingCategories, setMissingCategories] = useState<Set<string>>(new Set());
  const [missingSubcategories, setMissingSubcategories] = useState<Map<string, Set<string>>>(new Map());
  const [missingVendors, setMissingVendors] = useState<Set<string>>(new Set());
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorType, setNewVendorType] = useState("");
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [editingField, setEditingField] = useState<{ rowIndex: number, field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Function to handle adding a new vendor
  const handleAddVendor = async (name: string, type?: string) => {
    if (!name.trim()) return;
    
    try {
      setIsAddingVendor(true);
      
      // Make API request to create vendor
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          name: name.trim(),
          type: type?.trim() || undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create vendor: ${response.statusText}`);
      }
      
      const newVendor = await response.json();
      
      // Update vendors list in previewData
      const updatedPreviewData = previewData.map(row => {
        if (row.vendor === name && row._vendorMissing) {
          return {
            ...row,
            vendorId: newVendor.id.toString(),
            _vendorMissing: false
          };
        }
        return row;
      });
      
      // Remove vendor from missing list
      const updatedMissingVendors = new Set(missingVendors);
      updatedMissingVendors.delete(name);
      
      // Update state
      setPreviewData(updatedPreviewData);
      setMissingVendors(updatedMissingVendors);
      setNewVendorName("");
      setNewVendorType("");
      
      // Add to vendors array so it's available in dropdowns
      vendors.push(newVendor);
      
    } catch (error) {
      console.error("Error adding vendor:", error);
      // Here you might want to show an error toast
    } finally {
      setIsAddingVendor(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Reset state
    setErrors([]);
    setParseSuccess(false);
    setRecordCount(0);
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setErrors(['Please upload a CSV file.']);
      return;
    }
    
    setFile(file);
    parseCSV(file);
  };

  // Helper functions for adding categories and subcategories
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    if (onAddCategory) {
      onAddCategory({ 
        name: newCategoryName.trim(), 
        type: newCategoryType.trim() || undefined 
      });
      
      // Remove the category from the missing list
      const updatedMissing = new Set(missingCategories);
      updatedMissing.delete(newCategoryName.trim());
      setMissingCategories(updatedMissing);
      
      // Reset form
      setNewCategoryName("");
      setNewCategoryType("");
    }
  };

  const handleAddSubcategory = () => {
    if (!selectedCategoryId || !newSubcategoryName.trim() || !onAddSubcategory) return;
    
    onAddSubcategory(selectedCategoryId, newSubcategoryName.trim());
    
    // Remove the subcategory from the missing list
    const updatedMissingSubs = new Map(missingSubcategories);
    const categorySubcats = updatedMissingSubs.get(selectedCategoryId.toString());
    
    if (categorySubcats) {
      categorySubcats.delete(newSubcategoryName.trim());
      if (categorySubcats.size === 0) {
        updatedMissingSubs.delete(selectedCategoryId.toString());
      }
      setMissingSubcategories(updatedMissingSubs);
    }
    
    // Reset form
    setNewSubcategoryName("");
  };
  
  // Handle editing a field in the preview table
  const handleEditField = (rowIndex: number, field: string, value: string) => {
    setEditingField({ rowIndex, field });
    setEditValue(value);
  };
  
  // Handle saving the edited field value
  const handleSaveField = () => {
    if (!editingField) return;
    
    const { rowIndex, field } = editingField;
    const updatedData = [...previewData];
    
    if (updatedData[rowIndex]) {
      // Check if this is a duplicate record being modified
      if (updatedData[rowIndex]._isDuplicate && !updatedData[rowIndex]._isModified) {
        // The value has changed, mark it as modified
        if (updatedData[rowIndex][field] !== editValue) {
          updatedData[rowIndex]._isModified = true;
        }
      }
      
      // Update the field value
      updatedData[rowIndex][field] = editValue;
      setPreviewData(updatedData);
    }
    
    // Reset editing state
    setEditingField(null);
    setEditValue("");
  };
  
  // Handle canceling the edit
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };
  
  const handleFinalImport = () => {
    if (previewData.length > 0) {
      // Filter out unmodified duplicate records before importing
      const filteredData = previewData.filter(row => {
        // If it's a duplicate and hasn't been modified, don't include it
        if (row._isDuplicate && !row._isModified) {
          return false;
        }
        return true;
      });
      
      onImport(filteredData);
      onOpenChange(false);
    }
  };


  
  // Helper function to check if an expense is a duplicate
  const isDuplicateExpense = (expense: any) => {
    if (!existingRecords || existingRecords.length === 0) return false;
    
    return existingRecords.some((existingExpense) => {
      // Check primary matching fields (if available in the expense record)
      // Most important fields for detecting duplicates:
      
      // Description match (case insensitive, trimmed)
      const descriptionMatch = expense.description && existingExpense.description &&
        existingExpense.description.toLowerCase().trim() === expense.description.toLowerCase().trim();
      
      // Vendor match can be by ID or name (case insensitive)
      const vendorMatch = 
        (expense.vendorId && existingExpense.vendorId && 
          existingExpense.vendorId.toString() === expense.vendorId.toString()) ||
        (expense.vendor && existingExpense.vendor && 
          existingExpense.vendor.toLowerCase().trim() === expense.vendor.toLowerCase().trim());
      
      // Date match (same day)
      const dateMatch = expense.expenseDate && existingExpense.expenseDate && 
        new Date(existingExpense.expenseDate).toDateString() === new Date(expense.expenseDate).toDateString();
      
      // Amount match (handle both total and amount fields)
      const amountMatch = 
        (expense.total && existingExpense.total && 
          existingExpense.total.toString().trim() === expense.total.toString().trim()) ||
        (expense.amount && existingExpense.total && 
          existingExpense.total.toString().trim() === expense.amount.toString().trim());
        
      // Reference number match (if both have non-empty reference numbers)
      const referenceMatch = expense.referenceNumber && existingExpense.referenceNumber && 
        expense.referenceNumber.trim() !== '' && 
        existingExpense.referenceNumber.trim() === expense.referenceNumber.trim();
      
      // For an expense to be considered a duplicate, it should match on:
      // 1. Description AND Amount AND (Date OR Vendor)
      // 2. OR Reference Number (if it exists and is unique) AND (Description OR Amount)
      return (
        (descriptionMatch && amountMatch && (dateMatch || vendorMatch)) ||
        (referenceMatch && (descriptionMatch || amountMatch))
      );
    });
  };
  
  const parseCSV = (file: File) => {
    setParsing(true);
    setActiveTab("upload");
    setMissingCategories(new Set());
    setMissingSubcategories(new Map());
    setMissingVendors(new Set());
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const headerRow = rows[0].split(',').map(h => h.trim());
        setHeaders(headerRow);
        
        const data = [];
        const validationErrors = [];
        const missingCats = new Set<string>();
        const missingSubs = new Map<string, Set<string>>();
        const missingVends = new Set<string>();
        
        // Track if we found any duplicates for auto-switching to preview tab
        let hasDuplicates = false;
        
        // Check if this import has category, subcategory, or vendor fields
        const hasCategoryField = headerRow.includes('categoryId') || headerRow.includes('category');
        const hasSubcategoryField = headerRow.includes('subcategoryId') || headerRow.includes('subcategory');
        const hasVendorField = headerRow.includes('vendor');
        
        // Start from row 1 (skip headers)
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const values = rows[i].split(',').map(v => v.trim());
          if (values.length !== headerRow.length) {
            validationErrors.push(`Row ${i}: Column count mismatch. Expected ${headerRow.length} columns but found ${values.length}.`);
            continue;
          }
          
          const row = headerRow.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {} as Record<string, string>);
          
          // Check for missing categories and subcategories if we have categories
          if (hasCategoryField && categories.length > 0) {
            const categoryId = row.categoryId || row.category;
            if (categoryId) {
              // Check if category exists
              const categoryExists = categories.some(cat => 
                cat.id.toString() === categoryId.toString() || cat.name === categoryId
              );
              
              if (!categoryExists) {
                missingCats.add(categoryId);
              } else if (hasSubcategoryField) {
                // If category exists, check subcategory
                const subcategoryId = row.subcategoryId || row.subcategory;
                if (subcategoryId) {
                  const category = categories.find(cat => 
                    cat.id.toString() === categoryId.toString() || cat.name === categoryId
                  );
                  
                  if (category) {
                    const subcategoryExists = category.subcategories?.some(subcat => 
                      subcat.id.toString() === subcategoryId.toString() || subcat.name === subcategoryId
                    );
                    
                    if (!subcategoryExists) {
                      if (!missingSubs.has(categoryId)) {
                        missingSubs.set(categoryId, new Set<string>());
                      }
                      missingSubs.get(categoryId)?.add(subcategoryId);
                    }
                  }
                }
              }
            }
          }
          
          // Check for missing vendors
          if (hasVendorField && vendors.length > 0 && row.vendor) {
            const vendorName = row.vendor.trim();
            if (vendorName) {
              // Check if vendor exists
              const vendorExists = vendors.some(vendor => 
                vendor.name.toLowerCase() === vendorName.toLowerCase()
              );
              
              if (!vendorExists) {
                missingVends.add(vendorName);
                // Flag the row for vendor validation by adding a property
                row._vendorMissing = true;
              } else {
                // Find the vendor ID for this vendor name
                const vendor = vendors.find(v => v.name.toLowerCase() === vendorName.toLowerCase());
                if (vendor) {
                  row.vendorId = vendor.id.toString();
                }
              }
            }
          }
          
          // Check for duplicate expenses
          const isDuplicate = isDuplicateExpense(row);
          if (isDuplicate) {
            // Mark as duplicate, but don't prevent it from being imported
            row._isDuplicate = true;
            row._isModified = false; // Track if user has modified this duplicate
            hasDuplicates = true; // Track if we found any duplicates
          }
          
          // Custom validation from props
          const rowValidationError = validateRow ? validateRow(row, i) : null;
          if (rowValidationError) {
            validationErrors.push(`Row ${i}: ${rowValidationError}`);
            continue;
          }
          
          data.push(row);
        }
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setParsing(false);
          return;
        }
        
        setRecordCount(data.length);
        setPreviewData(data);
        setParseSuccess(true);
        setParsing(false);
        setMissingCategories(missingCats);
        setMissingSubcategories(missingSubs);
        setMissingVendors(missingVends);
        
        // Always show preview before import
        setShowPreview(true);
        setActiveTab("preview");
      } catch (error) {
        setErrors([`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`]);
        setParsing(false);
      }
    };
    
    reader.onerror = () => {
      setErrors(['Failed to read the file.']);
      setParsing(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" disabled={showPreview && !previewData.length}>
              1. Upload
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!parseSuccess || !showPreview}>
              2. Verify & Import
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Use our template to ensure your data is formatted correctly.
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <div 
              className={`border-2 border-dashed rounded-md p-6 text-center ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                className="hidden" 
              />
              
              {!file && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium">Drag and drop your CSV file here</h3>
                  <p className="text-sm text-muted-foreground">or</p>
                  <Button 
                    variant="secondary" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                  >
                    Select file
                  </Button>
                </div>
              )}
              
              {file && (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <FileText className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-medium break-all">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  
                  {parsing && (
                    <div className="flex justify-center mt-2">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  
                  {parseSuccess && (
                    <div className="flex items-center justify-center gap-2 text-green-600 mt-2">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>{recordCount} records ready for import</span>
                    </div>
                  )}
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="mt-2"
                  >
                    Choose different file
                  </Button>
                </div>
              )}
            </div>
            
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Import errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 text-sm space-y-1 mt-2">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {errors.length > 5 && (
                      <li>...and {errors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {!showPreview && parseSuccess && (
              <div className="mt-4 text-right">
                <Button 
                  onClick={() => onImport(previewData)}
                  disabled={!parseSuccess || !previewData.length}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Import {recordCount} Records
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <Alert variant="default" className="bg-muted/50 border-muted-foreground/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Ready to Review</AlertTitle>
              <AlertDescription>
                Please review your data before completing the import. Check that all values are correct and categories exist in the system.
              </AlertDescription>
            </Alert>
            
            {previewData.some(row => row._isDuplicate) && (
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Duplicate Records Detected</AlertTitle>
                <AlertDescription className="space-y-1">
                  <p>
                    {previewData.filter(row => row._isDuplicate).length} of {previewData.length} records appear to be duplicates of existing expenses.
                  </p>
                  <ul className="list-disc list-inside text-sm pl-1 text-muted-foreground">
                    <li>Unmodified duplicates will be skipped during import (highlighted in amber)</li>
                    <li>Click on any field in a duplicate record to edit it and mark for import</li>
                    <li>{previewData.filter(row => row._isDuplicate && row._isModified).length} duplicates have been modified and will be imported</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {(missingCategories.size > 0 || missingSubcategories.size > 0 || missingVendors.size > 0) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  {missingVendors.size > 0 ? 
                    "Your import contains vendors that don't exist yet. You can add them below or in the preview table." : 
                    "Your import contains references to categories or subcategories that don't exist yet. Please create them before proceeding with the import."}
                </AlertDescription>
              </Alert>
            )}
            
            {missingVendors.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Missing Vendors</CardTitle>
                  <CardDescription>
                    Create the following vendors before importing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.from(missingVendors).map((vendor) => (
                        <Badge key={vendor} variant="outline" className="text-sm py-1 px-2 bg-red-50 text-red-700 hover:bg-red-100">
                          {vendor}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Label htmlFor="new-vendor">Vendor Name</Label>
                        <Input 
                          id="new-vendor"
                          value={newVendorName} 
                          onChange={(e) => setNewVendorName(e.target.value)}
                          placeholder="Enter a vendor name"
                        />
                      </div>
                      <div className="col-span-5">
                        <Label htmlFor="vendor-type">Vendor Type (Optional)</Label>
                        <Input 
                          id="vendor-type"
                          value={newVendorType} 
                          onChange={(e) => setNewVendorType(e.target.value)}
                          placeholder="Type (e.g. 'supplier', 'contractor')"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <Button 
                          onClick={() => handleAddVendor(newVendorName, newVendorType)}
                          disabled={!newVendorName.trim() || isAddingVendor}
                          className="w-full"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {isAddingVendor ? "Adding..." : "Add"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {missingVendors.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Missing Vendors</CardTitle>
                  <CardDescription>
                    Create the following vendors before importing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.from(missingVendors).map((vendor) => (
                        <Badge key={vendor} variant="outline" className="text-sm py-1 px-2 bg-red-50 text-red-700 hover:bg-red-100">
                          {vendor}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Label htmlFor="new-vendor">Vendor Name</Label>
                        <Input 
                          id="new-vendor"
                          value={newVendorName} 
                          onChange={(e) => setNewVendorName(e.target.value)}
                          placeholder="Enter a vendor name"
                        />
                      </div>
                      <div className="col-span-5">
                        <Label htmlFor="vendor-type">Vendor Type (Optional)</Label>
                        <Input 
                          id="vendor-type"
                          value={newVendorType} 
                          onChange={(e) => setNewVendorType(e.target.value)}
                          placeholder="Enter a type (optional)"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <Button 
                          onClick={() => handleAddVendor(newVendorName, newVendorType)}
                          disabled={!newVendorName.trim() || isAddingVendor}
                          className="w-full"
                        >
                          {isAddingVendor ? (
                            <div className="flex items-center">
                              <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                              <span>Adding...</span>
                            </div>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {missingCategories.size > 0 && onAddCategory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Missing Categories</CardTitle>
                  <CardDescription>
                    Create the following categories before importing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.from(missingCategories).map((category) => (
                        <Badge key={category} variant="outline" className="text-sm py-1 px-2 bg-red-50 text-red-700 hover:bg-red-100">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Label htmlFor="new-category">Category Name</Label>
                        <Input 
                          id="new-category"
                          value={newCategoryName} 
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter a category name"
                        />
                      </div>
                      <div className="col-span-5">
                        <Label htmlFor="category-type">Category Type (Optional)</Label>
                        <Input 
                          id="category-type"
                          value={newCategoryType} 
                          onChange={(e) => setNewCategoryType(e.target.value)}
                          placeholder="Enter a type (optional)"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        <Button 
                          onClick={handleAddCategory}
                          disabled={!newCategoryName.trim()}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {missingSubcategories.size > 0 && onAddSubcategory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Missing Subcategories</CardTitle>
                  <CardDescription>
                    Create the missing subcategories for each category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(missingSubcategories.entries()).map(([catId, subcats]) => {
                      const category = categories.find(c => 
                        c.id.toString() === catId.toString() || c.name === catId
                      );
                      
                      return (
                        <div key={catId} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <h4 className="font-medium mb-2">
                            For category: {category?.name || catId}
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {Array.from(subcats).map((subcat) => (
                              <Badge key={`${catId}-${subcat}`} variant="outline" className="text-sm py-1 px-2 bg-red-50 text-red-700 hover:bg-red-100">
                                {subcat}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-12 gap-2 mt-2">
                            <div className="col-span-5">
                              <Label htmlFor={`cat-select-${catId}`}>Select Category</Label>
                              <select
                                id={`cat-select-${catId}`}
                                value={selectedCategoryId === catId ? catId.toString() : ""}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id.toString()}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-5">
                              <Label htmlFor={`subcat-${catId}`}>Subcategory Name</Label>
                              <Input 
                                id={`subcat-${catId}`}
                                value={selectedCategoryId === catId ? newSubcategoryName : ""}
                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                disabled={selectedCategoryId !== catId}
                                placeholder="Enter a subcategory name"
                              />
                            </div>
                            <div className="col-span-2 flex items-end">
                              <Button 
                                onClick={handleAddSubcategory}
                                disabled={selectedCategoryId !== catId || !newSubcategoryName.trim()}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-base">Data Preview</CardTitle>
                  <CardDescription>
                    Showing {Math.min(10, previewData.length)} of {previewData.length} records
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">Review the data before import</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[350px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]">#</TableHead>
                        {headers.map((header) => (
                          <TableHead key={header} className="font-medium">
                            {headerDisplayNames[header] || header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 10).map((row, rowIndex) => (
                        <TableRow 
                          key={rowIndex} 
                          className={`hover:bg-muted/30 ${row._isDuplicate ? 'bg-amber-50' : ''}`}
                        >
                          <TableCell className="text-muted-foreground font-mono text-xs flex items-center gap-1">
                            {rowIndex + 1}
                            {row._isDuplicate && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="ml-1 bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                                      Duplicate
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="right">
                                    <p>
                                      {row._isModified 
                                        ? "This expense exists but has been modified" 
                                        : "This expense already exists and will be skipped unless modified"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          {headers.map((header) => (
                            <TableCell key={`${rowIndex}-${header}`} className="py-2">
                              {header === 'category' && expenseCategories.length > 0 ? (
                                <Select 
                                  defaultValue={row[header] || ""}
                                  onValueChange={(value) => {
                                    const updatedData = [...previewData];
                                    updatedData[rowIndex] = { ...updatedData[rowIndex], [header]: value };
                                    setPreviewData(updatedData);
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {expenseCategories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : header === 'vendor' && vendors.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  {row._vendorMissing ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center text-red-500 font-medium">
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                            {row[header]}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Vendor doesn't exist in the system</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : null}
                                  
                                  <Select 
                                    defaultValue={row[header] || ""}
                                    onValueChange={(value) => {
                                      const updatedData = [...previewData];
                                      updatedData[rowIndex] = { 
                                        ...updatedData[rowIndex], 
                                        [header]: value, 
                                        vendorId: vendors.find(v => v.name === value)?.id || null,
                                        _vendorMissing: value === "create_new" ? true : false
                                      };
                                      setPreviewData(updatedData);
                                      
                                      // If user selected "create new", set the new vendor name
                                      if (value === "create_new") {
                                        const vendorName = row[header];
                                        if (vendorName) {
                                          setNewVendorName(vendorName);
                                          missingVendors.add(vendorName);
                                          setMissingVendors(new Set(missingVendors));
                                        }
                                      }
                                    }}
                                  >
                                    <SelectTrigger className={`w-full h-8 ${row._vendorMissing ? 'border-red-400' : ''}`}>
                                      <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {row._vendorMissing && (
                                        <div className="p-2 border-b">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                className="w-full flex items-center justify-between"
                                              >
                                                <span className="flex items-center">
                                                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                                  Create "{row[header]}"
                                                </span>
                                                <span>→</span>
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72 p-3">
                                              <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Add New Vendor</h4>
                                                <div>
                                                  <Label htmlFor={`new-vendor-${rowIndex}`}>Name</Label>
                                                  <Input 
                                                    id={`new-vendor-${rowIndex}`}
                                                    value={row[header]} 
                                                    readOnly
                                                    className="h-8 mt-1"
                                                  />
                                                </div>
                                                <div>
                                                  <Label htmlFor={`new-vendor-type-${rowIndex}`}>Type (optional)</Label>
                                                  <Input 
                                                    id={`new-vendor-type-${rowIndex}`}
                                                    placeholder="e.g. supplier, contractor"
                                                    className="h-8 mt-1"
                                                    value={newVendorType}
                                                    onChange={(e) => setNewVendorType(e.target.value)}
                                                  />
                                                </div>
                                                <Button
                                                  onClick={() => handleAddVendor(row[header], newVendorType)}
                                                  disabled={!row[header] || isAddingVendor}
                                                  className="w-full mt-2"
                                                  size="sm"
                                                >
                                                  {isAddingVendor ? "Adding..." : "Add Vendor"}
                                                </Button>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      )}
                                      {/* Get unique vendors by name to prevent duplicates */}
                                      {Array.from(new Map(vendors.map(vendor => [vendor.name, vendor])).values()).map((vendor) => (
                                        <SelectItem key={vendor.id.toString()} value={vendor.name}>
                                          {vendor.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : header === 'accountNumber' && accounts.length > 0 ? (
                                <Select 
                                  defaultValue={row[header] || ""}
                                  onValueChange={(value) => {
                                    const updatedData = [...previewData];
                                    updatedData[rowIndex] = { ...updatedData[rowIndex], [header]: value };
                                    setPreviewData(updatedData);
                                  }}
                                >
                                  <SelectTrigger className="w-full h-8">
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map((account) => (
                                      <SelectItem key={account.id.toString()} value={account.accountNumber}>
                                        {account.accountName} ({account.accountNumber})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                editingField && editingField.rowIndex === rowIndex && editingField.field === header ? (
                                  <div className="flex items-center space-x-1">
                                    <Input 
                                      className="h-7 text-sm"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveField();
                                        } else if (e.key === 'Escape') {
                                          handleCancelEdit();
                                        }
                                      }}
                                    />
                                    <Button size="sm" variant="ghost" onClick={handleSaveField} className="h-7 px-2">
                                      <Save className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div 
                                    className={`cursor-pointer hover:bg-muted/50 p-1 rounded ${
                                      row._isDuplicate ? 'hover:underline' : ''
                                    }`}
                                    onClick={() => handleEditField(rowIndex, header, row[header] || "")}
                                  >
                                    {row[header] || ""}
                                    {row._isDuplicate && !row._isModified && (
                                      <span className="ml-1 text-xs text-muted-foreground">(click to edit)</span>
                                    )}
                                  </div>
                                )
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 py-2">
                <div className="flex w-full text-sm text-muted-foreground items-center justify-between">
                  <span>Total: {previewData.length} records</span>
                  {previewData.length > 10 && (
                    <span>
                      ...and {previewData.length - 10} more records
                    </span>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {activeTab === "preview" && (
            <Button 
              onClick={handleFinalImport} 
              disabled={missingCategories.size > 0 || missingSubcategories.size > 0 || missingVendors.size > 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {missingCategories.size > 0 || missingSubcategories.size > 0 
                ? "Add Required Categories First" 
                : missingVendors.size > 0
                  ? "Add Required Vendors First"
                  : `Import ${previewData.filter(row => !row._isDuplicate || row._isModified).length} Records${
                      previewData.some(row => row._isDuplicate && !row._isModified) 
                        ? ` (${previewData.filter(row => row._isDuplicate && !row._isModified).length} duplicates will be skipped)`
                        : ''
                    }`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchImportDialog;