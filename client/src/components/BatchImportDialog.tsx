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
  Save 
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

interface CategoryItem {
  id: string | number;
  name: string;
  subcategories?: Array<{id: string | number; name: string}>;
}

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
  onAddSubcategory
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const handleFinalImport = () => {
    if (previewData.length > 0) {
      onImport(previewData);
      onOpenChange(false);
    }
  };

  const parseCSV = (file: File) => {
    setParsing(true);
    setActiveTab("upload");
    setMissingCategories(new Set());
    setMissingSubcategories(new Map());
    
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
        
        // Check if this import has category or subcategory fields
        const hasCategoryField = headerRow.includes('categoryId') || headerRow.includes('category');
        const hasSubcategoryField = headerRow.includes('subcategoryId') || headerRow.includes('subcategory');
        
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
          
          // Custom validation
          const validationError = validateRow(row, i);
          if (validationError) {
            validationErrors.push(`Row ${i}: ${validationError}`);
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
      <DialogContent className="max-w-md sm:max-w-lg">
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
            
            {(missingCategories.size > 0 || missingSubcategories.size > 0) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  Your import contains references to categories or subcategories that don't exist yet.
                  Please create them before proceeding with the import.
                </AlertDescription>
              </Alert>
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
                        <Badge key={category} variant="outline" className="text-sm py-1 px-2">
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
                              <Badge key={`${catId}-${subcat}`} variant="outline" className="text-sm py-1 px-2">
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
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 10).map((row, rowIndex) => (
                        <TableRow key={rowIndex} className="hover:bg-muted/30">
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {rowIndex + 1}
                          </TableCell>
                          {headers.map((header) => (
                            <TableCell key={`${rowIndex}-${header}`} className="py-2">
                              {row[header] || ""}
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
              disabled={missingCategories.size > 0 || missingSubcategories.size > 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {missingCategories.size > 0 || missingSubcategories.size > 0 
                ? "Add Required Categories First" 
                : `Import ${previewData.length} Records`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchImportDialog;