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
import { Download, Upload, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface BatchImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  templateFileName: string;
  templateContent: string;
  onImport: (data: any[]) => void;
  validateRow?: (row: any, index: number) => string | null;
}

const BatchImportDialog: React.FC<BatchImportDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  templateFileName,
  templateContent,
  onImport,
  validateRow = () => null
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
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

  const parseCSV = (file: File) => {
    setParsing(true);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        const data = [];
        const validationErrors = [];
        
        // Start from row 1 (skip headers)
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const values = rows[i].split(',').map(v => v.trim());
          if (values.length !== headers.length) {
            validationErrors.push(`Row ${i}: Column count mismatch. Expected ${headers.length} columns but found ${values.length}.`);
            continue;
          }
          
          const row = headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
          }, {} as Record<string, string>);
          
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
        setParseSuccess(true);
        setParsing(false);
        
        // Call the onImport callback with the parsed data
        if (data.length > 0) {
          onImport(data);
        }
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
        
        <div className="space-y-4 py-4">
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
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onOpenChange(false)} 
            disabled={!parseSuccess || recordCount === 0}
          >
            {parseSuccess ? `Import ${recordCount} Records` : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchImportDialog;